import nextEnv from "@next/env";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import AxeBuilder from "@axe-core/playwright";
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
  throw Error("Billing browser checks require D:, local storage and Clerk development keys.");
process.env.TEMP = path.resolve("work");
process.env.TMP = process.env.TEMP;
process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const fixture = JSON.parse(await fs.readFile("work/premium-test-private.json", "utf8"));
if (!/^ownspace-premium\+clerk_test_\d+@example\.com$/.test(fixture.email))
  throw Error("Expected disposable Premium fixture.");
await clerkSetup();
const browser = await chromium.launch({ channel: "msedge" });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);
let state = { entitlement: "free", payment: "none" };
let billingReads = 0;
try {
  await setupClerkTestingToken({ page });
  await page.goto(base.origin + "/dashboard/billing");
  await expect(page).toHaveURL(/\/sign-in/);
  const reject = page.getByRole("button", { name: "Reject optional" });
  if (await reject.isVisible()) await reject.click();
  await clerk.signIn({ page, emailAddress: fixture.email });
  // UI state simulations are intercepted in the browser; no Stripe purchase endpoint is called.
  await page.route("**/api/billing", async (route) => {
    billingReads++;
    await route.fulfill({ json: state });
  });
  let attempted = 0;
  await page.route("**/api/checkout", async (route) => {
    attempted++;
    await route.fulfill({
      status: 503,
      json: { error: "Verification fixture: checkout unavailable." },
    });
  });
  await page.goto(base.origin + "/dashboard/billing");
  const buy = page.getByRole("button", { name: "Continue to secure checkout" });
  await expect(buy).toBeEnabled();
  await buy.click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Verification fixture");
  expect(attempted).toBe(1);
  await page.screenshot({ path: "work/billing-desktop.png", fullPage: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base.origin + "/dashboard/billing?purchase=cancelled");
    await expect(
      page.getByText("Checkout cancelled. Your website and plan are unchanged."),
    ).toBeVisible();
    await expect(buy).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      accessibility.violations.filter((v) => ["serious", "critical"].includes(v.impact || "")),
    ).toEqual([]);
    if (width === 390) await page.screenshot({ path: "work/billing-mobile.png", fullPage: true });
  }
  state = { entitlement: "free", payment: "pending" };
  await page.goto(base.origin + "/dashboard/billing?purchase=complete");
  await expect(page.getByText(/Your payment is being confirmed/)).toBeVisible();
  await expect(buy).toBeDisabled();
  state = { entitlement: "paid", payment: "confirmed" };
  await expect(page.getByText(/Premium is active/)).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("link", { name: "Use Premium in the editor" })).toBeVisible();
  state = { entitlement: "free", payment: "failed" };
  await page.reload();
  await expect(page.getByText(/payment did not complete/)).toBeVisible();
  await expect(buy).toBeEnabled();
  state = { entitlement: "refunded", payment: "pending" };
  await page.reload();
  await expect(page.getByText(/Your payment is being confirmed/)).toBeVisible();
  await expect(buy).toBeDisabled();
  state = { entitlement: "disputed", payment: "revoked" };
  await page.goto(base.origin + "/dashboard/billing");
  await expect(page.getByText(/suspended while its payment dispute/)).toBeVisible();
  await expect(buy).toBeDisabled();
  await page.unroute("**/api/billing");
  const actual = await page.request.get(base.origin + "/api/billing");
  expect(actual.status()).toBe(200);
  expect(await actual.json()).toEqual({ entitlement: "paid", payment: "confirmed" });
  await page.goto(base.origin + "/editor");
  await expect(page.getByRole("link", { name: "Premium & billing" })).toBeVisible();
  console.log(
    JSON.stringify({
      passed: true,
      actualDevelopmentAuth: true,
      realStripePurchases: 0,
      billingReads,
      checkoutErrors: attempted,
      widths: [1440, 390],
      seriousAccessibilityViolations: 0,
    }),
  );
} finally {
  await browser.close();
}
