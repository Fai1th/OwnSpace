import { expect, it } from "vitest";
import { emptyProfile, sanitizeProfile, type Profile } from "../lib/profile";
import { assertPlanAllows, FREE_SITE_STYLE } from "../lib/plans";
const heading = (id: string) => ({
  type: "Heading" as const,
  props: {
    id,
    text: "Section",
    size: "medium" as const,
    mobileSize: "small" as const,
    align: "left" as const,
  },
});
const page = (content: NonNullable<Profile["website"]>["content"]): Profile => ({
  ...emptyProfile,
  site: { mode: "website", ...FREE_SITE_STYLE },
  website: { version: 1, root: { props: {} }, content },
});
it("lets Free publish six plain blocks but rejects a seventh without discarding the draft", () => {
  const allowed = page(Array.from({ length: 6 }, (_, i) => heading("h" + i)));
  expect(() => assertPlanAllows(allowed, false)).not.toThrow();
  const over = page([...allowed.website!.content, heading("extra")]);
  expect(() => assertPlanAllows(over, false)).toThrow("6 basic blocks");
  expect(over.website!.content).toHaveLength(7);
});
it("rejects a Premium element and background on Free even in a forged direct request", () => {
  const section = {
    type: "Section" as const,
    props: {
      id: "section",
      tone: "soft" as const,
      padding: "medium" as const,
      mobilePadding: "small" as const,
      content: [],
    },
  };
  expect(() => assertPlanAllows(page([section]), false)).toThrow("Premium");
  expect(() =>
    assertPlanAllows(
      { ...page([]), site: { mode: "website", ...FREE_SITE_STYLE, pattern: "dots" } },
      false,
    ),
  ).toThrow("Premium");
  expect(() =>
    assertPlanAllows({ ...page([]), background: "/art/night-landscape.svg" }, false),
  ).toThrow("Premium");
  expect(() => assertPlanAllows(page([section]), true)).not.toThrow();
});
it("removes paid blocks and backgrounds from a revoked public snapshot while preserving source data", () => {
  const document = page([
    {
      type: "Section",
      props: {
        id: "s",
        tone: "plain",
        padding: "medium",
        mobilePadding: "small",
        content: [heading("nested")],
      },
    },
    heading("visible"),
  ]);
  const original = JSON.stringify(document);
  const visible = sanitizeProfile(
    { ...document, site: { mode: "website", ...FREE_SITE_STYLE, backgroundColor: "#ff0000" } },
    false,
  );
  expect(visible.website!.content.map((block) => block.props.id)).toEqual(["visible"]);
  expect(visible.site?.backgroundColor).toBe(FREE_SITE_STYLE.backgroundColor);
  expect(visible.showBrand).toBe(true);
  expect(JSON.stringify(document)).toBe(original);
});
it("limits legacy link and content-image totals with the same Free plan rules", () => {
  const links = Array.from({ length: 4 }, (_, i) => ({
    id: String(i),
    title: "Link",
    url: "https://example.com",
    enabled: true,
  }));
  expect(() => assertPlanAllows({ ...emptyProfile, links }, false)).toThrow("3 links");
  expect(sanitizeProfile({ ...emptyProfile, links }, false).links).toHaveLength(3);
});
it("counts website buttons and legacy links within one shared Free allowance", () => {
  const links = Array.from({ length: 3 }, (_, i) => ({
    id: "legacy" + i,
    title: "Link",
    url: "https://example.com",
    enabled: true,
  }));
  const website = page([
    {
      type: "Link",
      props: { id: "button", label: "Visit", url: "https://example.com", align: "left" },
    },
  ]);
  const over = { ...website, links };
  expect(() => assertPlanAllows(over, false)).toThrow("3 links");
  expect(sanitizeProfile(over, false).website?.content).toHaveLength(0);
  expect(over.website?.content).toHaveLength(1);
});
