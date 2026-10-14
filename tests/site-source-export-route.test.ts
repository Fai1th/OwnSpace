import { beforeEach, afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ owner: "export-owner", paid: false, blocked: false }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: state.owner || null }) }));
vi.mock("../lib/config", () => ({
  siteConfig: { authEnabled: true },
  getSiteUrl: () => "https://ownspace.example",
}));
vi.mock("../lib/deployment", () => ({ isLaunchBlocked: () => state.blocked }));
vi.mock("../lib/db", () => ({
  getRepository: async () => ({
    entitlement: async (owner: string) =>
      owner === "export-owner" && state.paid ? "paid" : "free",
  }),
}));
import { POST } from "../app/api/site-export/route";
import { emptyProfile } from "../lib/profile";
const request = (
  body: unknown,
  origin = "https://ownspace.example",
  extra: Record<string, string> = {},
) =>
  new Request("https://ownspace.example/api/site-export", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json", ...extra },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  state.owner = "export-owner";
  state.paid = false;
  state.blocked = false;
  vi.stubEnv("CLERK_SECRET_KEY", "test-only-export-fixture");
});
afterEach(() => vi.unstubAllEnvs());
it("rejects source export for free accounts despite forged owner and paid flags", async () => {
  const response = await POST(
    request({ profile: emptyProfile, owner: "paid-owner", entitlement: "paid", premium: true }),
  );
  expect(response.status).toBe(403);
  expect((await response.json()).error).toMatch(/Premium/i);
});
it("requires sign-in and same-origin access", async () => {
  state.owner = "";
  expect((await POST(request({ profile: emptyProfile }))).status).toBe(401);
  state.owner = "export-owner";
  state.paid = true;
  expect((await POST(request({ profile: emptyProfile }, "https://attacker.example"))).status).toBe(
    403,
  );
  expect((await POST(request({ profile: emptyProfile }, ""))).status).toBe(403);
});
it("fails closed while hosted account services are unavailable", async () => {
  state.blocked = true;
  state.paid = true;
  expect((await POST(request({ profile: emptyProfile }))).status).toBe(503);
});
it("rejects invalid page data and oversized bodies for paid accounts", async () => {
  state.paid = true;
  expect((await POST(request({ profile: { ...emptyProfile, handle: "../escape" } }))).status).toBe(
    400,
  );
  expect(
    (await POST(request({ profile: emptyProfile }, undefined, { "Content-Length": "1700001" })))
      .status,
  ).toBe(413);
  expect(
    (
      await POST(
        new Request("https://ownspace.example/api/site-export", {
          method: "POST",
          headers: { origin: "https://ownspace.example" },
          body: "x".repeat(1700001),
        }),
      )
    ).status,
  ).toBe(413);
});
it("downloads an unsaved validated page for a paid account without cacheable account data", async () => {
  state.paid = true;
  const response = await POST(request({ profile: { ...emptyProfile, handle: "my-export" } }));
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("application/zip");
  expect(response.headers.get("Content-Disposition")).toBe(
    'attachment; filename="ownspace-my-export.zip"',
  );
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(new Uint8Array(await response.arrayBuffer()).slice(0, 2)).toEqual(
    new Uint8Array([80, 75]),
  );
});
