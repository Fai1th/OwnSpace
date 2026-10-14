import { expect, test } from "@playwright/test";
const documents = [
  "/terms",
  "/privacy",
  "/cookies",
  "/acceptable-use",
  "/refunds",
  "/copyright",
  "/subprocessors",
  "/privacy-choices",
];

test("legal hub reaches every policy and the policies fit the viewport", async ({ page }) => {
  test.setTimeout(90000);
  await page.goto("/legal");
  const banner = page.getByLabel("Cookie choices", { exact: true });
  if (await banner.isVisible())
    await page.getByRole("button", { name: "Reject optional", exact: true }).click();
  for (const href of documents) {
    await page.goto("/legal");
    const link = page.locator(`main article a[href="${href}"]`).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(href + "$"));
    await expect(page.locator("main h1")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Legal documents", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

test("public privacy choices withdraw consent and retain rejection after reload", async ({
  page,
}) => {
  await page.goto("/privacy-choices");
  const banner = page.getByLabel("Cookie choices", { exact: true });
  if (await banner.isVisible())
    await page.getByRole("button", { name: "Reject optional", exact: true }).click();
  await page.getByRole("button", { name: "Change cookie choices", exact: true }).click();
  await page.getByRole("button", { name: "Accept optional", exact: true }).click();
  await page.getByRole("button", { name: "Change cookie choices", exact: true }).click();
  await page.getByRole("button", { name: "Reject optional", exact: true }).click();
  expect(
    await page.evaluate(() => {
      const choice = JSON.parse(localStorage.getItem("ownspace-consent") || "null");
      return choice?.analytics === false && choice?.marketing === false;
    }),
  ).toBe(true);
  await page.reload();
  await expect(banner).toHaveCount(0);
  await expect(page.locator("script#ownspace-ga, script#ownspace-meta")).toHaveCount(0);
  await page.getByRole("button", { name: "Change cookie choices", exact: true }).click();
  await expect(page.getByLabel("Analytics")).not.toBeChecked();
  await expect(page.getByLabel("Marketing")).not.toBeChecked();
});

test("privacy choices point to real self-service routes and do not submit a pretend request", async ({
  page,
}) => {
  await page.goto("/privacy-choices");
  await expect(
    page.getByRole("link", { name: "Download saved Ownspace data", exact: true }),
  ).toHaveAttribute("href", "/api/export");
  await expect(page.getByRole("link", { name: "Open Studio", exact: true })).toHaveAttribute(
    "href",
    "/studio",
  );
  await expect(page.locator("main form")).toHaveCount(0);
  await expect(page.getByText("Delete account and page", { exact: true })).toBeVisible();
});
