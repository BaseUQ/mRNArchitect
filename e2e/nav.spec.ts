import { expect, test } from "@playwright/test";

test("home page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/mRNArchitect/);
});

test("get started link", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Get started!" }).click();
  await expect(page.getByRole("link", { name: "Optimizer" })).toHaveClass(
    "active",
  );
  await expect(
    page.getByRole("button", { name: "Optimize sequence" }),
  ).toBeVisible();
});
