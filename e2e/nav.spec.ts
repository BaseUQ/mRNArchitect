import { expect, test } from "@playwright/test";

test("home page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/mRNArchitect/);
  await expect(page.getByRole("button", { name: "Optimize" })).toBeVisible();
});
