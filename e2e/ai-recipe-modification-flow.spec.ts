import { test, expect, type Page } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { NavigationPage } from "./page-objects/NavigationPage";
import { PreferencesPage } from "./page-objects/PreferencesPage";
import { AddRecipePage } from "./page-objects/AddRecipePage";
import { RecipesPage } from "./page-objects/RecipesPage";
import { createSupabaseTeardownClient } from "../src/db/supabase.client";

test.describe("AI Recipe Modification Flow", () => {
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

  // Helper function to clear user preferences directly from database
  async function clearUserPreferences() {
    const testUserId = process.env.E2E_USERNAME_ID;
    if (!testUserId) {
      console.error("❌ Brak zmiennej środowiskowej E2E_USERNAME_ID");
      throw new Error("Missing test user ID environment variable");
    }

    const { client: supabase, isServiceRole } = createSupabaseTeardownClient();

    // If using anon key, try to authenticate as the test user
    if (!isServiceRole) {
      const testEmail = process.env.E2E_USERNAME;
      const testPassword = process.env.E2E_PASSWORD;

      if (testEmail && testPassword) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

        if (authError) {
          console.error("❌ Błąd logowania podczas czyszczenia preferencji:", authError);
          throw authError;
        }
      }
    }

    try {
      // Delete preferences of test user
      const { data: deletedPreferences, error: preferencesError } = await supabase
        .from("preferences")
        .delete()
        .eq("user_id", testUserId)
        .select();

      if (preferencesError) {
        console.error("❌ Błąd podczas usuwania preferencji:", preferencesError);
        throw preferencesError;
      }

      const preferencesCount = deletedPreferences?.length || 0;
      if (preferencesCount > 0) {
        console.log(`🧹 Usunięto ${preferencesCount} preferencji testowego użytkownika`);
      }
    } catch (error) {
      console.error("❌ Błąd podczas czyszczenia preferencji:", error);
      throw error;
    }
  }

  test("should complete full AI recipe modification journey: login → preferences → AI recipe creation → verification → cleanup", async ({
    page,
  }) => {
    // === STEP 1: Login ===
    console.log("Step 1: Logging in user");
    const { navigationPage } = await loginUser(page);

    // Assert - Verify login succeeded and preferences button is visible
    expect(await navigationPage.navigationComponent.isPreferencjeLinkVisible()).toBe(true);
    expect(await page.getByTestId("nav-authenticated-links")).toBeVisible();

    // === STEP 2: Wait for authenticated state ===
    console.log("Step 2: Waiting for authenticated state");
    await navigationPage.waitForAuthenticatedState();

    // === STEP 3: Navigate to Preferences ===
    console.log("Step 3: Navigating to Preferences");
    const preferencesPage = await setupPreferences(page);

    // === STEP 4: Fill all preference fields with valid random data ===
    console.log("Step 4: Filling preferences with random valid data");
    // This is already done in setupPreferences() function

    // === STEP 5: Save preferences ===
    console.log("Step 5: Saving preferences");
    const preferencesResult = await preferencesPage.submitAndWaitForResult();

    // Assert - Verify preferences saved successfully
    expect(preferencesResult).toBe("success");
    expect(await preferencesPage.isSuccessAlertVisible()).toBe(true);

    const successMessage = await preferencesPage.getSuccessMessage();
    expect(successMessage).toContain("Preferencje zostały zapisane pomyślnie!");

    // === STEP 6: Navigate to Add Recipe ===
    console.log("Step 6: Navigating to Add Recipe");
    await navigationPage.navigateToAddRecipe();

    const addRecipePage = new AddRecipePage(page);
    await addRecipePage.waitForPageToLoad();

    // Assert - Verify Add Recipe page loaded
    expect(await addRecipePage.verifyPageLoaded()).toBe(true);
    expect(await page.getByTestId("add-recipe-title")).toHaveText("Dodaj Nowy Przepis");

    // === STEP 7: Fill recipe form ===
    console.log("Step 7: Filling recipe form");
    const recipeName = `AI Modified Recipe ${Date.now()}`;
    const recipeRating = 9;
    const recipeContent = `
      Składniki:
      - 300g mąki pszennej
      - 3 jajka
      - 300ml mleka
      - 2 łyżki masła
      - 1 łyżeczka soli
      - 1 łyżka cukru
      - 1 łyżeczka proszku do pieczenia
      
      Przygotowanie:
      1. Wymieszaj suche składniki w dużej misce
      2. W osobnej misce ubij jajka z mlekiem
      3. Połącz mokre i suche składniki
      4. Dodaj roztopione masło i wymieszaj
      5. Zostaw ciasto na 10 minut
      6. Smaż naleśniki na rozgrzanej patelni
      7. Podawaj z ulubionymi dodatkami
    `.trim();

    await addRecipePage.fillFormWithValidData(recipeName, recipeRating, recipeContent);

    // Assert - Verify form is filled correctly
    await expect(page.getByTestId("recipe-name-input")).toHaveValue(recipeName);
    await expect(page.getByTestId("recipe-rating-input")).toHaveValue(recipeRating.toString());
    await expect(page.getByTestId("recipe-content-input")).toHaveValue(recipeContent);

    // === STEP 8: Modify recipe with AI and wait for modified content ===
    console.log("Step 8: Modifying recipe with AI");
    const aiResult = await addRecipePage.submitWithAIAndApprove(recipeName, recipeRating, recipeContent);

    // Assert - Verify AI modification succeeded
    expect(aiResult).toBe("success");

    // Verify AI preview section appeared and was used
    expect(await addRecipePage.isAIPreviewSectionVisible()).toBe(false); // Should be gone after approval

    // === STEP 9: Verify recipe was created successfully ===
    console.log("Step 9: Verifying recipe creation success");
    expect(await addRecipePage.isSuccessAlertVisible()).toBe(true);

    const recipeSuccessMessage = await addRecipePage.getSuccessMessage();
    expect(recipeSuccessMessage).toContain(`Przepis "${recipeName}" został pomyślnie zapisany!`);

    // Additional verification - check that form was reset after successful save
    await expect(page.getByTestId("recipe-name-input")).toHaveValue("");
    await expect(page.getByTestId("recipe-rating-input")).toHaveValue("");
    await expect(page.getByTestId("recipe-content-input")).toHaveValue("");

    // === STEP 10: Navigate to "Moje Przepisy" ===
    console.log("Step 10: Navigating to My Recipes");
    await navigationPage.navigateToRecipes();

    const recipesPage = new RecipesPage(page);
    await recipesPage.waitForPageToLoad();
    await recipesPage.waitForRecipesToLoad();

    // Assert - Verify recipes page loaded
    expect(await page.getByTestId("recipe-list-container")).toBeVisible();

    // === STEP 11: Verify the created recipe appears in the list ===
    console.log("Step 11: Verifying recipe appears in list");
    await recipesPage.searchForRecipe(recipeName);

    // Find the specific recipe by name
    const foundRecipeId = await recipesPage.findRecipeByName(recipeName);
    expect(foundRecipeId).not.toBeNull();
    expect(foundRecipeId).not.toBe("");

    if (!foundRecipeId) {
      throw new Error(`Recipe with name "${recipeName}" not found in the list`);
    }

    // Verify recipe details are displayed correctly
    await recipesPage.verifyRecipeExists(foundRecipeId, recipeName);

    // Verify the recipe source should be "AI" since it was modified with AI
    const sourceElement = page.getByTestId(`recipe-source-${foundRecipeId}`);
    const sourceText = await sourceElement.textContent();
    expect(sourceText).toContain("AI");

    // === STEP 12: Delete the created recipe ===
    console.log("Step 12: Deleting the created recipe");
    await recipesPage.clickDeleteRecipe(foundRecipeId);
    await recipesPage.handleDeleteModal(recipeName);

    // Assert - Verify recipe was deleted successfully
    await recipesPage.verifyRecipeNotInList(recipeName);

    console.log("✅ AI Recipe Modification Flow completed successfully!");
  });

  test("should handle AI modification when preferences are not set", async ({ page }) => {
    // === STEP 0: Clear any existing preferences ===
    console.log("Step 0: Clearing existing preferences from database");
    await clearUserPreferences();

    // Refresh page to ensure hooks update their state
    await page.reload();
    await page.waitForLoadState("networkidle");

    // === STEP 1: Login without setting preferences ===
    console.log("Step 1: Logging in user without preferences");
    const { navigationPage } = await loginUser(page);

    // Assert - Verify login succeeded
    expect(await navigationPage.navigationComponent.isPreferencjeLinkVisible()).toBe(true);
    expect(await page.getByTestId("nav-authenticated-links")).toBeVisible();

    // === STEP 2: Navigate to Add Recipe ===
    console.log("Step 2: Navigating to Add Recipe");
    await navigationPage.navigateToAddRecipe();

    const addRecipePage = new AddRecipePage(page);
    await addRecipePage.waitForPageToLoad();

    // === STEP 3: Fill recipe form ===
    console.log("Step 3: Filling recipe form");
    const recipeName = `No Preferences Recipe ${Date.now()}`;
    const recipeRating = 7;

    await addRecipePage.fillFormWithValidData(recipeName, recipeRating);

    // === STEP 4: Try to modify with AI (should show preferences modal) ===
    console.log("Step 4: Attempting AI modification without preferences");
    await addRecipePage.submitRecipeWithAI();

    // Assert - Wait for preferences modal to appear
    await addRecipePage.waitForConfirmAIModificationModal();
    expect(await addRecipePage.isConfirmAIModificationModalVisible()).toBe(true);

    const modalTitle = await addRecipePage.getConfirmAIModificationModalTitle();
    expect(modalTitle).toContain("Wymagane preferencje żywieniowe");

    // === STEP 5: Go to preferences from modal ===
    console.log("Step 5: Going to preferences from modal");
    await addRecipePage.goToPreferencesFromModal();

    // Wait for preferences page to load
    const preferencesPage = new PreferencesPage(page);
    await preferencesPage.waitForFormToLoad();

    // === STEP 6: Fill and save preferences ===
    console.log("Step 6: Filling and saving preferences");
    await preferencesPage.fillFormWithRandomData();
    const preferencesResult = await preferencesPage.submitAndWaitForResult();

    // Assert - Verify preferences saved successfully
    expect(preferencesResult).toBe("success");
    expect(await preferencesPage.isSuccessAlertVisible()).toBe(true);

    // === STEP 7: Return to Add Recipe and try AI modification again ===
    console.log("Step 7: Returning to Add Recipe");
    await navigationPage.navigateToAddRecipe();
    await addRecipePage.waitForPageToLoad();

    // Fill form again
    await addRecipePage.fillFormWithValidData(recipeName, recipeRating);

    // === STEP 8: AI modification should now work ===
    console.log("Step 8: AI modification with preferences set");
    const aiResult = await addRecipePage.submitWithAIAndApprove(recipeName, recipeRating);

    // Assert - Verify AI modification succeeded
    expect(aiResult).toBe("success");
    expect(await addRecipePage.isSuccessAlertVisible()).toBe(true);

    console.log("✅ AI Modification with Preferences Flow completed successfully!");
  });
});
