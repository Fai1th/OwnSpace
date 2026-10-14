import { beforeAll, afterAll, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { Repository, schemaSql } from "../lib/repository";
import { emptyProfile, profileSchema, type Profile } from "../lib/profile";
import { premiumCatalog, type PremiumElementType } from "../lib/premium-elements";
import { LEGAL_VERSION } from "../lib/legal-content";

const state = vi.hoisted(() => ({ owner: "", repo: null as unknown as Repository }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: state.owner || null }) }));
vi.mock("../lib/config", () => ({
  siteConfig: { authEnabled: true, url: "http://localhost:3000" },
  getSiteUrl: () => "http://localhost:3000",
}));
vi.mock("../lib/db", () => ({ getRepository: async () => state.repo }));
import { PUT } from "../app/api/profile/route";
import { POST as publish } from "../app/api/publish/route";

let db: PGlite;
beforeAll(async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "test-only-plan-enforcement-fixture");
  vi.stubEnv("VERCEL", "0");
  vi.stubEnv("OWNSPACE_LOCAL_PREVIEW", "1");
  db = new PGlite();
  await db.exec(schemaSql);
  state.repo = new Repository({
    query: async (sql, params) => db.query(sql, params),
    transaction: async (fn) =>
      db.transaction(async (tx) => fn({ query: async (sql, params) => tx.query(sql, params) })),
  });
  // A real paid account exists, so injecting its owner is a meaningful bypass attempt.
  await state.repo.billing({
    eventId: "plan-victim-paid",
    owner: "paid-victim",
    paymentId: "pi_plan_victim",
    status: "paid",
  });
}, 30000);
afterAll(async () => {
  await db?.close();
  vi.unstubAllEnvs();
});

