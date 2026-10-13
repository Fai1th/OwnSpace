import { beforeAll, afterAll, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { Repository, schemaSql } from "../lib/repository";
import { emptyProfile } from "../lib/profile";
let db: PGlite;
let repo: Repository;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(schemaSql);
  repo = new Repository({
    query: async (sql, params) => db.query(sql, params),
    transaction: async (fn) =>
      db.transaction(async (tx) => fn({ query: async (s, p) => tx.query(s, p) })),
  });
});
afterAll(async () => {
  await db.close();
});
it("keeps drafts private and separates publication snapshots", async () => {
  const p = { ...emptyProfile, handle: "alice", displayName: "Alice" };
  await repo.save("alice-user", p, 0);
  expect(await repo.publicProfile("alice")).toBeNull();
  await repo.publish("alice-user", true);
  await repo.save("alice-user", { ...p, bio: "Private draft" }, 1);
  expect((await repo.publicProfile("alice"))?.bio).not.toBe("Private draft");
  expect(await repo.get("bob-user")).toBeNull();
  await repo.publish("alice-user", false);
  expect(await repo.publicProfile("alice")).toBeNull();
});
it("prevents another account claiming the same handle", async () => {
  await expect(repo.save("bob-user", { ...emptyProfile, handle: "alice" }, 0)).rejects.toThrow(
    "already taken",
  );
});
it("rejects stale updates instead of overwriting another tab", async () => {
  await expect(repo.save("alice-user", { ...emptyProfile, handle: "alice" }, 0)).rejects.toThrow(
    "changed in another tab",
  );
});
it("grants a purchase once and revokes premium on refund", async () => {
  await repo.billing({
    eventId: "evt_paid",
    owner: "alice-user",
    paymentId: "pi_1",
    status: "paid",
  });
  await repo.billing({
    eventId: "evt_paid",
    owner: "alice-user",
    paymentId: "pi_1",
    status: "paid",
  });
  expect((await repo.get("alice-user"))?.entitlement).toBe("paid");
  await repo.billing({ eventId: "evt_refund", paymentId: "pi_1", status: "refunded" });
  expect((await repo.get("alice-user"))?.entitlement).toBe("refunded");
});
it("rate limits mutations atomically", async () => {
  expect(await repo.rateLimit("test", 2)).toBe(true);
  expect(await repo.rateLimit("test", 2)).toBe(true);
  expect(await repo.rateLimit("test", 2)).toBe(false);
});
it("deletes the owner's profile without deleting another owner's data", async () => {
  await repo.save("bob-user", { ...emptyProfile, handle: "bob-user" }, 0);
  await repo.delete("alice-user");
  expect(await repo.get("alice-user")).toBeNull();
  expect(await repo.get("bob-user")).not.toBeNull();
});
