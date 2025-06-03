import { test, expect } from "@playwright/test";

test.describe("HealthyMeal App", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to be loaded
    await expect(page).toHaveTitle(/HealthyMeal/);

    // Take a screenshot for visual comparison
    await expect(page).toHaveScreenshot("homepage.png");
  });

  test("navigation works", async ({ page }) => {
    await page.goto("/");

    // Check if the page is interactive
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });
});
