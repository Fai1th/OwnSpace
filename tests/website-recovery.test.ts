import { afterEach, expect, it } from "vitest";
import { emptyProfile } from "../lib/profile";
import {
  clearWebsiteRecoveries,
  rememberWebsiteRecovery,
  readWebsiteRecovery,
  forgetWebsiteRecovery,
} from "../lib/website-recovery";
afterEach(clearWebsiteRecoveries);
it("bounds remembered accounts and drops oversized snapshots", () => {
  for (let i = 0; i < 4; i++) rememberWebsiteRecovery(`account:${i}`, emptyProfile, 1);
  expect(readWebsiteRecovery("account:0")).toBeUndefined();
  expect(readWebsiteRecovery("account:3")?.version).toBe(1);
  rememberWebsiteRecovery("account:oversized", { ...emptyProfile, bio: "x".repeat(2000000) }, 1);
  expect(readWebsiteRecovery("account:oversized")).toBeUndefined();
});
it("bounds total retained memory and keeps snapshots independent of mutable React objects", () => {
  const profile = { ...emptyProfile, bio: "x".repeat(1400000) };
  rememberWebsiteRecovery("account:a", profile, 1);
  rememberWebsiteRecovery("account:b", profile, 1);
  rememberWebsiteRecovery("account:c", profile, 1);
  expect(readWebsiteRecovery("account:a")).toBeUndefined();
  profile.bio = "Mutated after cache";
  const recovered = readWebsiteRecovery("account:c")!;
  expect(recovered.profile.bio.length).toBe(1400000);
  recovered.profile.bio = "Mutated returned copy";
  expect(readWebsiteRecovery("account:c")?.profile.bio.length).toBe(1400000);
});
it("does not clear or replace a more recent snapshot from an old save response", () => {
  const oldRevision = rememberWebsiteRecovery("account:a", emptyProfile, 4)!;
  const newerRevision = rememberWebsiteRecovery(
    "account:a",
    { ...emptyProfile, displayName: "Newer" },
    4,
  )!;
  forgetWebsiteRecovery("account:a", oldRevision);
  rememberWebsiteRecovery("account:a", emptyProfile, 5, oldRevision);
  expect(readWebsiteRecovery("account:a")).toMatchObject({
    profile: { displayName: "Newer" },
    version: 4,
    revision: newerRevision,
  });
});
