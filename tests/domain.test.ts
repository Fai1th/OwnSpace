import { describe, it, expect } from "vitest";
import {
  profileSchema,
  safeUrl,
  normalizeHandle,
  validateHandle,
  canUsePremium,
  sanitizeProfile,
} from "../lib/profile";
import { readConsent, makeConsent, allowsTracking } from "../lib/consent";
describe("profile safety", () => {
  it("rejects executable and malformed links", () => {
    for (const u of [
      "javascript:alert(1)",
      "data:text/html,bad",
      "https://user:pass@example.com",
      "file:///x",
      "http://localhost",
      "https://127.0.0.1",
    ]) {
      expect(safeUrl(u)).toBe(false);
    }
    expect(safeUrl("https://github.com/owner")).toBe(true);
  });
  it("normalizes handles and rejects reserved, too short and unsafe handles", () => {
    expect(normalizeHandle(" My-Page ")).toBe("my-page");
    for (const h of ["api", "studio", "ab", "hello/world", "has spaces"]) {
      expect(validateHandle(h)).toBe(false);
    }
    expect(validateHandle("my-page")).toBe(true);
  });
  it("limits links and rejects raw executable profile content", () => {
    expect(
      profileSchema.safeParse({
        handle: "owner",
        displayName: "Owner",
        bio: "",
        theme: "night",
        accent: "#BEDD76",
        avatar: "",
        background: "",
        links: Array.from({ length: 21 }, (_, i) => ({
          id: String(i),
          title: "link",
          url: "https://example.com",
          enabled: true,
        })),
        cards: [],
        font: "manrope",
        layout: "stack",
        showBrand: true,
      }).success,
    ).toBe(false);
  });
  it("server removes premium style changes for unpaid accounts", () => {
    const p = profileSchema.parse({
      handle: "owner",
      displayName: "Owner",
      bio: "Hello",
      theme: "aero",
      accent: "#ff0000",
      avatar: "",
      background: "",
      links: [],
      cards: [],
      font: "mono",
      layout: "grid",
      showBrand: false,
    });
    const free = sanitizeProfile(p, false);
    expect(free.font).toBe("manrope");
    expect(free.showBrand).toBe(true);
    expect(canUsePremium("paid")).toBe(true);
    expect(canUsePremium("refunded")).toBe(false);
  });
});
describe("consent defaults", () => {
  it("rejects absent, invalid, expired and wrong-version consent", () => {
    for (const raw of [null, "{}", '{"version":0}', "bad"]) {
      expect(readConsent(raw)).toBeNull();
    }
    const old = makeConsent(true, true, 0);
    expect(readConsent(JSON.stringify(old), Date.now())).toBeNull();
  });
  it("keeps rejection and respects GPC despite prior acceptance", () => {
    const c = makeConsent(false, false);
    expect(readConsent(JSON.stringify(c))?.marketing).toBe(false);
    expect(allowsTracking(makeConsent(true, true), "marketing", true)).toBe(false);
    expect(allowsTracking(c, "analytics", false)).toBe(false);
  });
});
