import { sanitizeProfile, canUsePremium, type Profile, type ProfileRecord } from "./profile";
export type QueryDb = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};
export type Db = QueryDb & { transaction: <T>(fn: (tx: QueryDb) => Promise<T>) => Promise<T> };
export const schemaSql = `
CREATE TABLE IF NOT EXISTS profiles(owner TEXT PRIMARY KEY,handle TEXT UNIQUE NOT NULL,draft JSONB NOT NULL,published JSONB,version INTEGER NOT NULL DEFAULT 1,entitlement TEXT NOT NULL DEFAULT 'free',views INTEGER NOT NULL DEFAULT 0,updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS handles(handle TEXT PRIMARY KEY,owner TEXT NOT NULL);
INSERT INTO handles(handle,owner) SELECT handle,owner FROM profiles ON CONFLICT DO NOTHING;
INSERT INTO handles(handle,owner) SELECT published->>'handle',owner FROM profiles WHERE published IS NOT NULL ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS purchases(payment_id TEXT PRIMARY KEY,owner TEXT NOT NULL,status TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS billing_events(id TEXT PRIMARY KEY,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS reports(id BIGSERIAL PRIMARY KEY,handle TEXT NOT NULL,reason TEXT NOT NULL,details TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS connections(owner TEXT PRIMARY KEY,account_id TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS deletion_events(id TEXT PRIMARY KEY,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
`;
function record(r: Record<string, unknown>): ProfileRecord {
  return {
    owner: String(r.owner),
    handle: String(r.handle),
    draft: r.draft as Profile,
    published: r.published as Profile | null,
    version: Number(r.version),
    entitlement: String(r.entitlement),
    views: Number(r.views),
    updatedAt: String(r.updated_at),
  };
}
async function releaseUnused(tx: QueryDb, owner: string) {
  await tx.query(
    "DELETE FROM handles WHERE owner=$1 AND handle NOT IN (SELECT handle FROM profiles WHERE owner=$1 UNION SELECT published->>'handle' FROM profiles WHERE owner=$1 AND published IS NOT NULL)",
    [owner],
  );
}
export class Repository {
  constructor(private db: Db) {}
  async get(owner: string) {
    const r = await this.db.query("SELECT * FROM profiles WHERE owner=$1", [owner]);
    return r.rows[0] ? record(r.rows[0]) : null;
  }
  async publicProfile(handle: string) {
    const r = await this.db.query(
      "SELECT published,entitlement FROM profiles WHERE published->>'handle'=$1",
      [handle],
    );
    return r.rows[0]
      ? sanitizeProfile(
          r.rows[0].published as Profile,
          canUsePremium(String(r.rows[0].entitlement)),
        )
      : null;
  }
  async save(owner: string, profile: Profile, version: number) {
    try {
      return await this.db.transaction(async (tx) => {
        const prior = await tx.query("SELECT * FROM profiles WHERE owner=$1 FOR UPDATE", [owner]);
        const previous = prior.rows[0] ? record(prior.rows[0]) : null;
        if ((previous?.version || 0) !== version)
          throw new Error("Your page changed in another tab. Reload before saving.");
        const purchase = await tx.query(
          "SELECT status FROM purchases WHERE owner=$1 AND status='paid' LIMIT 1",
          [owner],
        );
        const entitlement = purchase.rows.length ? "paid" : previous?.entitlement || "free";
        const safe = sanitizeProfile(profile, canUsePremium(entitlement));
        const reservation = await tx.query(
          "INSERT INTO handles(handle,owner) VALUES($1,$2) ON CONFLICT(handle) DO UPDATE SET owner=handles.owner RETURNING owner",
          [safe.handle, owner],
        );
        if (reservation.rows[0].owner !== owner)
          throw new Error("That address is already taken. Choose another.");
        if (previous)
          await tx.query(
            "UPDATE profiles SET handle=$2,draft=$3,version=version+1,entitlement=$4,updated_at=now() WHERE owner=$1",
            [owner, safe.handle, JSON.stringify(safe), entitlement],
          );
        else
          await tx.query(
            "INSERT INTO profiles(owner,handle,draft,entitlement) VALUES($1,$2,$3,$4)",
            [owner, safe.handle, JSON.stringify(safe), entitlement],
          );
        await releaseUnused(tx, owner);
        return record((await tx.query("SELECT * FROM profiles WHERE owner=$1", [owner])).rows[0]);
      });
    } catch (e) {
      if ((e as { code?: string }).code === "23505")
        throw new Error("That address is already taken. Choose another.");
      throw e;
    }
  }
  async publish(owner: string, publish: boolean, version?: number) {
    return this.db.transaction(async (tx) => {
      const rows = await tx.query("SELECT * FROM profiles WHERE owner=$1 FOR UPDATE", [owner]);
      const current = rows.rows[0];
      if (!current) throw new Error("Save your page before publishing.");
      if (version !== undefined && Number(current.version) !== version)
        throw new Error("Your page changed in another tab. Reload before publishing.");
      const snapshot = publish
        ? JSON.stringify(
            sanitizeProfile(current.draft as Profile, canUsePremium(String(current.entitlement))),
          )
        : null;
      await tx.query("UPDATE profiles SET published=$2,updated_at=now() WHERE owner=$1", [
        owner,
        snapshot,
      ]);
      await releaseUnused(tx, owner);
      return record((await tx.query("SELECT * FROM profiles WHERE owner=$1", [owner])).rows[0]);
    });
  }
  async delete(owner: string, deleteAccount = false) {
    await this.db.transaction(async (tx) => {
      await tx.query("DELETE FROM profiles WHERE owner=$1", [owner]);
      await tx.query("DELETE FROM handles WHERE owner=$1", [owner]);
      await tx.query("DELETE FROM connections WHERE owner=$1", [owner]);
      if (deleteAccount)
        await tx.query("UPDATE purchases SET owner='deleted' WHERE owner=$1", [owner]);
    });
  }
  async billing(event: {
    eventId: string;
    owner?: string;
    paymentId: string;
    status: "paid" | "refunded" | "disputed";
  }) {
    await this.db.transaction(async (tx) => {
      const inserted = await tx.query(
        "INSERT INTO billing_events(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
        [event.eventId],
      );
      if (!inserted.rows.length) return;
      await tx.query(
        "INSERT INTO purchases(payment_id,owner,status) VALUES($1,$2,$3) ON CONFLICT(payment_id) DO UPDATE SET owner=CASE WHEN purchases.owner='pending' THEN EXCLUDED.owner ELSE purchases.owner END,status=CASE WHEN purchases.status='refunded' THEN 'refunded' ELSE EXCLUDED.status END",
        [event.paymentId, event.owner || "pending", event.status],
      );
      const p = await tx.query("SELECT owner,status FROM purchases WHERE payment_id=$1", [
        event.paymentId,
      ]);
      const owner = p.rows[0]?.owner;
      if (!owner || owner === "pending" || owner === "deleted") return;
      const active = await tx.query(
        "SELECT payment_id FROM purchases WHERE owner=$1 AND status='paid' LIMIT 1",
        [owner],
      );
      await tx.query("UPDATE profiles SET entitlement=$2 WHERE owner=$1", [
        owner,
        active.rows.length ? "paid" : String(p.rows[0].status),
      ]);
    });
  }
  async rateLimit(key: string, limit: number, seconds = 60) {
    const r = await this.db.query(
      "INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,now()+($2 * interval '1 second')) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.count+1 END,expires_at=CASE WHEN rate_limits.expires_at<now() THEN now()+($2 * interval '1 second') ELSE rate_limits.expires_at END RETURNING count",
      [key, seconds],
    );
    return Number(r.rows[0].count) <= limit;
  }
  async report(handle: string, reason: string, details: string) {
    await this.db.query("INSERT INTO reports(handle,reason,details) VALUES($1,$2,$3)", [
      handle,
      reason,
      details,
    ]);
  }
  async view(handle: string) {
    await this.db.query("UPDATE profiles SET views=views+1 WHERE published->>'handle'=$1", [
      handle,
    ]);
  }
  async connection(owner: string) {
    return (await this.db.query("SELECT account_id FROM connections WHERE owner=$1", [owner]))
      .rows[0]?.account_id as string | undefined;
  }
  async setConnection(owner: string, id: string | null) {
    if (id)
      await this.db.query(
        "INSERT INTO connections(owner,account_id) VALUES($1,$2) ON CONFLICT(owner) DO UPDATE SET account_id=$2",
        [owner, id],
      );
    else await this.db.query("DELETE FROM connections WHERE owner=$1", [owner]);
  }
}
