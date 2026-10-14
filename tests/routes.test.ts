import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { Repository, schemaSql } from "../lib/repository";
import { emptyProfile } from "../lib/profile";
import { LEGAL_VERSION } from "../lib/legal-content";
const state = vi.hoisted(() => ({ owner: "user-a", repo: null as unknown as Repository }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: state.owner || null }) }));
vi.mock("../lib/config", () => ({
  siteConfig: { authEnabled: true, url: "http://localhost:3000" },
  getSiteUrl: () => "http://localhost:3000",
}));
vi.mock("../lib/db", () => ({ getRepository: async () => state.repo }));
import { GET, PUT } from "../app/api/profile/route";
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
});
afterAll(async () => {
  delete process.env.CLERK_SECRET_KEY;
  await db.close();
});
const request = (body: unknown, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify(body),
  });
it("rejects unauthenticated and cross-origin access before mutation", async () => {
  state.owner = "";
  expect((await GET()).status).toBe(401);
  state.owner = "user-a";
  expect((await PUT(request({}, "https://attacker.example"))).status).toBe(403);
});
it("uses server identity and strips injected owner fields", async () => {
  state.owner = "user-a";
  const r = await PUT(
    request({ owner: "victim", version: 0, profile: { ...emptyProfile, handle: "route-alice" } }),
  );
  expect(r.status).toBe(200);
  expect(await state.repo.get("victim")).toBeNull();
  expect((await state.repo.get("user-a"))?.handle).toBe("route-alice");
});
it("prevents publication by another owner", async () => {
  state.owner = "user-b";
  await state.repo.acceptAgreement(state.owner, LEGAL_VERSION);
  const r = await publish(
    new Request("http://localhost:3000/api/publish", {
      method: "POST",
      headers: { origin: "http://localhost:3000", "Content-Type": "application/json" },
      body: JSON.stringify({ publish: true, version: 1, owner: "user-a" }),
    }),
  );
  expect(r.status).toBe(409);
  expect(await state.repo.publicProfile("route-alice")).toBeNull();
});
it("rejects unsafe links and oversized request bodies", async () => {
  state.owner = "user-a";
  expect(
    (
      await PUT(
        request({
          version: 1,
          profile: {
            ...emptyProfile,
            handle: "route-alice",
            links: [{ id: "x", title: "x", url: "javascript:alert(1)", enabled: true }],
          },
        }),
      )
    ).status,
  ).toBe(400);
  const r = await PUT(
    new Request("http://localhost:3000/api/profile", {
      method: "PUT",
      headers: { origin: "http://localhost:3000", "Content-Length": "1800000" },
      body: "{}",
    }),
  );
  expect(r.status).toBe(413);
});
