import { it, expect } from "vitest";
import { readDraft } from "../lib/draft";
import { emptyProfile } from "../lib/profile";
it("retains incomplete browser drafts across reloads", () => {
  const p = {
    ...emptyProfile,
    displayName: "",
    handle: "m",
    links: [{ id: "new", title: "", url: "https://", enabled: true }],
  };
  expect(readDraft(JSON.stringify(p))?.links).toHaveLength(1);
  expect(readDraft(JSON.stringify(p))?.handle).toBe("m");
});
it("rejects invalid styling and executable image formats in cached drafts", () => {
  expect(readDraft(JSON.stringify({ ...emptyProfile, accent: "red;position:fixed" }))).toBeNull();
  expect(
    readDraft(JSON.stringify({ ...emptyProfile, avatar: "data:image/svg+xml;base64,AAAA" })),
  ).toBeNull();
});
