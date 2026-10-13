import { test, expect } from "@playwright/test";
test("homepage shows the actual product, switches styles and rejects optional cookies", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your links. Your look. Your own space." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reject optional" }).click();
  await expect(page.getByLabel("Cookie choices")).toHaveCount(0);
  const c = await page.evaluate(() => JSON.parse(localStorage.getItem("ownspace-consent")!));
  expect(c.analytics).toBe(false);
  expect(c.marketing).toBe(false);
  await page.getByRole("button", { name: "Open sky", exact: true }).click();
  await expect(page.locator(".phone .theme-aero")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.getByRole("button", { name: "After dark", exact: true }).click();
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: "work/hero-" + test.info().project.name + ".png",
    fullPage: false,
  });
  await page.screenshot({ path: "work/home-" + test.info().project.name + ".png", fullPage: true });
});
test("editor persists a local draft, reorders links, previews and explains publication", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/studio");
  await page.getByRole("button", { name: "Reject optional" }).click();
  await page.getByLabel("Display name", { exact: true }).fill("Night visitor");
  await page.getByLabel("Page address", { exact: true }).fill("night-visitor");
  await page.getByRole("button", { name: "Links", exact: true }).click();
  await page.getByRole("button", { name: "Add a link", exact: true }).click();
  await page.getByLabel("Label", { exact: true }).fill("My projects");
  await page.getByLabel("URL", { exact: true }).fill("https://github.com");
  await page.getByRole("button", { name: "Add a link", exact: true }).click();
  await page.getByLabel("Label", { exact: true }).nth(1).fill("My playlist");
  await page.getByLabel("URL", { exact: true }).nth(1).fill("https://open.spotify.com");
  await page.getByRole("button", { name: "Move link 2 up", exact: true }).click();
  await expect(page.getByLabel("Label", { exact: true }).first()).toHaveValue("My playlist");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.reload();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue("Night visitor");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Back to editing" }).click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.locator(".studio-alert")).toContainText("Sign in");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "work/editor-" + test.info().project.name + ".png",
    fullPage: true,
  });
});
test("consent can be reopened and changed without accepting marketing", async ({ page }) => {
  await page.goto("/cookies");
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await page.getByLabel("Analytics", { exact: false }).check();
  await page.getByRole("button", { name: "Save choices" }).click();
  await page.getByRole("button", { name: "Change cookie choices" }).click();
  await expect(page.getByLabel("Analytics", { exact: false })).toBeChecked();
  await expect(page.getByLabel("Marketing", { exact: false })).not.toBeChecked();
  await page.getByRole("button", { name: "Reject optional" }).click();
  const c = await page.evaluate(() => JSON.parse(localStorage.getItem("ownspace-consent")!));
  expect(c.analytics).toBe(false);
});
test("account mutations fail closed without credentials", async ({ request }) => {
  for (const endpoint of ["/api/profile", "/api/export", "/api/github", "/api/account"]) {
    const r = await request.get(endpoint);
    expect(r.status()).toBe(503);
  }
  const r = await request.put("/api/profile", {
    headers: { origin: "https://attacker.example" },
    data: {},
  });
  expect(r.status()).toBe(403);
});
test("legal pages, example profiles and unavailable sign-in remain usable", async ({ page }) => {
  for (const path of [
    "/privacy",
    "/terms",
    "/cookies",
    "/pricing",
    "/examples/jules",
    "/sign-in",
  ]) {
    const r = await page.goto(path);
    expect(r?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
