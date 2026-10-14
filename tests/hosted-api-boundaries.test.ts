import { afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  auth: vi.fn(async () => ({ userId: "fixture" })),
  repo: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: state.auth }));
vi.mock("../lib/config", () => ({
  siteConfig: { authEnabled: true },
  getSiteUrl: () => "https://ownspace.example",
}));
vi.mock("../lib/db", () => ({ getRepository: state.repo }));
vi.mock("../lib/legal-content", () => ({ LEGAL_VERSION: "test" }));
import { GET as profile, PUT } from "../app/api/profile/route";
import { POST as publish } from "../app/api/publish/route";
import { GET as agreement } from "../app/api/agreement/route";
afterEach(() => vi.unstubAllEnvs());
it("fails closed before authentication or data access on an incomplete hosted service", async () => {
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("OWNSPACE_LOCAL_PREVIEW", "1");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_fixture");
  const request = () =>
    new Request("https://ownspace.example/api/profile", {
      method: "POST",
      headers: { origin: "https://ownspace.example", "Content-Type": "application/json" },
      body: "{}",
    });
  expect((await profile()).status).toBe(503);
  expect((await agreement()).status).toBe(503);
  expect((await PUT(request())).status).toBe(503);
  expect((await publish(request())).status).toBe(503);
  expect(state.auth).not.toHaveBeenCalled();
  expect(state.repo).not.toHaveBeenCalled();
});
