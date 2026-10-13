import { test, expect } from "@playwright/test";
test("a checkout return URL cannot unlock Premium in the local preview", async ({ page }) => {
  const statusRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/account") statusRequests.push(request.url());
  });
  await page.goto("/studio?purchase=complete");
  await page.getByRole("button", { name: "Reject optional" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A little more room to be you." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Premium is yours." })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Unlock Premium" })).toBeDisabled();
  expect(statusRequests).toEqual([]);
});
test("deleting a browser draft removes its content after reload", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("button", { name: "Reject optional" }).click();
  await page.getByLabel("Display name", { exact: true }).fill("Delete this draft");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const remove = page.getByRole("button", { name: "Delete page", exact: true });
  await expect(remove).toBeDisabled();
  await page.getByLabel("Confirmation", { exact: true }).fill("DELETE");
  await remove.click();
  await expect(page.getByRole("status")).toContainText("Browser draft deleted");
  await page.reload();
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue("Your name");
  expect(await page.evaluate(() => localStorage.getItem("ownspace-draft-v1") || "")).not.toContain(
    "Delete this draft",
  );
});

test("Global Privacy Control overrides an earlier optional consent", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "ownspace-consent",
      JSON.stringify({
        version: 1,
        necessary: true,
        analytics: true,
        marketing: true,
        updatedAt: Date.now(),
      }),
    );
  });
  await page.setExtraHTTPHeaders({ "sec-gpc": "1" });
  await page.goto("/cookies");
  await page.getByRole("button", { name: "Change cookie choices" }).click();
  await expect(page.getByLabel("Analytics")).not.toBeChecked();
  await expect(page.getByLabel("Marketing")).not.toBeChecked();
  await expect(page.getByLabel("Marketing")).toBeDisabled();
  await page.getByRole("button", { name: "Accept optional" }).click();
  const c = await page.evaluate(() => JSON.parse(localStorage.getItem("ownspace-consent")!));
  expect(c.analytics).toBe(false);
  expect(c.marketing).toBe(false);
  expect(
    await page.locator('script[src*="googletagmanager"],script[src*="fbevents"]').count(),
  ).toBe(0);
});
test("unfinished links survive a reload and invalid links cannot be saved", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("button", { name: "Reject optional" }).click();
  await page.getByRole("button", { name: "Links", exact: true }).click();
  await page.getByRole("button", { name: "Add a link", exact: true }).click();
  await expect
    .poll(async () =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("ownspace-draft-v1") || "{}").links?.length,
      ),
    )
    .toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "Links", exact: true }).click();
  await expect(page.getByLabel("Label", { exact: true })).toHaveValue("");
  await page.getByLabel("Label", { exact: true }).fill("Bad link");
  await page.getByLabel("URL", { exact: true }).fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".studio-alert")).toContainText("HTTPS");
});
test("phone rotation has a usable reset and respects reduced motion", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reject optional" }).click();
  const handle = page.getByRole("button", { name: "Drag to rotate the phone" });
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
    await page.mouse.up();
  }
  await page.getByRole("button", { name: "Reset phone angle" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(handle).toBeDisabled();
});
