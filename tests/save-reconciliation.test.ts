import { it, expect } from "vitest";
import { emptyProfile } from "../lib/profile";
import { reconcileSavedDraft } from "../lib/draft";
it("preserves changed fields while applying server normalization to untouched fields", () => {
  const submitted = { ...emptyProfile, displayName: "  Alice  " },
    current = { ...submitted, bio: "Typed after clicking save" },
    saved = { ...submitted, displayName: "Alice" };
  const result = reconcileSavedDraft(submitted, current, saved);
  expect(result.bio).toBe(current.bio);
  expect(result.displayName).toBe("Alice");
});
it("retains links added while a save is pending", () => {
  const submitted = { ...emptyProfile },
    current = {
      ...submitted,
      links: [{ id: "new", title: "My work", url: "https://github.com", enabled: true }],
    };
  expect(reconcileSavedDraft(submitted, current, submitted).links).toEqual(current.links);
});
it("uses server restrictions if the user did not change the affected setting", () => {
  const submitted = { ...emptyProfile, font: "mono" as const, showBrand: false };
  expect(reconcileSavedDraft(submitted, submitted, emptyProfile).font).toBe("manrope");
  expect(reconcileSavedDraft(submitted, submitted, emptyProfile).showBrand).toBe(true);
});
