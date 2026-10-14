import nextEnv from "@next/env";
import { chromium, expect } from "@playwright/test";
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
  await expect(page).toHaveURL(/\/studio$/, { timeout: 60000 });
  await page.getByLabel("Display name", { exact: true }).fill("Authentication verification");
  await page.getByLabel("Page address", { exact: true }).fill("auth-check-" + Date.now());
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your submitted draft is saved.");
  const saved = await (await page.request.get(base + "/api/profile")).json();
  expect(saved.profile.owner).toMatch(/^user_/);
  results.push("Real signup, test email verification, studio redirect and authenticated save");
  await page.screenshot({ path: "work/clerk-authenticated-desktop.png", fullPage: true });
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
  await expect(page).toHaveURL(/\/studio$/, { timeout: 60000 });
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
  expect(
    (await page.request.delete(base + "/api/account", { headers: { origin: base } })).status(),
  ).toBe(200);
  results.push("Account deletion removes test profile and Clerk user");
  await fs.writeFile("work/clerk-live-results.json", JSON.stringify({ results }, null, 2));
  console.log(results.join("\n"));
} catch (error) {
  console.log("Last URL:", new URL(page.url()).pathname);
  console.log((await page.locator("body").innerText()).slice(0, 4500));
  await page.screenshot({ path: "work/clerk-verification-failure.png", fullPage: true });
  throw error;
} finally {
  // Remove only this run's synthetic verification identity if a check failed.
  const users = await api.users.getUserList({ emailAddress: [email] });
  for (const user of users.data) await api.users.deleteUser(user.id);
  await browser.close();
}
