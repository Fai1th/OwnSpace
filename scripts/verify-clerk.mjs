import nextEnv from "@next/env";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
nextEnv.loadEnvConfig(process.cwd());
if (
  !process.env.CLERK_SECRET_KEY?.startsWith("sk_test_") ||
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_")
)
  throw new Error("Authentication smoke checks require Clerk development keys.");
const testUrl = new URL(process.env.OWNSPACE_AUTH_TEST_URL || "http://localhost:3000");
if (testUrl.protocol !== "http:" || testUrl.hostname !== "localhost")
  throw new Error("Run authentication smoke checks only against a local localhost server.");
await fs.mkdir("work", { recursive: true });
process.env.TEMP = fileURLToPath(new URL("../work", import.meta.url));
process.env.TMP = process.env.TEMP;
process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
await clerkSetup();
const api = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const email = "ownspace-verification+clerk_test_" + Date.now() + "@example.com";
const password = crypto.randomBytes(24).toString("base64url");
const browser = await chromium.launch({ channel: "msedge" });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const base = testUrl.origin;
const results = [];

try {
  await setupClerkTestingToken({ page });
  await page.goto(base + "/studio", { waitUntil: "domcontentloaded", timeout: 90000 });
  await expect(page).toHaveURL(/\/sign-in/);
  expect((await page.request.get(base + "/api/profile")).status()).toBe(401);
  results.push("Signed-out studio redirects and profile API returns 401");
  await page.goto(base + "/sign-up", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Reject optional" }).click();
  await page.locator("input[name=emailAddress]").fill(email);
  await page.locator("input[name=password]").fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox", { name: "Enter verification code" }).pressSequentially("424242");
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60000 });
  await page.goto(base + "/studio", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Display name", { exact: true }).fill("Authentication verification");
  await page.getByLabel("Page address", { exact: true }).fill("auth-check-" + Date.now());
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your submitted draft is saved.");
  const saved = await (await page.request.get(base + "/api/profile")).json();
  expect(saved.profile.owner).toMatch(/^user_/);
  results.push("Real signup, test email verification, dashboard redirect and authenticated save");
  await page.screenshot({ path: "work/clerk-authenticated-desktop.png", fullPage: true });
  expect(
    (
      await page.request.post(base + "/api/publish", {
        headers: { origin: base },
        data: { publish: true, version: saved.profile.version },
      })
    ).status(),
  ).toBe(428);
  await page.goto(base + "/dashboard", { waitUntil: "domcontentloaded" });
  await page.getByLabel("I agree to the Terms of use and Acceptable use policy.").check();
  await page.getByLabel(/I am at least/).check();
  await page.getByRole("button", { name: "Save agreement", exact: true }).click();
  await expect(page.getByText("Current Terms accepted.", { exact: false })).toBeVisible();
  results.push(
    "Publication blocked until explicit versioned Terms acceptance; consent stays rejected",
  );
  await page.getByRole("link", { name: /Open visual editor/ }).click();
  await expect(page.getByRole("button", { name: "Save draft", exact: true })).toBeVisible();
  await page.screenshot({ path: "work/website-editor-initial.png", fullPage: true });
  await fs.writeFile("work/website-editor-controls.txt", await page.locator("body").innerText());
  await fs.writeFile(
    "work/website-editor-controls.html",
    await page.locator(".website-editor-canvas").innerHTML(),
  );
  const canvas = page.frameLocator("#preview-frame");
  await expect(canvas.locator(".website-surface")).toBeVisible();
  async function dragBlock(type, destination) {
    await destination.scrollIntoViewIfNeeded();
    const source = await page.getByTestId("drawer-item:" + type).boundingBox();
    const target = await destination.boundingBox();
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 25 });
    await page.waitForTimeout(350);
    if (type === "Text" && (await destination.getAttribute("data-puck-dropzone")) !== null) {
      const liveTarget = await destination.boundingBox();
      await page.mouse.move(
        liveTarget.x + liveTarget.width / 2,
        liveTarget.y + liveTarget.height / 2,
        { steps: 6 },
      );
      await expect(destination).toHaveClass(/--isEnabled/);
      // Puck forces nested collision recalculation 50ms after the zone changes.
      await page.waitForTimeout(100);
      await fs.writeFile(
        "work/puck-drag-geometry.json",
        JSON.stringify(
          {
            source,
            target,
            pointer: { x: target.x + target.width / 2, y: target.y + target.height / 2 },
            slot: await destination.evaluate((el) => {
              const rect = el.getBoundingClientRect();
              return {
                rect: rect.toJSON(),
                className: el.className,
                hits: document
                  .elementsFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
                  .map((hit) => ({
                    tag: hit.tagName,
                    className: hit.className,
                    zone: hit.getAttribute("data-puck-dropzone"),
                    dnd: hit.getAttribute("data-puck-dnd"),
                  })),
                zones: [...document.querySelectorAll("[data-puck-dropzone]")].map((zone) => ({
                  id: zone.getAttribute("data-puck-dropzone"),
                  className: zone.className,
                  rect: zone.getBoundingClientRect().toJSON(),
                })),
              };
            }),
          },
          null,
          2,
        ),
      );
    }
    await page.mouse.up();
  }
  await dragBlock("Heading", canvas.locator(".website-surface"));
  await expect(canvas.locator(".website-heading")).toHaveCount(1);
  await canvas.locator(".website-heading").click();
  await page
    .getByRole("textbox", { name: "Heading", exact: true })
    .fill("Built in the visual editor");
  await expect(canvas.locator(".website-heading")).toHaveText("Built in the visual editor");
  // Puck coalesces native history changes with a 250ms debounce.
  await page.waitForTimeout(350);
  await page.getByRole("button", { name: "undo", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Heading", exact: true })).not.toHaveValue(
    "Built in the visual editor",
  );
  await page.getByRole("button", { name: "redo", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Heading", exact: true })).toHaveValue(
    "Built in the visual editor",
  );
  await expect(page.getByTestId("drawer-item:Section")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download React source" })).toBeDisabled();
  await page.getByRole("button", { name: /Element library/ }).click();
  await expect(page.getByRole("button", { name: "Premium required", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Close library" }).click();
  await dragBlock("Text", canvas.locator(".website-surface"));
  await expect(canvas.locator(".website-text")).toHaveCount(1);
  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: /Open visual editor/ }).click();
  await expect(canvas.locator(".website-heading")).toHaveText("Built in the visual editor");
  await expect(page.getByText(/Recovered your unsaved/)).toBeVisible();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator(".website-editor-notices [role=status]")).toContainText("Draft saved.");
  const visualSaved = await (await page.request.get(base + "/api/profile")).json();
  expect(
    visualSaved.profile.draft.website.content.find((block) => block.type === "Heading").props.text,
  ).toBe("Built in the visual editor");
  expect(
    visualSaved.profile.draft.website.content.filter((block) => block.type === "Text"),
  ).toHaveLength(1);
  await page.reload();
  await expect(canvas.locator(".website-heading")).toHaveText("Built in the visual editor");
  await page.getByRole("button", { name: "Publish saved page", exact: true }).click();
  await expect(page.locator(".website-editor-notices [role=status]")).toContainText(
    "Your saved page is published.",
  );
  const published = await page.request.get(base + "/" + saved.profile.handle);
  expect(published.status()).toBe(200);
  expect(await published.text()).toContain("Built in the visual editor");
  await page.getByRole("button", { name: "Unpublish", exact: true }).click();
  await expect(page.locator(".website-editor-notices [role=status]")).toContainText(
    "Your page is unpublished.",
  );
  expect((await page.request.get(base + "/" + saved.profile.handle)).status()).toBe(404);
  await page.screenshot({ path: "work/website-editor-desktop.png", fullPage: true });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const editorIssues = accessibility.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact),
  );
  await fs.writeFile(
    "work/editor-accessibility.json",
    JSON.stringify(
      editorIssues.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({ html: n.html, target: n.target, summary: n.failureSummary })),
      })),
      null,
      2,
    ),
  );
  expect(editorIssues.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  await page.getByRole("button", { name: "Switch to Mobile viewport", exact: true }).click();
  await expect(canvas.locator(".website-heading")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.locator(".website-editor-preview")).toBeVisible();
  await page.screenshot({ path: "work/website-editor-mobile-preview.png", fullPage: true });
  await page.getByRole("button", { name: "Close preview", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  results.push(
    "Real Free locks, Puck drag, property edit, undo/redo, Back recovery, save/reload, mobile preview, publish/unpublish",
  );
  await page.goto(base + "/studio", { waitUntil: "domcontentloaded" });
  await page.locator(".cl-userButtonTrigger").click();
  await page.getByRole("button", { name: /Sign out/ }).click();
  await expect(page).toHaveURL(base + "/", { timeout: 30000 });
  await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  expect((await page.request.get(base + "/api/profile")).status()).toBe(401);
  results.push("Actual user-menu sign-out returns home and removes API access");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/sign-in", { waitUntil: "domcontentloaded" });
  await page.locator("input[name=identifier]").waitFor();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (await page.locator(".site-nav .brand-wordmark").boundingBox()).width,
  ).toBeGreaterThanOrEqual(100);
  await page.screenshot({ path: "work/clerk-sign-in-mobile.png", fullPage: true });
  results.push("Mobile sign-in has a readable logo and no horizontal overflow");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("input[name=identifier]").fill(email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator("input[name=password]").fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 60000 });
  await page.goto(base + "/studio", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(
    "Authentication verification",
  );
  results.push("Existing-account password login restores account-owned saved draft");
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0);
  results.push("Signed-in homepage exposes Dashboard instead of sign-in");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/studio", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Display name", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (await page.locator(".studio-top .brand-wordmark").boundingBox()).width,
  ).toBeGreaterThanOrEqual(80);
  await page.screenshot({ path: "work/clerk-authenticated-mobile.png", fullPage: true });
  results.push("Authenticated mobile editor stays within viewport");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Confirmation", { exact: true }).fill("DELETE");
  await page.getByRole("button", { name: "Delete account and page", exact: true }).click();
  await expect(page).toHaveURL(base + "/", { timeout: 30000 });
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  expect((await page.request.get(base + "/api/profile")).status()).toBe(401);
  results.push("Account deletion UI removes profile/Clerk user and returns to signed-out homepage");
  await fs.writeFile("work/clerk-live-results.json", JSON.stringify({ results }, null, 2));
  console.log(results.join("\n"));
} catch (error) {
  console.log("Last URL:", new URL(page.url()).pathname);
  console.log((await page.locator("body").innerText()).slice(0, 4500));
  await page.screenshot({ path: "work/clerk-verification-failure.png", fullPage: true });
  const frame = page
    .frames()
    .find((frame) => frame.name() === "preview-frame" || frame.url() === "about:srcdoc");
  if (frame)
    await fs.writeFile("work/puck-failure-dom.html", await frame.locator("body").innerHTML());
  throw error;
} finally {
  // Remove only this run's synthetic verification identity if a check failed.
  const users = await api.users.getUserList({ emailAddress: [email] });
  if (users.data.length) {
    // First clear this isolated test context's account records through the actual app API.
    await page.request
      .delete(base + "/api/account", { headers: { origin: base }, timeout: 10000 })
      .catch(() => {});
    const remaining = await api.users.getUserList({ emailAddress: [email] });
    for (const user of remaining.data) await api.users.deleteUser(user.id);
  }
  await browser.close();
}
