import { test, expect } from "@playwright/test";
test("unsaved preferences survive focus returning when no stored choice changed", async ({
  page,
}) => {
  await page.goto("/cookies");
  await page.getByRole("button", { name: "Reject optional" }).click();
  await page.getByRole("button", { name: "Change cookie choices" }).click();
  await page.getByLabel("Analytics").check();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByLabel("Analytics")).toBeChecked();
  await page.getByRole("button", { name: "Save choices" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Change cookie choices" }).click();
  await expect(page.getByLabel("Analytics")).toBeChecked();
});
test("rejection survives reload when localStorage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem,
      set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === "ownspace-consent") throw new DOMException("Blocked", "SecurityError");
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "ownspace-consent") throw new DOMException("Blocked", "SecurityError");
      return set.call(this, key, value);
    };
  });
  await page.goto("/cookies");
  await page.getByRole("button", { name: "Reject optional" }).click();
  await expect(page.getByLabel("Cookie choices")).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Cookie choices")).toHaveCount(0);
  await page.getByRole("button", { name: "Change cookie choices" }).click();
  await expect(page.getByLabel("Analytics")).not.toBeChecked();
  await expect(page.getByLabel("Marketing")).not.toBeChecked();
});
test("withdrawal in one tab updates an already-open preferences panel in another", async ({
  context,
  page,
}) => {
  await page.goto("/cookies");
  await page.getByRole("button", { name: "Accept optional" }).click();
  const second = await context.newPage();
  await second.goto("/cookies");
  await second.getByRole("button", { name: "Change cookie choices" }).click();
  await expect(second.getByLabel("Marketing")).toBeChecked();
  await page.getByRole("button", { name: "Change cookie choices" }).click();
  await page.getByRole("button", { name: "Reject optional" }).click();
  await expect(second.getByLabel("Marketing")).not.toBeChecked();
  await expect(second.getByLabel("Analytics")).not.toBeChecked();
  await second.close();
});
