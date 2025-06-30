import { test, expect, type Page } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { NavigationPage } from "./page-objects/NavigationPage";
import { PreferencesPage } from "./page-objects/PreferencesPage";
import { AddRecipePage } from "./page-objects/AddRecipePage";

test.describe("User Flow - Login, Preferences, Add Recipe", () => {
  // Set viewport size to desktop to ensure navigation links are visible
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  // Helper function to perform complete login and navigation
  async function loginUser(page: Page) {
    const loginPage = new LoginPage(page);
    const navigationPage = new NavigationPage(page);

    await loginPage.navigateToLoginPage();
    await loginPage.login();
    await navigationPage.waitForAuthenticatedState();

    return { loginPage, navigationPage };
  }

  // Helper function to configure preferences with random valid data
  async function setupPreferences(page: Page) {
    const navigationPage = new NavigationPage(page);
    const preferencesPage = new PreferencesPage(page);

    await navigationPage.navigateToPreferences();
    await preferencesPage.waitForFormToLoad();

    // Clear all form fields first
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

    // Fill form with random but valid data
    await preferencesPage.fillFormWithRandomData();

    return preferencesPage;
  }

  test("should complete full user journey: login → preferences → add recipe", async ({ page }) => {
    // Arrange & Act - Step 1: Login
    const { navigationPage } = await loginUser(page);

    // Assert - Verify login succeeded
    expect(await navigationPage.navigationComponent.isPreferencjeLinkVisible()).toBe(true);
    expect(await page.getByTestId("nav-authenticated-links")).toBeVisible();

    // Arrange & Act - Step 2: Configure preferences
    const preferencesPage = await setupPreferences(page);

    // Act - Save preferences
    const preferencesResult = await preferencesPage.submitAndWaitForResult();

    // Assert - Verify preferences saved successfully
    expect(preferencesResult).toBe("success");
    expect(await preferencesPage.isSuccessAlertVisible()).toBe(true);

    const successMessage = await preferencesPage.getSuccessMessage();
    expect(successMessage).toContain("Preferencje zostały zapisane pomyślnie!");

    // Arrange & Act - Step 3: Navigate to Add Recipe
    await navigationPage.navigateToAddRecipe();

    const addRecipePage = new AddRecipePage(page);
    await addRecipePage.waitForPageToLoad();

    // Assert - Verify Add Recipe page loaded
    expect(await addRecipePage.verifyPageLoaded()).toBe(true);
    expect(await page.getByTestId("add-recipe-title")).toHaveText("Dodaj Nowy Przepis");

    // Arrange & Act - Step 4: Fill recipe form
    const recipeName = `Testowy Przepis ${Date.now()}`;
    const recipeRating = 8;

    await addRecipePage.fillFormWithValidData(recipeName, recipeRating);

    // Assert - Verify form is filled correctly
    await expect(page.getByTestId("recipe-name-input")).toHaveValue(recipeName);
    await expect(page.getByTestId("recipe-rating-input")).toHaveValue(recipeRating.toString());
    await expect(page.getByTestId("recipe-content-input")).not.toHaveValue("");

    // Act - Step 5: Save recipe
    const recipeResult = await addRecipePage.submitAndWaitForResult();

    // Assert - Verify recipe saved successfully
    expect(recipeResult).toBe("success");
    expect(await addRecipePage.isSuccessAlertVisible()).toBe(true);

    const recipeSuccessMessage = await addRecipePage.getSuccessMessage();
    expect(recipeSuccessMessage).toContain(`Przepis "${recipeName}" został pomyślnie zapisany!`);

    // Additional verification - check that form was reset after successful save
    await expect(page.getByTestId("recipe-name-input")).toHaveValue("");
    await expect(page.getByTestId("recipe-rating-input")).toHaveValue("");
    await expect(page.getByTestId("recipe-content-input")).toHaveValue("");
  });

  test("should handle recipe creation without rating (optional field)", async ({ page }) => {
    // Arrange - Login and setup preferences
    await loginUser(page);
    await setupPreferences(page);
    const preferencesPage = new PreferencesPage(page);
    await preferencesPage.submitAndWaitForResult();

    // Navigate to Add Recipe
    const navigationPage = new NavigationPage(page);
    await navigationPage.navigateToAddRecipe();

    const addRecipePage = new AddRecipePage(page);
    await addRecipePage.waitForPageToLoad();

    // Act - Fill recipe form without rating
    const recipeName = `Przepis bez oceny ${Date.now()}`;
    await addRecipePage.fillRecipeName(recipeName);
    await addRecipePage.fillRecipeContent(
      `
      Prosty przepis testowy:
      1. Weź składniki
      2. Przygotuj danie
      3. Podawaj i ciesz się smakiem
    `.trim()
    );

    // Act - Save recipe
    const result = await addRecipePage.submitAndWaitForResult();

    // Assert - Should succeed even without rating
    expect(result).toBe("success");
    expect(await addRecipePage.isSuccessAlertVisible()).toBe(true);
  });

  test("should show validation errors for empty required fields", async ({ page }) => {
    // Arrange - Login and setup preferences
    await loginUser(page);
    await setupPreferences(page);
    const preferencesPage = new PreferencesPage(page);
    await preferencesPage.submitAndWaitForResult();

    // Navigate to Add Recipe
    const navigationPage = new NavigationPage(page);
    await navigationPage.navigateToAddRecipe();

    const addRecipePage = new AddRecipePage(page);
    await addRecipePage.waitForPageToLoad();

    // Act - Try to submit empty form
    await addRecipePage.submitRecipe();

    // Assert - Should show validation errors
    // Note: The exact behavior depends on form validation implementation
    // This test verifies the form handles empty required fields appropriately
    const nameError = await addRecipePage.getNameError();
    const contentError = await addRecipePage.getContentError();

    // At least one of the required fields should show an error
    expect(nameError.length > 0 || contentError.length > 0).toBe(true);
  });
});
