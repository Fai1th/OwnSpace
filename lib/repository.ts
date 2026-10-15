import { randomUUID } from "node:crypto";
import { sanitizeProfile, canUsePremium, type Profile, type ProfileRecord } from "./profile";
import { assertPlanAllows } from "./plans";
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
CREATE TABLE IF NOT EXISTS checkout_sessions(session_id TEXT PRIMARY KEY,owner TEXT NOT NULL,price_id TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS checkout_attempts(owner TEXT PRIMARY KEY,attempt_key TEXT NOT NULL,session_id TEXT);
CREATE TABLE IF NOT EXISTS billing_events(id TEXT PRIMARY KEY,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS reports(id BIGSERIAL PRIMARY KEY,handle TEXT NOT NULL,reason TEXT NOT NULL,details TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS connections(owner TEXT PRIMARY KEY,account_id TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS deletion_events(id TEXT PRIMARY KEY,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS user_agreements(owner TEXT NOT NULL,version TEXT NOT NULL,accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),PRIMARY KEY(owner,version));
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
  async agreement(owner: string, version: string) {
    const result = await this.db.query(
      "SELECT version,accepted_at FROM user_agreements WHERE owner=$1 AND version=$2",
      [owner, version],
    );
    const row = result.rows[0];
    return row ? { version: String(row.version), acceptedAt: String(row.accepted_at) } : null;
  }
  async acceptAgreement(owner: string, version: string) {
    await this.db.query(
      "INSERT INTO user_agreements(owner,version) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [owner, version],
    );
    return (await this.agreement(owner, version))!;
  }
  async exportAccount(owner: string) {
    const [profile, entitlement, receipts, purchases, connection] = await Promise.all([
      this.get(owner),
      this.entitlement(owner),
      this.db.query(
        "SELECT version,accepted_at FROM user_agreements WHERE owner=$1 ORDER BY accepted_at",
        [owner],
      ),
      this.db.query(
        "SELECT payment_id,status,created_at FROM purchases WHERE owner=$1 ORDER BY created_at",
        [owner],
      ),
      this.connection(owner),
    ]);
    return {
      profile,
      entitlement,
      github: { connected: Boolean(connection) },
      agreements: receipts.rows.map((row) => ({
        version: String(row.version),
        acceptedAt: String(row.accepted_at),
      })),
      purchases: purchases.rows.map((row) => ({
        paymentId: String(row.payment_id),
        status: String(row.status),
        createdAt: String(row.created_at),
      })),
    };
  }
  async get(owner: string) {
    const r = await this.db.query("SELECT * FROM profiles WHERE owner=$1", [owner]);
    return r.rows[0] ? record(r.rows[0]) : null;
  }
  async entitlement(owner: string) {
    const active = await this.db.query(
      "SELECT payment_id FROM purchases WHERE owner=$1 AND status IN ('paid','dispute_won') LIMIT 1",
      [owner],
    );
    if (active.rows.length) return "paid";
    const latest = await this.db.query(
      "SELECT status FROM purchases WHERE owner=$1 ORDER BY created_at DESC LIMIT 1",
      [owner],
    );
    return latest.rows[0] ? String(latest.rows[0].status) : "free";
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
          "SELECT status FROM purchases WHERE owner=$1 AND status IN ('paid','dispute_won') LIMIT 1",
          [owner],
        );
        const entitlement = purchase.rows.length ? "paid" : previous?.entitlement || "free";
        assertPlanAllows(profile, canUsePremium(entitlement));
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
      if (publish)
        assertPlanAllows(current.draft as Profile, canUsePremium(String(current.entitlement)));
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
      if (deleteAccount) {
        await tx.query("DELETE FROM checkout_attempts WHERE owner=$1", [owner]);
        await tx.query("UPDATE checkout_sessions SET owner='deleted' WHERE owner=$1", [owner]);
        await tx.query("UPDATE purchases SET owner='deleted' WHERE owner=$1", [owner]);
        await tx.query("DELETE FROM user_agreements WHERE owner=$1", [owner]);
      }
    });
  }
  async approvedCheckout(sessionId: string) {
    const row = (
      await this.db.query("SELECT owner,price_id FROM checkout_sessions WHERE session_id=$1", [
        sessionId,
      ])
    ).rows[0];
    return row ? { owner: String(row.owner), priceId: String(row.price_id) } : null;
  }
  async revokedPayment(owner: string, paymentId: string) {
    return (
      (
        await this.db.query(
          "SELECT payment_id FROM purchases WHERE owner=$1 AND payment_id=$2 AND status IN ('refunded','dispute_lost')",
          [owner, paymentId],
        )
      ).rows.length > 0
    );
  }
  async checkoutSession(owner: string) {
    const row = (
      await this.db.query("SELECT session_id FROM checkout_attempts WHERE owner=$1", [owner])
    ).rows[0];
    return row?.session_id ? String(row.session_id) : null;
  }
  async checkout<T>(
    owner: string,
    open: (attempt: {
      key: string;
      sessionId: string | null;
      entitlement: string;
      isRevoked: (paymentId: string) => Promise<boolean>;
    }) => Promise<{ sessionId: string; priceId: string; value: T }>,
  ) {
    // Commit the seed before contacting Stripe so a lost response can be retried safely.
    await this.db.query(
      "INSERT INTO checkout_attempts(owner,attempt_key) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [owner, randomUUID()],
    );
    return this.db.transaction(async (tx) => {
      const row = (
        await tx.query("SELECT * FROM checkout_attempts WHERE owner=$1 FOR UPDATE", [owner])
      ).rows[0];
      const active = await tx.query(
        "SELECT status FROM purchases WHERE owner=$1 AND status IN ('paid','dispute_won') LIMIT 1",
        [owner],
      );
      const latest = active.rows.length
        ? active
        : await tx.query(
            "SELECT status FROM purchases WHERE owner=$1 ORDER BY created_at DESC LIMIT 1",
            [owner],
          );
      const result = await open({
        key: String(row.attempt_key),
        sessionId: row.session_id ? String(row.session_id) : null,
        entitlement: active.rows.length ? "paid" : String(latest.rows[0]?.status || "free"),
        isRevoked: async (paymentId) =>
          (
            await tx.query(
              "SELECT payment_id FROM purchases WHERE owner=$1 AND payment_id=$2 AND status IN ('refunded','dispute_lost')",
              [owner, paymentId],
            )
          ).rows.length > 0,
      });
      await tx.query(
        "INSERT INTO checkout_sessions(session_id,owner,price_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
        [result.sessionId, owner, result.priceId],
      );
      await tx.query("UPDATE checkout_attempts SET session_id=$2 WHERE owner=$1", [
        owner,
        result.sessionId,
      ]);
      return result.value;
    });
  }
  async billing(event: {
    eventId: string;
    owner?: string;
    paymentId: string;
    sessionId?: string;
    status: "paid" | "refunded" | "disputed" | "dispute_won" | "dispute_lost";
  }) {
    await this.db.transaction(async (tx) => {
      if (event.sessionId) {
        const approved = (
          await tx.query("SELECT owner FROM checkout_sessions WHERE session_id=$1 FOR UPDATE", [
            event.sessionId,
          ])
        ).rows[0];
        if (approved && (approved.owner === "deleted" || approved.owner !== event.owner)) return;
      }
      const inserted = await tx.query(
        "INSERT INTO billing_events(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
        [event.eventId],
      );
      if (!inserted.rows.length) return;
      await tx.query(
        "INSERT INTO purchases(payment_id,owner,status) VALUES($1,$2,$3) ON CONFLICT(payment_id) DO UPDATE SET owner=CASE WHEN purchases.owner='pending' THEN EXCLUDED.owner ELSE purchases.owner END,status=CASE WHEN purchases.status='refunded' OR EXCLUDED.status='refunded' THEN 'refunded' WHEN EXCLUDED.status IN ('dispute_won','dispute_lost') THEN EXCLUDED.status WHEN purchases.status IN ('dispute_won','dispute_lost') THEN purchases.status WHEN purchases.status='disputed' AND EXCLUDED.status='paid' THEN 'disputed' ELSE EXCLUDED.status END",
        [event.paymentId, event.owner || "pending", event.status],
      );
      const p = await tx.query("SELECT owner,status FROM purchases WHERE payment_id=$1", [
        event.paymentId,
      ]);
      const owner = p.rows[0]?.owner;
      if (!owner || owner === "pending" || owner === "deleted") return;
      const active = await tx.query(
        "SELECT payment_id FROM purchases WHERE owner=$1 AND status IN ('paid','dispute_won') LIMIT 1",
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
