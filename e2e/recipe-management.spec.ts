import { test, expect, type Page } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { NavigationPage } from "./page-objects/NavigationPage";
import { PreferencesPage } from "./page-objects/PreferencesPage";
import { AddRecipePage } from "./page-objects/AddRecipePage";
import { RecipesPage } from "./page-objects/RecipesPage";

test.describe("Recipe Management", () => {
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

  // Helper function to create a recipe
  async function createRecipe(page: Page, recipeName: string) {
    const navigationPage = new NavigationPage(page);
    const addRecipePage = new AddRecipePage(page);

    await navigationPage.navigateToAddRecipe();
    await addRecipePage.waitForPageToLoad();

    await addRecipePage.fillFormWithValidData(recipeName, 8);
    const result = await addRecipePage.submitAndWaitForResult();

    return result;
  }

  test("should create, find and delete recipe", async ({ page }) => {
    // Arrange & Act - Step 1: Login
    await loginUser(page);

    // Assert - Verify login succeeded
    await expect(page.getByTestId("nav-authenticated-links")).toBeVisible();
    await expect(page.getByTestId("nav-link-preferencje")).toBeVisible();

    // Arrange & Act - Step 2: Configure preferences
    const preferencesPage = await setupPreferences(page);

    // Act - Save preferences
    const preferencesResult = await preferencesPage.submitAndWaitForResult();

    // Assert - Verify preferences saved successfully
    expect(preferencesResult).toBe("success");
    expect(await preferencesPage.isSuccessAlertVisible()).toBe(true);

    // Arrange & Act - Step 3: Create a recipe
    const recipeName = `Test Recipe ${Date.now()}`;
    const createResult = await createRecipe(page, recipeName);

    // Assert - Verify recipe created successfully
    expect(createResult).toBe("success");

    // Arrange & Act - Step 4: Navigate to "Moje Przepisy" and use RecipesPage
    await page.getByTestId("nav-link-moje-przepisy").click();

    const recipesPage = new RecipesPage(page);
    await recipesPage.waitForPageToLoad();
    await recipesPage.waitForRecipesToLoad();

    // Step 5: Search for the created recipe to verify it exists
    await recipesPage.searchForRecipe(recipeName);

    // Find the specific recipe by name
    const foundRecipeId = await recipesPage.findRecipeByName(recipeName);
    expect(foundRecipeId).not.toBeNull(); // Ensure we found the recipe
    expect(foundRecipeId).not.toBe(""); // Ensure we found the recipe

    if (!foundRecipeId) {
      throw new Error(`Recipe with name "${recipeName}" not found`);
    }

    // Verify recipe details are displayed correctly
    await recipesPage.verifyRecipeExists(foundRecipeId, recipeName);

    // Step 6: Delete the created recipe
    await recipesPage.clickDeleteRecipe(foundRecipeId);
    await recipesPage.handleDeleteModal(recipeName);

    // Assert - Verify recipe was deleted
    // The recipe should no longer appear in search results (with built-in retry logic)
    await recipesPage.verifyRecipeNotInList(recipeName);
  });

  test("should create and delete recipe without search", async ({ page }) => {
    // Arrange - Login and setup preferences
    await loginUser(page);
    const preferencesPage = await setupPreferences(page);
    await preferencesPage.submitAndWaitForResult();

    // Create a recipe
    const recipeName = `Simple Recipe ${Date.now()}`;
    await createRecipe(page, recipeName);

    // Navigate to recipes list
    await page.getByTestId("nav-link-moje-przepisy").click();

    const recipesPage = new RecipesPage(page);
    await recipesPage.waitForPageToLoad();
    await recipesPage.waitForRecipesToLoad();

    // Find and delete the first recipe in the list
    const firstRecipeId = await recipesPage.getFirstRecipeId();
    await recipesPage.clickDeleteRecipe(firstRecipeId);
    await recipesPage.handleDeleteModal();
  });

  test("should cancel recipe deletion", async ({ page }) => {
    // Arrange - Login, setup preferences, and create recipe
    await loginUser(page);
    const preferencesPage = await setupPreferences(page);
    await preferencesPage.submitAndWaitForResult();

    const recipeName = `Cancel Test Recipe ${Date.now()}`;
    await createRecipe(page, recipeName);

    // Navigate to recipes and attempt to delete
    await page.getByTestId("nav-link-moje-przepisy").click();

    const recipesPage = new RecipesPage(page);
    await recipesPage.waitForPageToLoad();
    await recipesPage.waitForRecipesToLoad();

    const firstRecipeId = await recipesPage.getFirstRecipeId();

    // Start deletion process
    await recipesPage.clickDeleteRecipe(firstRecipeId);
    await recipesPage.handleCancelModal();

    // Verify recipe still exists
    await recipesPage.verifyRecipeExists(firstRecipeId, recipeName);
  });
});
