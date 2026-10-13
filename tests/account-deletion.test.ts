import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { Repository, schemaSql } from "../lib/repository";
import { emptyProfile } from "../lib/profile";
const state = vi.hoisted(() => ({ repo: null as unknown as Repository, removeUser: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: "account-fixture-user" }),
  clerkClient: async () => ({ users: { deleteUser: state.removeUser } }),
}));
vi.mock("../lib/db", () => ({ getRepository: async () => state.repo }));
vi.mock("../lib/config", () => ({
  siteConfig: { authEnabled: true },
  getSiteUrl: () => "http://localhost:3000",
}));
import { DELETE } from "../app/api/account/route";
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
it("finishes a retry when the provider account is already deleted", async () => {
  state.removeUser.mockRejectedValueOnce(Object.assign(Error("Not found"), { status: 404 }));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect((await DELETE(req())).status).toBe(200);
  } finally {
    log.mockRestore();
  }
});
const req = () =>
  new Request("http://localhost:3000/api/account", {
    method: "DELETE",
    headers: { origin: "http://localhost:3000" },
  });
it("retains the surviving account's upgrade when Clerk deletion fails", async () => {
  await state.repo.save(
    "account-fixture-user",
    { ...emptyProfile, handle: "account-delete-fixture" },
    0,
  );
  await state.repo.billing({
    eventId: "paid_account",
    owner: "account-fixture-user",
    paymentId: "pi_account_fixture",
    status: "paid",
  });
  state.removeUser.mockRejectedValueOnce(Error("Provider unavailable"));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect((await DELETE(req())).status).toBe(500);
  } finally {
    log.mockRestore();
  }
  const recovered = await state.repo.save(
    "account-fixture-user",
    { ...emptyProfile, handle: "account-recovered" },
    0,
  );
  expect(recovered.entitlement).toBe("paid");
});
it("removes the purchase association only after confirmed account deletion", async () => {
  state.removeUser.mockResolvedValueOnce({ id: "account-fixture-user" });
  expect((await DELETE(req())).status).toBe(200);
  const stored = await db.query<{ owner: string }>(
    "SELECT owner FROM purchases WHERE payment_id=$1",
    ["pi_account_fixture"],
  );
  expect(stored.rows[0].owner).toBe("deleted");
  expect(await state.repo.get("account-fixture-user")).toBeNull();
});
