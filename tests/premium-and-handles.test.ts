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
it("keeps an account's purchased upgrade when only its page is deleted", async () => {
  await repo.save("buyer", { ...emptyProfile, handle: "buyer-one" }, 0);
  await repo.billing({
    eventId: "premium-first",
    owner: "buyer",
    paymentId: "pi_buyer",
    status: "paid",
  });
  await repo.delete("buyer");
  const page = await repo.save(
    "buyer",
    { ...emptyProfile, handle: "buyer-new", showBrand: false, font: "mono" },
    0,
  );
  expect(page.entitlement).toBe("paid");
  expect(page.draft.showBrand).toBe(false);
});
it("does not move the live URL until a handle change is published", async () => {
  await repo.save("rename", { ...emptyProfile, handle: "old-address" }, 0);
  await repo.publish("rename", true);
  await repo.save("rename", { ...emptyProfile, handle: "new-address" }, 1);
  expect(await repo.publicProfile("old-address")).not.toBeNull();
  expect(await repo.publicProfile("new-address")).toBeNull();
  await expect(
    repo.save("intruder", { ...emptyProfile, handle: "old-address" }, 0),
  ).rejects.toThrow("already taken");
  await repo.publish("rename", true);
  expect(await repo.publicProfile("new-address")).not.toBeNull();
  expect(await repo.publicProfile("old-address")).toBeNull();
});
