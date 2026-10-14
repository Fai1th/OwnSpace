import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { Repository, schemaSql } from "../lib/repository";
let db: PGlite;
let repo: Repository;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(schemaSql);
  repo = new Repository({
    query: async (s, p) => db.query(s, p),
    transaction: async (fn) =>
      db.transaction(async (tx) => fn({ query: async (s, p) => tx.query(s, p) })),
  });
});
afterAll(async () => db.close());
it("records acceptance for one owner and one specific version without silently accepting later changes", async () => {
  expect(await repo.agreement("alice", "v1")).toBeNull();
  const first = await repo.acceptAgreement("alice", "v1");
  expect(first.version).toBe("v1");
  expect(await repo.agreement("bob", "v1")).toBeNull();
  expect(await repo.agreement("alice", "v2")).toBeNull();
  const repeated = await repo.acceptAgreement("alice", "v1");
  expect(repeated.acceptedAt).toBe(first.acceptedAt);
});
it("exports the owner's own agreement and purchases and removes agreement history only on account deletion", async () => {
  await repo.billing({
    eventId: "legal-purchase",
    owner: "alice",
    paymentId: "pi-alice",
    status: "paid",
  });
  await repo.billing({ eventId: "legal-other", owner: "bob", paymentId: "pi-bob", status: "paid" });
  await repo.delete("alice");
  expect(await repo.agreement("alice", "v1")).not.toBeNull();
  const data = await repo.exportAccount("alice");
  expect(data.agreements).toHaveLength(1);
  expect(data.purchases).toHaveLength(1);
  expect(data.purchases[0].paymentId).toBe("pi-alice");
  await repo.delete("alice", true);
  expect(await repo.agreement("alice", "v1")).toBeNull();
});
