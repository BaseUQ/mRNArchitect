import { expect, test } from "@playwright/test";

test("home page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/mRNArchitect/);
  await page.getByRole("textbox", { name: "Email" }).fill("test@example.com");
  await page.getByRole("textbox", { name: "Name" }).fill("Test name");
  await page.getByRole("textbox", { name: "Organisation" }).fill("Test org");
  await page.getByRole("button", { name: "Continue", exact: false }).click();
  await expect(
    page.getByRole("button", { name: "Optimise sequence" }),
  ).toBeVisible();
});
