import { expect, it } from "vitest";
import { isLaunchBlocked } from "../lib/deployment";
it("blocks hosted service activation with missing config even if a local-preview bypass is set", () => {
  expect(isLaunchBlocked({ VERCEL: "1", OWNSPACE_LOCAL_PREVIEW: "1" })).toBe(true);
});
it("keeps development and explicit local compiled previews available", () => {
  expect(isLaunchBlocked({ NODE_ENV: "development" })).toBe(false);
  expect(isLaunchBlocked({ NODE_ENV: "production", OWNSPACE_LOCAL_PREVIEW: "1" })).toBe(false);
});
it("blocks a normal public production process until configuration is complete", () => {
  expect(isLaunchBlocked({ NODE_ENV: "production" })).toBe(true);
});
