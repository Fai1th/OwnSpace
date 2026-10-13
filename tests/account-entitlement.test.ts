import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { Repository, schemaSql } from "../lib/repository";
import { emptyProfile } from "../lib/profile";
const state = vi.hoisted(() => ({
  owner: "user_premium_fixture",
  repo: null as unknown as Repository,
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: state.owner || null }) }));
vi.mock("../lib/db", () => ({ getRepository: async () => state.repo }));
vi.mock("../lib/config", () => ({
  siteConfig: { authEnabled: true },
  getSiteUrl: () => "http://localhost:3000",
}));
import { GET as profile } from "../app/api/profile/route";
import { GET as account } from "../app/api/account/route";
let db: PGlite;
const original = process.env.CLERK_SECRET_KEY;
beforeAll(async () => {
  process.env.CLERK_SECRET_KEY = "sk_test_local_fixture";
  db = new PGlite();
  await db.exec(schemaSql);
  state.repo = new Repository({
    query: async (s, p) => db.query(s, p),
    transaction: async (fn) =>
      db.transaction(async (tx) => fn({ query: async (s, p) => tx.query(s, p) })),
  });
});
afterAll(async () => {
  if (original === undefined) delete process.env.CLERK_SECRET_KEY;
  else process.env.CLERK_SECRET_KEY = original;
  await db.close();
});
it("reports the account's upgrade after its page has been deleted", async () => {
  await state.repo.save(state.owner, { ...emptyProfile, handle: "premium-status" }, 0);
  await state.repo.billing({
    eventId: "status_paid",
    owner: state.owner,
    paymentId: "pi_status",
    status: "paid",
  });
  await state.repo.delete(state.owner);
  const r = await profile();
  const body = await r.json();
  expect(body.profile).toBeNull();
  expect(body.entitlement).toBe("paid");
});
it("provides a small private status response without exposing page content", async () => {
  state.owner = "user_premium_fixture";
  const r = await account();
  expect(await r.json()).toEqual({ entitlement: "paid" });
  expect(r.headers.get("cache-control")).toContain("no-store");
});
it("does not expose another account's upgrade", async () => {
  state.owner = "user_other_fixture";
  const body = await (await profile()).json();
  expect(body.entitlement).toBe("free");
  expect(await (await account()).json()).toEqual({ entitlement: "free" });
});
