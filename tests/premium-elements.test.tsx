import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  premiumCatalog,
  premiumElementPropsSchema,
  premiumElementSchema,
  premiumElementTypes,
} from "../lib/premium-elements";
import { PremiumElementView } from "../components/premium-elements";
import { createPremiumComponents } from "../components/website-editor-premium";
const canonical = () => ({ ...structuredClone(premiumCatalog[0].defaults), id: "test-section" });
describe("Premium element schema", () => {
  it("has exactly 30 distinct complete canonical catalog defaults", () => {
    expect(premiumElementTypes).toHaveLength(30);
    expect(new Set(premiumCatalog.map((entry) => entry.type)).size).toBe(30);
    for (const entry of premiumCatalog)
      expect(
        premiumElementSchema.safeParse({
          type: entry.type,
          props: { ...entry.defaults, id: "test-" + entry.type },
        }).success,
        entry.type,
      ).toBe(true);
  });
  it("rejects unknown data, missing required fields and unsafe identifiers", () => {
    expect(premiumElementPropsSchema.safeParse({ ...canonical(), script: "x" }).success).toBe(
      false,
    );
    const { email, ...missing } = canonical();
    expect(premiumElementPropsSchema.safeParse(missing).success).toBe(false);
    for (const id of ["root", "", "<img>", "has spaces", "a".repeat(81)])
      expect(premiumElementPropsSchema.safeParse({ ...canonical(), id }).success).toBe(false);
    expect(premiumElementSchema.safeParse({ type: "Embed", props: canonical() }).success).toBe(
      false,
    );
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "http://example.com",
    "https://localhost",
    "https://127.0.0.1",
    "https://user:pass@example.com",
    "//example.com",
    "#bad anchor",
  ])("rejects unsafe link %s", (url) => {
    expect(premiumElementPropsSchema.safeParse({ ...canonical(), url }).success).toBe(false);
    expect(
      premiumElementPropsSchema.safeParse({
        ...canonical(),
        items: [{ title: "", text: "", image: "", url }],
      }).success,
    ).toBe(false);
  });
  it("allows public HTTPS, same-page anchors and approved raster uploads only", () => {
    for (const url of ["", "#work", "https://example.com/work?q=1"])
      expect(premiumElementPropsSchema.safeParse({ ...canonical(), url }).success).toBe(true);
    for (const image of [
      "https://example.com/pixel.png",
      "data:image/svg+xml;base64,PHN2Zz4=",
      "data:text/html;base64,PHNjcmlwdD4=",
    ])
      expect(premiumElementPropsSchema.safeParse({ ...canonical(), image }).success).toBe(false);
    expect(
      premiumElementPropsSchema.safeParse({
        ...canonical(),
        image: "data:image/png;base64,aGVsbG8=",
      }).success,
    ).toBe(true);
  });
  it("enforces scalar and array boundaries", () => {
    for (const props of [
      { title: "x".repeat(161) },
      { text: "x".repeat(4001) },
      { label: "x".repeat(101) },
      { value: -1 },
      { value: 101 },
      { value: NaN },
      { columns: 5 },
      { anchor: "_bad" },
      { anchor: "a".repeat(81) },
      { date: "2026-02-31" },
      { date: "tomorrow" },
      { email: "not-an-email" },
      { items: Array.from({ length: 9 }, () => ({ title: "", text: "", url: "", image: "" })) },
      { items: [{ title: "x".repeat(121), text: "", url: "", image: "" }] },
      { items: [{ title: "", text: "x".repeat(1001), url: "", image: "" }] },
    ])
      expect(
        premiumElementPropsSchema.safeParse({ ...canonical(), ...props }).success,
        JSON.stringify(props).slice(0, 80),
      ).toBe(false);
    for (const date of ["", "2028-02-29", "2028-01-01T14:00:00Z", "2028-01-01T14:00:00-06:00"])
      expect(premiumElementPropsSchema.safeParse({ ...canonical(), date }).success).toBe(true);
  });
});
describe("Premium rendering and editor contracts", () => {
  it("renders all types without live links or buttons on the selectable editor canvas", () => {
    for (const entry of premiumCatalog) {
      const html = renderToStaticMarkup(
        <PremiumElementView
          element={{ type: entry.type, props: { ...entry.defaults, id: "preview-" + entry.type } }}
          interactive={false}
        />,
      );
      expect(html, entry.type).toContain("premium-section");
      expect(html, entry.type).not.toMatch(/<(button|a|input)\b/);
    }
  });
  it("escapes user text and uses a single primary hero heading", () => {
    const hero = premiumCatalog.find((entry) => entry.type === "Hero")!;
    const html = renderToStaticMarkup(
      <PremiumElementView
        element={{
          type: "Hero",
          props: {
            ...hero.defaults,
            id: "hero",
            title: "<script>alert(1)</script>",
            text: "<img src=x onerror=alert(1)>",
            anchor: "intro",
          },
        }}
      />,
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain('id="intro"');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });
  it("withholds unsafe hrefs even if a caller bypasses validation", () => {
    const html = renderToStaticMarkup(
      <PremiumElementView
        element={{
          type: "CallToAction",
          props: { ...canonical(), title: "Action", label: "Click", url: "javascript:alert(1)" },
        }}
      />,
    );
    expect(html).not.toContain("href=");
  });
  it("provides all Premium Puck types, complete defaults and tailored controls", () => {
    const components = createPremiumComponents();
    expect(Object.keys(components)).toEqual([...premiumElementTypes]);
    for (const entry of premiumCatalog) {
      expect(components[entry.type].label).toContain("Premium");
      expect(
        premiumElementPropsSchema.safeParse({
          ...components[entry.type].defaultProps,
          id: "new-" + entry.type,
        }).success,
      ).toBe(true);
    }
    expect(components.Countdown.fields).toHaveProperty("date");
    expect(components.Contact.fields).toHaveProperty("email");
    expect(components.CodeBlock.fields).toHaveProperty("label");
    expect(components.Gallery.fields).not.toHaveProperty("email");
  });
});
