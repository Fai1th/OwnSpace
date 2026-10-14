import nextEnv from "@next/env";
import { PGlite } from "@electric-sql/pglite";
import { createClerkClient } from "@clerk/backend";
import { chromium, expect } from "@playwright/test";
import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import AxeBuilder from "@axe-core/playwright";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Repository, schemaSql } from "../lib/repository";
import { emptyProfile } from "../lib/profile";
import { defaultSiteSettings } from "../lib/site-settings";
import { LEGAL_VERSION } from "../lib/legal-content";
nextEnv.loadEnvConfig(process.cwd());
const base = new URL(process.env.OWNSPACE_AUTH_TEST_URL || "http://localhost:3003");
if (
  base.protocol !== "http:" ||
  base.hostname !== "localhost" ||
  !process.cwd().replaceAll("\\", "/").startsWith("D:/") ||
  process.env.DATABASE_URL ||
  !process.env.CLERK_SECRET_KEY?.startsWith("sk_test_") ||
  process.env.OWNSPACE_LOCAL_PREVIEW !== "1"
)
  throw Error("Premium checks require D:, local embedded storage and Clerk development keys.");
process.env.TEMP = path.resolve("work");
process.env.TMP = process.env.TEMP;
process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const api = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const fixturePath = path.resolve("work/premium-test-private.json");
async function database() {
  const db = new PGlite(path.resolve(".ownspace-data"));
  await db.exec(schemaSql);
  return {
    db,
    repo: new Repository({
      query: async (s, p) => db.query(s, p),
      transaction: async (fn) =>
        db.transaction(async (tx) => fn({ query: async (s, p) => tx.query(s, p) })),
    }),
  };
}
if (process.argv[2] === "prepare") {
  await fs.mkdir("work", { recursive: true });
  const email = "ownspace-premium+clerk_test_" + Date.now() + "@example.com";
  const password = randomBytes(24).toString("base64url");
  const user = await api.users.createUser({
    emailAddress: [email],
    password,
    skipPasswordChecks: true,
  });
  const handle = "premium-check-" + Date.now();
  const { db, repo } = await database();
  try {
    await repo.billing({
      eventId: "fixture_" + user.id,
      owner: user.id,
      paymentId: "fixture_" + user.id,
      status: "paid",
    });
    await repo.save(
      user.id,
      { ...emptyProfile, handle, displayName: "Premium verification", site: defaultSiteSettings },
      0,
    );
    await repo.acceptAgreement(user.id, LEGAL_VERSION);
    await fs.writeFile(fixturePath, JSON.stringify({ email, owner: user.id, handle }));
  } finally {
    await db.close();
  }
  console.log("Disposable local paid fixture prepared. Start local server before check.");
} else if (process.argv[2] === "cleanup") {
  const f = JSON.parse(await fs.readFile(fixturePath, "utf8"));
  const user = await api.users.getUser(f.owner);
  if (
    !/^ownspace-premium\+clerk_test_\d+@example\.com$/.test(f.email) ||
    !user.emailAddresses.some((address) => address.emailAddress === f.email)
  )
    throw Error("Refusing cleanup of a non-fixture identity.");
  const { db, repo } = await database();
  try {
    await repo.delete(f.owner, true);
  } finally {
    await db.close();
  }
  await api.users.deleteUser(f.owner).catch(() => {});
  await fs.unlink(fixturePath);
  console.log("Disposable Premium fixture removed.");
} else {
  const f = JSON.parse(await fs.readFile(fixturePath, "utf8"));
  await clerkSetup();
  const browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(30000);
  try {
    await setupClerkTestingToken({ page });
    await page.goto(base.origin + "/sign-in");
    await page.getByRole("button", { name: "Reject optional" }).click();
    // Official development-only ticket helper isolates paid editor checks from provider MFA.
    // The separate Free lifecycle check covers real signup and password-login UI.
    await clerk.signIn({ page, emailAddress: f.email });
    await page.goto(base.origin + "/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30000 });
    console.log("Development login passed.");
    const existing = await (await page.request.get(base.origin + "/api/profile")).json();
    const reset = await page.request.put(base.origin + "/api/profile", {
      headers: { origin: base.origin },
      data: {
        version: existing.profile.version,
        profile: {
          ...existing.profile.draft,
          website: { version: 1, root: { props: {} }, content: [] },
        },
      },
    });
    expect(reset.status()).toBe(200);
    await page.getByRole("link", { name: /Open visual editor/ }).click();
    await expect(page.getByRole("button", { name: /Element library/ })).toBeVisible({
      timeout: 30000,
    });
    const frame = page.frameLocator("#preview-frame");
    async function add(search: string) {
      await page.getByRole("button", { name: /Element library/ }).click();
      await page.getByLabel("Search elements", { exact: true }).fill(search);
      await page.locator(".website-library-list button").first().click();
      await page.getByRole("button", { name: "Add to page", exact: true }).click();
      console.log("Inserted", search);
    }
    await add("navigation");
    await add("split hero");
    await add("accordion");
    await add("tabs");
    await add("gallery");
    await expect(frame.locator(".premium-section")).toHaveCount(5);
    await page.getByText("Canvas and background", { exact: true }).click();
    await page.getByLabel("Content width", { exact: true }).selectOption("narrow");
    await expect(frame.locator(".premium-inner").first()).toHaveCSS("max-width", "780px");
    await page.getByLabel("Content width", { exact: true }).selectOption("wide");
    await expect(frame.locator(".premium-inner").first()).toHaveCSS("max-width", "1440px");
    await page.getByLabel("Background pattern", { exact: true }).selectOption("dots");
    await page.getByLabel("Background color", { exact: true }).fill("#242424");
    await page.getByLabel("Background image", { exact: true }).setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        await page.evaluate(() => {
          const canvas = document.createElement("canvas");
          canvas.width = 16;
          canvas.height = 16;
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#242424";
          ctx.fillRect(0, 0, 16, 16);
          return canvas.toDataURL("image/png").split(",")[1];
        }),
        "base64",
      ),
    });
    await expect(
      page.getByRole("button", { name: "Remove background image", exact: true }),
    ).toBeVisible();
    await expect(frame.locator(".site-canvas")).toHaveClass(/site-width-wide/);
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.locator(".website-editor-notices [role=status]")).toContainText(
      "Draft saved.",
    );
    const saved = await (await page.request.get(base.origin + "/api/profile")).json();
    expect(saved.profile.draft.site.pattern).toBe("dots");
    expect(saved.profile.draft.website.content).toHaveLength(5);
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download React source", exact: true }).click();
    const download = await downloadEvent;
    await download.saveAs(path.resolve("work/premium-browser-source.zip"));
    await expect(page.locator(".website-editor-notices [role=status]")).toContainText(
      "React source downloaded.",
    );
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    const preview = page.locator(".website-editor-preview");
    await expect(preview.locator(".site-canvas")).toBeVisible();
    const accordion = preview.locator(".premium-accordion-trigger").first();
    if (await accordion.count()) {
      await accordion.click();
      await expect(accordion).toHaveAttribute("aria-expanded", "true");
    }
    await page.getByRole("button", { name: "Close preview" }).click();
    await page.screenshot({ path: "work/premium-editor-desktop.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: /Element library/ }).click();
    await page.getByLabel("Search elements", { exact: true }).fill("accordion");
    await expect(page.locator(".website-library-list button")).toHaveCount(1);
    await page.screenshot({ path: "work/premium-library-mobile.png", fullPage: true });
    await page.getByRole("button", { name: "Close library" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    await fs.writeFile("work/premium-accessibility.json", JSON.stringify(a11y.violations, null, 2));
    expect(
      a11y.violations
        .filter((v) => ["critical", "serious"].includes(v.impact || ""))
        .map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    await page.getByRole("button", { name: "Publish saved page", exact: true }).click();
    await expect(page.locator(".website-editor-notices [role=status]")).toContainText(
      "Your saved page is published.",
    );
    await page.goto(base.origin + "/" + f.handle);
    await expect(page.locator(".site-canvas")).toBeVisible();
    await expect(page.locator(".profile-avatar")).toHaveCount(0);
    await page.screenshot({ path: "work/premium-public-desktop.png", fullPage: true });
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: "work/premium-public-" + width + ".png", fullPage: true });
    }
    const publicA11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    await fs.writeFile(
      "work/premium-public-accessibility.json",
      JSON.stringify(publicA11y.violations, null, 2),
    );
    expect(
      publicA11y.violations
        .filter((v) => ["critical", "serious"].includes(v.impact || ""))
        .map((v) => v.id),
    ).toEqual([]);
    await page.goto(base.origin + "/editor");
    await page.getByRole("button", { name: "Unpublish", exact: true }).click();
    await expect(page.locator(".website-editor-notices [role=status]")).toContainText(
      "Your page is unpublished.",
    );
    console.log(
      "Premium UI: real development Clerk login, library search/add, five advanced widgets, backgrounds, save, React ZIP download, interactive preview, publish/unpublish, desktop/mobile and accessibility passed.",
    );
  } catch (error) {
    await page.screenshot({ path: "work/premium-verification-failure.png", fullPage: true });
    console.log("Premium check failed at", new URL(page.url()).pathname);
    console.log((await page.locator("main").innerText()).slice(0, 3000));
    throw error;
  } finally {
    await browser.close();
  }
}
