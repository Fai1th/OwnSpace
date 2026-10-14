import { beforeAll, afterAll, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { Repository, schemaSql } from "../lib/repository";
import { emptyProfile } from "../lib/profile";
const state = vi.hoisted(() => ({ owner: "legal-alice", repo: null as unknown as Repository }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: state.owner || null }) }));
vi.mock("../lib/config", () => ({
  siteConfig: { authEnabled: true, url: "http://localhost:3000" },
  getSiteUrl: () => "http://localhost:3000",
}));
vi.mock("../lib/legal-content", () => ({ LEGAL_VERSION: "terms-v2" }));
vi.mock("../lib/db", () => ({ getRepository: async () => state.repo }));
import { GET, POST } from "../app/api/agreement/route";
import { POST as publish } from "../app/api/publish/route";
let db: PGlite;
beforeAll(async () => {
  process.env.CLERK_SECRET_KEY = "test-only-not-a-real-key";
  db = new PGlite();
  await db.exec(schemaSql);
  state.repo = new Repository({
    query: async (s, p) => db.query(s, p),
    transaction: async (fn) =>
      db.transaction(async (tx) => fn({ query: async (s, p) => tx.query(s, p) })),
  });
  await state.repo.save("legal-alice", { ...emptyProfile, handle: "legal-alice" }, 0);
});
afterAll(async () => {
  delete process.env.CLERK_SECRET_KEY;
  await db.close();
});
const req = (body: unknown, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/agreement", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
it("blocks publication before agreement and permits it after current explicit acceptance", async () => {
  expect((await publish(req({ publish: true, version: 1 }))).status).toBe(428);
  expect(
    (await POST(req({ version: "terms-v2", acceptedTerms: false, ageConfirmed: true }))).status,
  ).toBe(400);
  expect(
    (await POST(req({ version: "terms-v1", acceptedTerms: true, ageConfirmed: true }))).status,
  ).toBe(400);
  expect(
    (
      await POST(
        req({ version: "terms-v2", acceptedTerms: true, ageConfirmed: true, owner: "victim" }),
      )
    ).status,
  ).toBe(200);
  expect(await state.repo.agreement("victim", "terms-v2")).toBeNull();
  expect((await publish(req({ publish: true, version: 1 }))).status).toBe(200);
});
it("requires agreement even when a page appears after a preliminary profile lookup", async () => {
  state.owner = "legal-race";
  await state.repo.save(state.owner, { ...emptyProfile, handle: "legal-race" }, 0);
  const lookup = vi.spyOn(state.repo, "get").mockResolvedValueOnce(null);
  try {
    expect((await publish(req({ publish: true, version: 1 }))).status).toBe(428);
    expect(await state.repo.publicProfile("legal-race")).toBeNull();
  } finally {
    lookup.mockRestore();
    state.owner = "legal-alice";
  }
});
it("rejects cross-origin or signed-out agreement mutations", async () => {
  expect((await POST(req({}, "https://attacker.example"))).status).toBe(403);
  state.owner = "";
  expect((await GET()).status).toBe(401);
  state.owner = "legal-alice";
});
