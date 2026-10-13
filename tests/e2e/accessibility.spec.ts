import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("core pages have no serious accessibility violations", async ({ page }) => {
  for (const path of ["/", "/studio", "/cookies"]) {
    await page.goto(path);
    if (await page.getByRole("button", { name: "Reject optional" }).isVisible())
      await page.getByRole("button", { name: "Reject optional" }).click();
    if (path === "/") await expect(page.locator(".hero-copy")).toHaveCSS("opacity", "1");
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toEqual([]);
  }
});
