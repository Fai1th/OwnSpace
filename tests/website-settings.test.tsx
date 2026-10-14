// @vitest-environment jsdom
import React, { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { render, fireEvent, screen, cleanup, act } from "@testing-library/react";
import { emptyProfile, type Profile } from "../lib/profile";
import { defaultSiteSettings } from "../lib/site-settings";
import { FREE_SITE_STYLE, planIssue } from "../lib/plans";
import { premiumCatalog } from "../lib/premium-elements";
import { websiteSchema } from "../lib/website";
const uploads = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock("../lib/image-upload", () => ({ optimizeImage: (file: File) => uploads.run(file) }));
import { WebsiteSettings } from "../components/website-settings";
afterEach(() => cleanup());
it("lets downgraded owners explicitly reset paid backgrounds without deleting content", () => {
  let latest: Profile = {
    ...emptyProfile,
    background: "/art/sky.svg",
    site: {
      ...defaultSiteSettings,
      pattern: "dots",
      width: "wide",
      backgroundImage: "/art/sky.svg",
    },
  };
  function Harness() {
    const [profile, setProfile] = useState(latest);
    latest = profile;
    return (
      <WebsiteSettings
        profile={profile}
        premium={false}
        onChange={(key, value) => setProfile((p) => ({ ...p, [key]: value }))}
      />
    );
  }
  render(<Harness />);
  expect(planIssue(latest, false)).toContain("Premium");
  expect((screen.getByLabelText("Content width") as HTMLSelectElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Use Free appearance" }));
  expect(latest.site).toEqual({ ...FREE_SITE_STYLE, mode: "website" });
  expect(latest.background).toBe("");
  expect(latest.links).toEqual(emptyProfile.links);
  expect(planIssue(latest, false)).toBeNull();
});
it("keeps settings changed while a background image is being prepared", async () => {
  let finish!: (value: string) => void;
  uploads.run.mockImplementation(() => new Promise((resolve) => (finish = resolve)));
  let latest: Profile = { ...emptyProfile, site: defaultSiteSettings };
  function Harness() {
    const [profile, setProfile] = useState(latest);
    latest = profile;
    return (
      <WebsiteSettings
        profile={profile}
        premium
        onChange={(key, value) => setProfile((p) => ({ ...p, [key]: value }))}
      />
    );
  }
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("Background image"), {
    target: { files: [new File(["x"], "x.png", { type: "image/png" })] },
  });
  fireEvent.change(screen.getByLabelText("Content width"), { target: { value: "wide" } });
  await act(async () => finish("/art/sky.svg"));
  expect(latest.site?.width).toBe("wide");
  expect(latest.site?.backgroundImage).toBe("/art/sky.svg");
});
it("rejects duplicate published section anchors and collisions with another block ID", () => {
  const a = {
    type: premiumCatalog[0].type,
    props: { ...premiumCatalog[0].defaults, id: "nav", anchor: "work" },
  };
  const b = {
    type: premiumCatalog[1].type,
    props: { ...premiumCatalog[1].defaults, id: "hero", anchor: "work" },
  };
  expect(
    websiteSchema.safeParse({ version: 1, root: { props: {} }, content: [a, b] }).success,
  ).toBe(false);
  expect(
    websiteSchema.safeParse({
      version: 1,
      root: { props: {} },
      content: [a, { ...b, props: { ...b.props, id: "work", anchor: "" } }],
    }).success,
  ).toBe(false);
  expect(
    websiteSchema.safeParse({
      version: 1,
      root: { props: {} },
      content: [{ ...a, props: { ...a.props, anchor: "nav" } }],
    }).success,
  ).toBe(true);
});
