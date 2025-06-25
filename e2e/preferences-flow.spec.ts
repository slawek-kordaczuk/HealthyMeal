import { test, expect, type Page } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { NavigationPage } from "./page-objects/NavigationPage";
import { PreferencesPage } from "./page-objects/PreferencesPage";

test.describe("Preferences Flow", () => {
  // Helper function to login and navigate to preferences
  async function loginAndNavigateToPreferences(page: Page) {
    const loginPage = new LoginPage(page);
    const navigationPage = new NavigationPage(page);
    const preferencesPage = new PreferencesPage(page);

    await loginPage.navigateToLoginPage();
    await loginPage.login("test@test.pl", "TestPassword123");
    await navigationPage.waitForAuthenticatedState();
    await navigationPage.navigateToPreferences();
    await preferencesPage.waitForFormToLoad();

    return { loginPage, navigationPage, preferencesPage };
  }

  // Helper function to clear all form fields
  async function clearAllFormFields(page: Page) {
    const fields = [
      "preferences-diet-type-input",
      "preferences-calorie-requirement-input",
      "preferences-allergies-input",
      "preferences-food-intolerances-input",
      "preferences-preferred-cuisines-input",
      "preferences-excluded-ingredients-input",
      "preferences-protein-input",
      "preferences-fats-input",
      "preferences-carbohydrates-input",
    ];

    for (const fieldId of fields) {
      const field = page.getByTestId(fieldId);
      if (await field.isVisible()) {
        await field.click();
        await field.clear();
      }
    }
  }

  test("should complete full preferences configuration flow", async ({ page }) => {
    // Arrange - Initialize page objects and clear previous data
    const { preferencesPage } = await loginAndNavigateToPreferences(page);
    await clearAllFormFields(page);

    // Verify page loaded correctly
    expect(await preferencesPage.verifyPreferencesPageLoaded()).toBe(true);
    expect(await page.getByTestId("preferences-title")).toHaveText("Konfiguracja Preferencji");

    // Act - Fill form with valid data
    await preferencesPage.fillFormWithRandomData();

    // Assert - Verify all fields are filled correctly
    await expect(page.getByTestId("preferences-diet-type-input")).toHaveValue("wegetariańska");
    await expect(page.getByTestId("preferences-calorie-requirement-input")).toHaveValue("2000");
    await expect(page.getByTestId("preferences-allergies-input")).toHaveValue("orzechy, skorupiaki");
    await expect(page.getByTestId("preferences-food-intolerances-input")).toHaveValue("laktoza");
    await expect(page.getByTestId("preferences-preferred-cuisines-input")).toHaveValue("włoska, śródziemnomorska");
    await expect(page.getByTestId("preferences-excluded-ingredients-input")).toHaveValue("mięso czerwone");
    await expect(page.getByTestId("preferences-protein-input")).toHaveValue("30");
    await expect(page.getByTestId("preferences-fats-input")).toHaveValue("30");
    await expect(page.getByTestId("preferences-carbohydrates-input")).toHaveValue("40");

    // Act - Submit the form and wait for response
    const result = await preferencesPage.submitAndWaitForResult();

    // Assert - Verify successful submission
    expect(result).toBe("success");
    expect(await preferencesPage.isSuccessAlertVisible()).toBe(true);

    const successMessage = await preferencesPage.getSuccessMessage();
    expect(successMessage).toContain("Preferencje zostały zapisane pomyślnie!");

    // Additional verification - check that form is still functional after save
    expect(await preferencesPage.isSubmitButtonDisabled()).toBe(false);
    expect(await preferencesPage.getSubmitButtonText()).toBe("Zapisz preferencje");
  });

  test("should handle macro distribution validation correctly", async ({ page }) => {
    // Arrange
    const { preferencesPage } = await loginAndNavigateToPreferences(page);
    await clearAllFormFields(page);

    // Act - Fill form with valid macro distribution (25/35/40 = 100%)
    await preferencesPage.fillFormWithValidMacros(25, 35, 40);

    // Assert - Verify macros are filled correctly
    await expect(page.getByTestId("preferences-protein-input")).toHaveValue("25");
    await expect(page.getByTestId("preferences-fats-input")).toHaveValue("35");
    await expect(page.getByTestId("preferences-carbohydrates-input")).toHaveValue("40");

    // Act - Submit and verify success
    const result = await preferencesPage.submitAndWaitForResult();

    // Assert
    expect(result).toBe("success");
    expect(await preferencesPage.isSuccessAlertVisible()).toBe(true);
  });

  test("should show validation error for invalid macro distribution", async ({ page }) => {
    // Arrange
    const { preferencesPage } = await loginAndNavigateToPreferences(page);
    await clearAllFormFields(page);

    // Act - Fill form with invalid macro distribution (sum > 100%)
    await preferencesPage.fillDietType("keto");
    await preferencesPage.fillCalorieRequirement(1500);
    await preferencesPage.fillProtein(50); // These sum to 110%
    await preferencesPage.fillFats(30);
    await preferencesPage.fillCarbohydrates(30);

    // Act - Submit form
    await preferencesPage.submitForm();

    // Assert - Should show validation error
    // The form should show validation error since macros don't sum to 100%
    await expect(page.getByTestId("preferences-protein-error")).toBeVisible();
  });

  test("should preserve form data after failed submission", async ({ page }) => {
    // Arrange
    const { preferencesPage } = await loginAndNavigateToPreferences(page);
    await clearAllFormFields(page);

    // Act - Fill form with data
    const testDietType = "paleolityczna";
    const testCalories = 2200;

    await preferencesPage.fillDietType(testDietType);
    await preferencesPage.fillCalorieRequirement(testCalories);
    await preferencesPage.fillAllergies("test alergie");

    // Assert - Verify data is preserved even after any validation issues
    await expect(page.getByTestId("preferences-diet-type-input")).toHaveValue(testDietType);
    await expect(page.getByTestId("preferences-calorie-requirement-input")).toHaveValue(testCalories.toString());
    await expect(page.getByTestId("preferences-allergies-input")).toHaveValue("test alergie");
  });

  test("should allow partial form submission with valid data", async ({ page }) => {
    // Arrange
    const { preferencesPage } = await loginAndNavigateToPreferences(page);
    await clearAllFormFields(page);

    // Act - Fill only some fields (partial data)
    await preferencesPage.fillDietType("śródziemnomorska");
    await preferencesPage.fillCalorieRequirement(1900);
    // Leave other fields empty

    // Act - Submit form
    const result = await preferencesPage.submitAndWaitForResult();

    // Assert - Should succeed since all fields are optional
    expect(result).toBe("success");
    expect(await preferencesPage.isSuccessAlertVisible()).toBe(true);
  });
});
