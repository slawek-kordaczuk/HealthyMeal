import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class RecipesPage extends BasePage {
  // Navigation
  async navigateToRecipesPage() {
    await this.page.goto("/recipes");
  }

  // Wait for page to load
  async waitForPageToLoad() {
    await expect(this.page.getByTestId("recipe-list-container")).toBeVisible();
  }

  // Wait for recipes to load properly
  async waitForRecipesToLoad() {
    // Wait for either recipes to load or empty state to appear
    await Promise.race([
      this.page.getByTestId("recipes-empty-state").waitFor({ state: "visible", timeout: 15000 }),
      this.page.locator('[data-testid*="recipe-row-"]').first().waitFor({ state: "visible", timeout: 15000 }),
    ]);

    // Also wait for loading state to disappear if it was present
    const loadingContainer = this.page.getByTestId("recipes-loading-container");
    if (await loadingContainer.isVisible()) {
      await loadingContainer.waitFor({ state: "hidden", timeout: 10000 });
    }
  }

  // Wait for list to update after operations like deletion
  async waitForListUpdate(expectedCount?: number) {
    // Wait for loading to complete first
    await this.waitForRecipesToLoad();

    // If expected count is provided, wait for that specific count
    if (expectedCount !== undefined) {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const currentCount = await this.getRecipeCount();
        if (currentCount === expectedCount) {
          return;
        }
        await this.page.waitForTimeout(1000);
        attempts++;
      }

      throw new Error(
        `Expected ${expectedCount} recipes, but found ${await this.getRecipeCount()} after ${maxAttempts} attempts`
      );
    }
  }

  // Search functionality
  async searchForRecipe(recipeName: string) {
    // Wait for the search input to be visible and ready
    const searchInput = this.page.getByTestId("recipe-search-input");
    await searchInput.waitFor({ state: "visible", timeout: 15000 });
    await searchInput.fill(recipeName);
    // Wait for search to complete and results to update
    await this.page.waitForTimeout(2000);
  }

  async clearSearch() {
    await this.page.getByTestId("recipe-search-input").clear();
    await this.page.waitForTimeout(1000);
  }

  // Recipe finding and interaction
  async findRecipeByName(recipeName: string): Promise<string | null> {
    const recipeRows = this.page.locator('[data-testid*="recipe-row-"]');

    // Wait for search results to stabilize
    await expect(recipeRows.first()).toBeVisible({ timeout: 10000 });

    const rowCount = await recipeRows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = recipeRows.nth(i);
      const recipeId = await row.getAttribute("data-testid");
      const extractedId = recipeId?.replace("recipe-row-", "") || "";

      const nameElement = this.page.getByTestId(`recipe-name-${extractedId}`);
      const nameText = await nameElement.textContent();

      if (nameText?.includes(recipeName)) {
        return extractedId;
      }
    }

    return null;
  }

  async getFirstRecipeId(): Promise<string> {
    const recipeRows = this.page.locator('[data-testid*="recipe-row-"]');
    await expect(recipeRows.first()).toBeVisible();

    const firstRecipeRow = recipeRows.first();
    const recipeId = await firstRecipeRow.getAttribute("data-testid");
    return recipeId?.replace("recipe-row-", "") || "";
  }

  async getRecipeCount(): Promise<number> {
    const recipeRows = this.page.locator('[data-testid*="recipe-row-"]');
    return await recipeRows.count();
  }

  // Recipe actions
  async clickEditRecipe(recipeId: string) {
    const editButton = this.page.getByTestId(`recipe-edit-button-${recipeId}`);
    await expect(editButton).toBeVisible();
    await expect(editButton).toBeEnabled();
    await editButton.click();
  }

  async clickDeleteRecipe(recipeId: string) {
    const deleteButton = this.page.getByTestId(`recipe-delete-button-${recipeId}`);

    // Make sure button is visible and enabled
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();

    // Try clicking the button with fallback
    try {
      await deleteButton.click();
    } catch {
      await deleteButton.click({ force: true });
    }

    // Give React time to update state
    await this.page.waitForTimeout(1000);
  }

  // Recipe verification
  async verifyRecipeExists(recipeId: string, recipeName: string) {
    await expect(this.page.getByTestId(`recipe-row-${recipeId}`)).toBeVisible();
    await expect(this.page.getByTestId(`recipe-name-${recipeId}`)).toContainText(recipeName);
    await expect(this.page.getByTestId(`recipe-rating-${recipeId}`)).toBeVisible();
    await expect(this.page.getByTestId(`recipe-source-${recipeId}`)).toBeVisible();
    await expect(this.page.getByTestId(`recipe-date-${recipeId}`)).toBeVisible();
  }

  async verifyRecipeDoesNotExist(recipeId: string) {
    await expect(this.page.getByTestId(`recipe-row-${recipeId}`)).not.toBeVisible();
  }

  async verifyRecipeNotInList(recipeName: string) {
    // Wait for the UI to update after deletion with retries
    let attempt = 0;
    const maxAttempts = 5;
    const waitTime = 2000; // 2 seconds between attempts

    while (attempt < maxAttempts) {
      try {
        const remainingRows = this.page.locator('[data-testid*="recipe-row-"]');

        // Wait for the list to stabilize
        await this.page.waitForTimeout(waitTime);

        const remainingCount = await remainingRows.count();

        if (remainingCount === 0) {
          // Expect empty state
          await expect(this.page.getByTestId("recipes-empty-state")).toBeVisible({ timeout: 10000 });
          await expect(this.page.getByTestId("recipes-empty-message")).toHaveText("Nie znaleziono przepisów.");
          return; // Success - empty state reached
        } else {
          // Check if deleted recipe is not in the list
          let recipeFound = false;

          for (let i = 0; i < remainingCount; i++) {
            const row = remainingRows.nth(i);
            const recipeId = await row.getAttribute("data-testid");
            const extractedId = recipeId?.replace("recipe-row-", "") || "";
            const nameElement = this.page.getByTestId(`recipe-name-${extractedId}`);
            const nameText = await nameElement.textContent();

            if (nameText?.includes(recipeName)) {
              recipeFound = true;
              break;
            }
          }

          if (!recipeFound) {
            return; // Success - recipe not found in list
          }
        }

        // If we reach here, recipe is still in list, try again
        attempt++;

        if (attempt < maxAttempts) {
          console.log(`Recipe still in list, attempt ${attempt}/${maxAttempts}, waiting ${waitTime}ms...`);
          await this.page.waitForTimeout(waitTime);
        }
      } catch (error) {
        attempt++;
        if (attempt >= maxAttempts) {
          throw error;
        }
        console.log(`Error checking recipe list, attempt ${attempt}/${maxAttempts}, retrying...`);
        await this.page.waitForTimeout(waitTime);
      }
    }

    // If we get here, all attempts failed
    throw new Error(`Recipe "${recipeName}" is still visible in the list after ${maxAttempts} attempts`);
  }

  // Modal handling
  async handleDeleteModal(recipeName?: string) {
    // Wait for modal to appear and be visible
    await this.page.getByTestId("confirm-delete-modal").waitFor({ state: "visible", timeout: 10000 });

    // Verify modal content if recipe name provided
    if (recipeName) {
      await expect(this.page.getByTestId("confirm-delete-modal-title")).toHaveText("Potwierdź usunięcie przepisu");
      await expect(this.page.getByTestId("confirm-delete-recipe-name")).toContainText(recipeName);
    }

    // Click confirm button
    const confirmButton = this.page.getByTestId("confirm-delete-confirm-button");
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // Wait for modal to disappear
    await this.page.getByTestId("confirm-delete-modal").waitFor({ state: "detached", timeout: 10000 });

    // Wait for the deletion operation to complete by waiting for list update
    await this.waitForListUpdate();
  }

  async handleCancelModal() {
    // Wait for modal to be visible
    await this.page.getByTestId("confirm-delete-modal").waitFor({ state: "visible", timeout: 10000 });

    const cancelButton = this.page.getByTestId("confirm-delete-cancel-button");
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
    await cancelButton.click();

    await this.page.getByTestId("confirm-delete-modal").waitFor({ state: "detached", timeout: 10000 });
  }

  // Utility methods
  async isEmptyState(): Promise<boolean> {
    return await this.page.getByTestId("recipes-empty-state").isVisible();
  }

  async isLoadingState(): Promise<boolean> {
    return await this.page.getByTestId("recipes-loading-container").isVisible();
  }

  async isErrorState(): Promise<boolean> {
    return await this.page.getByTestId("recipes-error-container").isVisible();
  }

  async getErrorMessage(): Promise<string> {
    return (await this.page.getByTestId("recipes-error-message").textContent()) || "";
  }

  async clickRetryButton() {
    await this.page.getByTestId("recipes-retry-button").click();
  }

  // Pagination
  async hasNextPage(): Promise<boolean> {
    const nextButton = this.page.getByTestId("recipe-pagination-next");
    if (await nextButton.isVisible()) {
      const classes = await nextButton.getAttribute("class");
      return !classes?.includes("pointer-events-none");
    }
    return false;
  }

  async hasPreviousPage(): Promise<boolean> {
    const prevButton = this.page.getByTestId("recipe-pagination-previous");
    if (await prevButton.isVisible()) {
      const classes = await prevButton.getAttribute("class");
      return !classes?.includes("pointer-events-none");
    }
    return false;
  }

  async goToNextPage() {
    if (await this.hasNextPage()) {
      await this.page.getByTestId("recipe-pagination-next").click();
      await this.waitForRecipesToLoad();
    }
  }

  async goToPreviousPage() {
    if (await this.hasPreviousPage()) {
      await this.page.getByTestId("recipe-pagination-previous").click();
      await this.waitForRecipesToLoad();
    }
  }

  async goToPage(pageNumber: number) {
    await this.page.getByTestId(`recipe-pagination-page-${pageNumber}`).click();
    await this.waitForRecipesToLoad();
  }
}
