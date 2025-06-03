import { test, expect } from "@playwright/test";
import { HomePage } from "./page-objects/HomePage";

test.describe("Homepage Tests", () => {
  test("should load homepage successfully", async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    // Verify page title
    await expect(page).toHaveTitle(/HealthyMeal/);

    // Verify main content is visible
    await expect(homePage.mainContent).toBeVisible();

    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot("homepage-loaded.png");
  });

  test("should display navigation menu", async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    // Verify navigation menu is present
    await expect(homePage.navigationMenu).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const homePage = new HomePage(page);
    await homePage.goto();

    // Verify page loads on mobile
    await expect(homePage.mainContent).toBeVisible();

    // Take mobile screenshot
    await expect(page).toHaveScreenshot("homepage-mobile.png");
  });
});