const premiumTypes = [
  "SiteNav",
  "Hero",
  "SplitHero",
  "FeatureGrid",
  "Cards",
  "ProjectGrid",
  "Gallery",
  "Carousel",
  "Accordion",
  "Tabs",
  "PricingTable",
  "CallToAction",
  "Stats",
  "Timeline",
  "Quote",
  "LogoCloud",
  "Divider",
  "Badge",
  "Checklist",
  "ImageCompare",
  "CodeBlock",
  "Countdown",
  "Contact",
  "SiteFooter",
  "Marquee",
  "Spotlight",
  "Announcement",
  "Steps",
  "SocialLinks",
  "Progress",
] as const;
function premium(type: PremiumElementType, id: string) {
  const entry = premiumCatalog.find((candidate) => candidate.type === type);
  if (!entry) throw new Error(`Missing public catalog fixture for ${type}`);
  return { type, props: { ...entry.defaults, id } };
}
const heading = (id: string) => ({
  type: "Heading",
  props: { id, text: "My website", size: "large", mobileSize: "medium", align: "left" },
});
const text = (id: string) => ({
  type: "Text",
  props: { id, text: "A basic paragraph.", size: "medium", mobileSize: "small", align: "left" },
});
const image = (id: string) => ({
  type: "Image",
  props: { id, image: "/art/sky.svg", alt: "A blue sky", caption: "", shape: "wide" },
});
const section = {
  type: "Section",
  props: {
    id: "paid-section",
    tone: "soft",
    padding: "medium",
    mobilePadding: "small",
    content: [heading("nested-basic")],
  },
};
const site = {
  mode: "website",
  backgroundColor: "#171717",
  foreground: "#fbfcfd",
  backgroundImage: "",
  pattern: "none",
  width: "standard",
};
const website = (content: unknown[]) => ({ version: 1, root: { props: {} }, content });
const request = (body: unknown, endpoint: "profile" | "publish" = "profile") =>
  new Request(`http://localhost:3000/api/${endpoint}`, {
    method: endpoint === "profile" ? "PUT" : "POST",
    headers: { origin: "http://localhost:3000", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const forgedSave = (profile: Profile, version = 0) =>
  PUT(
    request({
      profile: { ...profile, owner: "paid-victim", entitlement: "paid", premium: true },
      version,
      owner: "paid-victim",
      entitlement: "paid",
      premium: true,
    }),
  );

it.each(premiumTypes)(
  "rejects the %s element for a Free owner through both the repository and forged-paid API",
  async (type) => {
    state.owner = `free-premium-${premiumTypes.indexOf(type)}`;
    const profile = profileSchema.parse({
      ...emptyProfile,
      handle: state.owner,
      site,
      website: website([premium(type, "premium-block")]),
    });
    await expect(state.repo.save(state.owner, profile, 0)).rejects.toThrow(/Premium/);
    const response = await forgedSave(profile);
    expect(response.status).toBe(403);
    expect((await response.json()).error).toMatch(/Premium/);
    expect(await state.repo.get(state.owner)).toBeNull();
    expect(await state.repo.entitlement(state.owner)).toBe("free");
    expect(await state.repo.get("paid-victim")).toBeNull();
  },
);

const freeRejections = [
  ["a Section containing only basic blocks", { website: website([section]) }],
  ["a legacy background", { background: "/art/sky.svg" }],
  ["a site background image", { site: { ...site, backgroundImage: "/art/sky.svg" } }],
  ["a custom site background color", { site: { ...site, backgroundColor: "#aabbcc" } }],
  ["a custom site foreground", { site: { ...site, foreground: "#112233" } }],
  ["a custom site pattern", { site: { ...site, pattern: "grid" } }],
  ["a custom site width", { site: { ...site, width: "wide" } }],
  [
    "seven basic blocks",
    { website: website(Array.from({ length: 7 }, (_, i) => text(`basic-${i}`))) },
  ],
  [
    "four profile links",
    {
      links: Array.from({ length: 4 }, (_, i) => ({
        id: `link-${i}`,
        title: `Link ${i}`,
        url: "https://example.com",
        enabled: true,
      })),
    },
  ],
  ["two content images", { website: website([image("first-image"), image("second-image")]) }],
] as const;
it.each(freeRejections)(
  "rejects %s for a Free owner without creating a draft",
  async (label, changes) => {
    state.owner = `free-limit-${freeRejections.findIndex(([name]) => name === label)}`;
    const profile = profileSchema.parse({ ...emptyProfile, handle: state.owner, site, ...changes });
    const response = await forgedSave(profile);
    expect(response.status).toBe(403);
    expect((await response.json()).error).toMatch(/Free|Premium/);
    expect(await state.repo.get(state.owner)).toBeNull();
  },
);

it("accepts a Free basic website and normalizes profile appearance on the server", async () => {
  state.owner = "free-basic-owner";
  const response = await forgedSave(
    profileSchema.parse({
      ...emptyProfile,
      handle: "free-basic-site",
      site,
      showBrand: false,
      accent: "#abcdef",
      theme: "desktop",
      font: "mono",
      layout: "grid",
      website: website([heading("basic-title"), text("basic-description"), image("basic-image")]),
    }),
  );
  expect(response.status).toBe(200);
  const saved = (await response.json()).profile;
  expect(saved).toMatchObject({
    owner: state.owner,
    entitlement: "free",
    version: 1,
    draft: { showBrand: true, accent: "#BEDD76", theme: "night", font: "manrope", layout: "stack" },
  });
  expect(saved.draft.website.content.map((block: { type: string }) => block.type)).toEqual([
    "Heading",
    "Text",
    "Image",
  ]);
  expect(await state.repo.get("paid-victim")).toBeNull();
});

function paidProfile(handle: string) {
  return profileSchema.parse({
    ...emptyProfile,
    handle,
    showBrand: false,
    accent: "#123456",
    theme: "gallery",
    font: "mono",
    layout: "grid",
    background: "/art/sky.svg",
    site: {
      ...site,
      backgroundColor: "#112233",
      foreground: "#ddeeff",
      backgroundImage: "/art/mountain.svg",
      pattern: "dots",
      width: "wide",
    },
    links: Array.from({ length: 4 }, (_, i) => ({
      id: `profile-link-${i}`,
      title: `Link ${i}`,
      url: "https://example.com",
      enabled: true,
    })),
    cards: [
      { id: "first-card", title: "First card", image: "/art/sky.svg", caption: "First caption" },
      {
        id: "second-card",
        title: "Second card",
        image: "/art/orbit.svg",
        caption: "Second caption",
      },
    ],
    website: website([
      heading("basic-title"),
      ...premiumTypes.map((type, i) => premium(type, `premium-${i}`)),
      text("basic-text"),
      {
        type: "Link",
        props: { id: "basic-link", label: "Visit", url: "https://example.com", align: "left" },
      },
      image("basic-image"),
      { type: "Spacer", props: { id: "basic-space", size: "medium", mobileSize: "small" } },
      heading("second-title"),
      text("second-text"),
      section,
    ]),
  });
}
async function createPaidWebsite(owner: string, handle: string) {
  state.owner = owner;
  await state.repo.billing({
    eventId: `${owner}-paid`,
    owner,
    paymentId: `pi_${owner}`,
    status: "paid",
  });
  const profile = paidProfile(handle);
  const saved = await PUT(request({ profile, version: 0 }));
  expect(saved.status).toBe(200);
  expect((await saved.json()).profile).toMatchObject({
    owner,
    entitlement: "paid",
    version: 1,
    draft: profile,
  });
  await state.repo.acceptAgreement(owner, LEGAL_VERSION);
  const published = await publish(request({ publish: true, version: 1 }, "publish"));
  expect(published.status).toBe(200);
  expect((await published.json()).profile.published).toEqual(profile);
  return profile;
}
async function refund(owner: string) {
  await state.repo.billing({
    eventId: `${owner}-refunded`,
    owner,
    paymentId: `pi_${owner}`,
    status: "refunded",
  });
}

it("accepts and publishes all 30 Premium elements and custom appearance after a real paid billing event", async () => {
  const profile = await createPaidWebsite("paid-catalog-owner", "paid-catalog-site");
  expect(await state.repo.publicProfile(profile.handle)).toEqual(profile);
  expect(await state.repo.entitlement(state.owner)).toBe("paid");
});

it("projects a refunded public website to basic content and neutral appearance without changing either stored snapshot", async () => {
  const owner = "refund-projection-owner";
  const profile = await createPaidWebsite(owner, "refund-projection-site");
  const before = await state.repo.get(owner);
  await refund(owner);
  const publicPage = await state.repo.publicProfile(profile.handle);
  expect(publicPage).toMatchObject({
    showBrand: true,
    accent: "#BEDD76",
    theme: "night",
    font: "manrope",
    layout: "stack",
    background: "",
    site: {
      mode: "website",
      backgroundColor: "#171717",
      foreground: "#fbfcfd",
      backgroundImage: "",
      pattern: "none",
      width: "standard",
    },
  });
  expect(publicPage?.links.map((link) => link.id)).toEqual([
    "profile-link-0",
    "profile-link-1",
    "profile-link-2",
  ]);
  expect(publicPage?.cards.map((card) => card.id)).toEqual(["first-card"]);
  expect(publicPage?.website?.content.map((block) => block.props.id)).toEqual([
    "basic-title",
    "basic-text",
    "basic-space",
    "second-title",
    "second-text",
  ]);
  const after = await state.repo.get(owner);
  expect(after?.entitlement).toBe("refunded");
  expect(after?.draft).toEqual(before?.draft);
  expect(after?.draft).toEqual(profile);
  expect(after?.published).toEqual(before?.published);
  expect(after?.version).toBe(before?.version);
});

it("blocks republishing a refunded Premium draft despite forged paid fields but still permits unpublishing", async () => {
  const owner = "refund-publish-owner";
  const profile = await createPaidWebsite(owner, "refund-publish-site");
  await refund(owner);
  const blocked = await publish(
    request(
      { publish: true, version: 1, entitlement: "paid", premium: true, owner: "paid-victim" },
      "publish",
    ),
  );
  expect(blocked.status).toBe(403);
  expect((await blocked.json()).error).toMatch(/Premium|Free/);
  expect(await state.repo.publicProfile(profile.handle)).not.toBeNull();
  expect((await state.repo.get(owner))?.draft).toEqual(profile);
  const unpublished = await publish(request({ publish: false, version: 1 }, "publish"));
  expect(unpublished.status).toBe(200);
  expect((await unpublished.json()).profile.published).toBeNull();
  expect(await state.repo.publicProfile(profile.handle)).toBeNull();
  expect((await state.repo.get(owner))?.draft).toEqual(profile);
});
