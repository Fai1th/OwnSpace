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
    query: async (s, p) => db.query(s, p),
    transaction: async (fn) =>
      db.transaction(async (tx) => fn({ query: async (s, p) => tx.query(s, p) })),
  });
});
afterAll(async () => db.close());
it("does not grant refunded purchases when the refund webhook arrives first", async () => {
  await repo.save("late-buyer", { ...emptyProfile, handle: "late-buyer" }, 0);
  await repo.billing({ eventId: "refund-first", paymentId: "late-pi", status: "refunded" });
  await repo.billing({
    eventId: "complete-later",
    paymentId: "late-pi",
    owner: "late-buyer",
    status: "paid",
  });
  expect((await repo.get("late-buyer"))?.entitlement).toBe("refunded");
});
it("rejects publishing if another tab saved a newer private draft", async () => {
  await repo.save("race-owner", { ...emptyProfile, handle: "race-owner" }, 0);
  await repo.save(
    "race-owner",
    { ...emptyProfile, handle: "race-owner", bio: "Not ready to share" },
    1,
  );
  await expect(repo.publish("race-owner", true, 1)).rejects.toThrow("changed in another tab");
  expect(await repo.publicProfile("race-owner")).toBeNull();
});
