import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { NavigationPage } from "./page-objects/NavigationPage";
import { PreferencesPage } from "./page-objects/PreferencesPage";
import { AddRecipePage } from "./page-objects/AddRecipePage";
import { RecipesPage } from "./page-objects/RecipesPage";

test.describe("Full Recipe AI Modification Flow", () => {
  let recipeName: string;
  let recipeRating: number;
  let recipeContent: string;

  test.beforeEach(async () => {
    // Generate unique test data for each test run
    const timestamp = Date.now();
    recipeName = `Test AI Recipe ${timestamp}`;
    recipeRating = 8;
    recipeContent = `
      Składniki:
      - 500g mąki pszennej
      - 4 jajka
      - 400ml mleka
      - 3 łyżki masła
      - 1 łyżeczka soli
      - 2 łyżki cukru
      - 1 łyżeczka proszku do pieczenia
      - 1 łyżeczka wanilii
      
      Przygotowanie:
      1. Wymieszaj wszystkie suche składniki w dużej misce
      2. W osobnej misce ubij jajka z mlekiem i wanilią
      3. Połącz mokre i suche składniki, mieszając powoli
      4. Dodaj roztopione masło i dokładnie wymieszaj
      5. Zostaw ciasto na 15 minut w temperaturze pokojowej
      6. Rozgrzej patelnię i smaż naleśniki na średnim ogniu
      7. Każdy naleśnik smaż około 2 minuty z każdej strony
      8. Podawaj ciepłe z ulubionymi dodatkami
      9. Możesz dodać owoce, dżem lub syrop klonowy
      10. Smacznego!
    `.trim();
  });

  test("should complete full recipe AI modification journey: login → preferences → create recipe → AI modification → save", async ({
    page,
  }) => {
    console.log("🚀 Starting Full Recipe AI Modification Flow");

    // === STEP 1: Login ===
    console.log("Step 1: Logging in with test user");
    const loginPage = new LoginPage(page);
    const navigationPage = new NavigationPage(page);

    await loginPage.navigateToLoginPage();
    await loginPage.login();
    await navigationPage.waitForAuthenticatedState();

    // === STEP 2: Wait for user to be authenticated and Preferencje button to appear ===
    console.log("Step 2: Waiting for authentication and Preferencje button");
    await expect(page.getByTestId("nav-authenticated-links")).toBeVisible();
    await expect(page.getByTestId("nav-link-preferencje")).toBeVisible();
    console.log("✅ User authenticated, Preferencje button visible");

    // === STEP 3: Navigate to Preferencje ===
    console.log("Step 3: Navigating to Preferencje");
    await navigationPage.navigateToPreferences();

    // === STEP 4: Fill preferences form with random valid values ===
    console.log("Step 4: Filling preferences form");
    const preferencesPage = new PreferencesPage(page);
    await preferencesPage.waitForFormToLoad();

    // Fill with random but valid data
    await preferencesPage.fillFormWithRandomData();
    console.log("✅ Preferences form filled successfully");

    // === STEP 5: Save preferences ===
    console.log("Step 5: Saving preferences");
    const preferencesResult = await preferencesPage.submitAndWaitForResult();

    // Verify preferences saved successfully
    expect(preferencesResult).toBe("success");
    expect(await preferencesPage.isSuccessAlertVisible()).toBe(true);
    console.log("✅ Preferences saved successfully");

    // === STEP 6: Navigate to "Dodaj Przepis" ===
    console.log("Step 6: Navigating to Dodaj Przepis");
    await navigationPage.navigateToAddRecipe();

    // === STEP 7: Fill recipe form ===
    console.log("Step 7: Filling recipe form");
    const addRecipePage = new AddRecipePage(page);
    await addRecipePage.waitForPageToLoad();

    // Fill recipe form with test data
    await addRecipePage.fillFormWithValidData(recipeName, recipeRating, recipeContent);
    console.log("✅ Recipe form filled successfully");

    // Save the recipe
    const createResult = await addRecipePage.submitAndWaitForResult();
    expect(createResult).toBe("success");

    // Verify recipe was saved
    expect(await addRecipePage.isSuccessAlertVisible()).toBe(true);
    console.log("✅ Recipe saved successfully");

    // === STEP 8: Navigate to "Moje Przepisy" ===
    console.log("Step 8: Navigating to Moje Przepisy");
    await navigationPage.navigateToRecipes();

    // === STEP 9: Check if saved recipe appears in list ===
    console.log("Step 9: Verifying recipe appears in list");
    const recipesPage = new RecipesPage(page);
    await recipesPage.waitForPageToLoad();
    await recipesPage.waitForRecipesToLoad();

    // Search for the created recipe
    await recipesPage.searchForRecipe(recipeName);

    // Find the recipe in the list
    const foundRecipeId = await recipesPage.findRecipeByName(recipeName);
    expect(foundRecipeId).not.toBeNull();
    console.log(`✅ Recipe found with ID: ${foundRecipeId}`);

    // === STEP 10: Modify recipe using AI ===
    console.log("Step 10: Starting AI modification process");

    // Click edit button for the recipe
    if (!foundRecipeId) {
      throw new Error("Recipe ID not found");
    }
    await recipesPage.clickEditRecipe(foundRecipeId);

    // Wait for edit modal to open
    console.log("⏳ Waiting for edit modal to appear...");
    await expect(page.getByTestId("edit-recipe-modal")).toBeVisible();
    await expect(page.getByTestId("edit-recipe-modal-title")).toContainText(recipeName);
    console.log("✅ Edit modal opened successfully");

    // Wait a bit for modal to fully load
    await page.waitForTimeout(1000);

    // Check if AI tab is visible and clickable
    const aiTab = page.getByTestId("edit-recipe-modal-ai-tab");
    await expect(aiTab).toBeVisible();
    await expect(aiTab).toBeEnabled();
    console.log("✅ AI tab is visible and enabled");

    // Click on "Modyfikacja AI" tab
    console.log("🔄 Clicking on Modyfikacja AI tab...");
    await aiTab.click();

    // Wait for tab change
    await page.waitForTimeout(500);

    // Wait for AI modification panel to load
    console.log("⏳ Waiting for AI modification panel...");
    await expect(page.getByTestId("ai-modification-panel")).toBeVisible({ timeout: 10000 });
    console.log("✅ AI modification panel visible");

    await expect(page.getByTestId("ai-modification-original-section")).toBeVisible();
    console.log("✅ Original section visible");

    // Click "Generuj modyfikację AI" button
    await page.getByTestId("ai-modification-generate-button").click();

    // === STEP 11: Wait for AI modified recipe to appear ===
    console.log("Step 11: Waiting for AI modification to complete");

    // Wait for loading state
    await expect(page.getByTestId("ai-modification-loading")).toBeVisible();
    await expect(page.getByTestId("ai-modification-loading-text")).toContainText("Generowanie modyfikacji AI");

    // Wait for AI suggestion to appear (with longer timeout for AI processing)
    await expect(page.getByTestId("ai-modification-suggestion-section")).toBeVisible({ timeout: 60000 });
    await expect(page.getByTestId("ai-modification-suggestion-content")).toBeVisible();

    // Verify AI suggestion has content
    const aiSuggestionContent = await page.getByTestId("ai-modification-suggestion-content").textContent();
    expect(aiSuggestionContent).toBeTruthy();
    if (aiSuggestionContent) {
      expect(aiSuggestionContent.length).toBeGreaterThan(50); // Ensure meaningful content
    }
    console.log("✅ AI modification generated successfully");

    // === STEP 12: Save the modified recipe ===
    console.log("Step 12: Approving and saving AI modification");

    // Click "Zatwierdź" button to approve AI changes
    await page.getByTestId("ai-modification-approve-button").click();

    // Wait for the modal to close (indicating successful save)
    await expect(page.getByTestId("edit-recipe-modal")).not.toBeVisible({ timeout: 10000 });

    // Verify we're back on the recipes page
    await expect(page.getByTestId("recipes-page")).toBeVisible();

    // Verify the recipe still exists in the list (it should be updated)
    await recipesPage.waitForRecipesToLoad();
    const updatedRecipeId = await recipesPage.findRecipeByName(recipeName);
    expect(updatedRecipeId).not.toBeNull();
    console.log("✅ AI modified recipe saved successfully");

    // === VERIFICATION: Check that recipe was actually modified ===
    console.log("Step 13: Verifying recipe was modified by AI");

    // Open the recipe again to verify it contains AI modifications
    if (!updatedRecipeId) {
      throw new Error("Updated recipe ID not found");
    }
    await recipesPage.clickEditRecipe(updatedRecipeId);
    await expect(page.getByTestId("edit-recipe-modal")).toBeVisible();

    // Check that the recipe content has been updated
    const currentContent = await page.getByTestId("manual-edit-content-input").inputValue();
    expect(currentContent).toBeTruthy();
    expect(currentContent.length).toBeGreaterThan(0);
    // The content should be different from original (AI modified)
    expect(currentContent).not.toBe(recipeContent);
    console.log("✅ Recipe content verified as modified by AI");

    // Close the modal
    await page.getByTestId("manual-edit-cancel-button").click();

    console.log("🎉 Full Recipe AI Modification Flow completed successfully!");
  });

  test.afterEach(async ({ page }) => {
    // Clean up: Delete the test recipe if it exists
    try {
      const navigationPage = new NavigationPage(page);
      const recipesPage = new RecipesPage(page);

      await navigationPage.navigateToRecipes();
      await recipesPage.waitForPageToLoad();
      await recipesPage.waitForRecipesToLoad();

      // Search for the recipe
      await recipesPage.searchForRecipe(recipeName);
      const recipeId = await recipesPage.findRecipeByName(recipeName);

      if (recipeId) {
        await recipesPage.clickDeleteRecipe(recipeId);
        await recipesPage.handleDeleteModal(recipeName);
        console.log(`🧹 Cleaned up test recipe: ${recipeName}`);
      }
    } catch (error) {
      console.log(`⚠️ Cleanup failed for recipe: ${recipeName}`, error);
    }
  });
});
