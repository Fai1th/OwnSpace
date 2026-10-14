import { describe, expect, it } from "vitest";
import { websiteSchema, emptyWebsite } from "../lib/website";
import { emptyProfile, profileSchema, sanitizeProfile } from "../lib/profile";
const heading = {
  type: "Heading",
  props: { id: "heading-1", text: "About me", size: "large", mobileSize: "medium", align: "left" },
};
describe("trusted website documents", () => {
  it("keeps legacy profiles valid and accepts a typed document", () => {
    expect(profileSchema.safeParse(emptyProfile).success).toBe(true);
    expect(
      profileSchema.safeParse({ ...emptyProfile, website: { ...emptyWebsite, content: [heading] } })
        .success,
    ).toBe(true);
  });
  it("rejects unsupported components, raw styles and arbitrary root data", () => {
    for (const content of [
      [{ type: "HTML", props: { id: "html", html: "<script />" } }],
      [{ ...heading, props: { ...heading.props, style: "position:fixed" } }],
    ]) {
      expect(websiteSchema.safeParse({ ...emptyWebsite, content }).success).toBe(false);
    }
    expect(
      websiteSchema.safeParse({ ...emptyWebsite, root: { props: { html: "x" } } }).success,
    ).toBe(false);
  });
  it("rejects script, private-network and credential URLs", () => {
    for (const url of [
      "javascript:alert(1)",
      "http://example.com",
      "https://localhost",
      "https://127.0.0.1",
      "https://user:pass@example.com",
      "data:text/html,x",
    ]) {
      expect(
        websiteSchema.safeParse({
          ...emptyWebsite,
          content: [{ type: "Link", props: { id: "link-1", label: "Visit", url, align: "left" } }],
        }).success,
      ).toBe(false);
    }
  });
  it("rejects duplicate and invalid IDs, excessive blocks and nested sections", () => {
    expect(websiteSchema.safeParse({ ...emptyWebsite, content: [heading, heading] }).success).toBe(
      false,
    );
    expect(
      websiteSchema.safeParse({
        ...emptyWebsite,
        content: [{ ...heading, props: { ...heading.props, id: "<script>" } }],
      }).success,
    ).toBe(false);
    expect(
      websiteSchema.safeParse({
        ...emptyWebsite,
        content: Array.from({ length: 41 }, (_, i) => ({
          ...heading,
          props: { ...heading.props, id: `block-${i}` },
        })),
      }).success,
    ).toBe(false);
    const section = {
      type: "Section",
      props: {
        id: "section-1",
        tone: "soft",
        padding: "medium",
        mobilePadding: "small",
        content: [heading],
      },
    };
    expect(websiteSchema.safeParse({ ...emptyWebsite, content: [section] }).success).toBe(true);
    expect(
      websiteSchema.safeParse({
        ...emptyWebsite,
        content: [{ ...section, props: { ...section.props, content: [section] } }],
      }).success,
    ).toBe(false);
    expect(websiteSchema.safeParse({ ...emptyWebsite, content: [heading, section] }).success).toBe(
      false,
    );
  });
  it("keeps free profile appearance and branding enforced with website blocks", () => {
    const result = sanitizeProfile(
      {
        ...emptyProfile,
        website: emptyWebsite,
        showBrand: false,
        accent: "#ffffff",
        font: "mono",
        layout: "grid",
      },
      false,
    );
    expect(result).toMatchObject({
      showBrand: true,
      accent: "#BEDD76",
      font: "manrope",
      layout: "stack",
      website: emptyWebsite,
    });
  });
});
