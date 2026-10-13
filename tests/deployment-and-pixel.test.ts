import { it, expect, vi } from "vitest";
import { deploymentIssues } from "../lib/deployment";
import { createPixelDispatcher } from "../lib/pixel";
it("blocks a public launch without operator, auth and database configuration", () => {
  const problems = deploymentIssues({});
  expect(problems).toContain("NEXT_PUBLIC_LEGAL_OPERATOR");
  expect(problems).toContain("CLERK_WEBHOOK_SIGNING_SECRET");
  expect(problems).toContain("DATABASE_URL");
});
it("requires the full billing configuration when purchases are enabled", () => {
  const problems = deploymentIssues({ STRIPE_SECRET_KEY: "rk_test_example" });
  expect(problems).toContain("STRIPE_PREMIUM_PRICE_ID");
  expect(problems).toContain("STRIPE_WEBHOOK_SECRET");
});
it("forwards consent revocation to an already-loaded Meta SDK", () => {
  const pixel = createPixelDispatcher();
  pixel("init", "123");
  expect(pixel.queue).toEqual([["init", "123"]]);
  const send = vi.fn();
  pixel.callMethod = send;
  pixel("consent", "revoke");
  expect(send).toHaveBeenCalledWith("consent", "revoke");
  expect(pixel.queue).toHaveLength(1);
});
