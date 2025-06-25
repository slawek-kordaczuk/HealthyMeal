import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class RecipesPage extends BasePage {
  // Navigation
  async navigateToRecipesPage() {
    await this.page.goto("/recipes");
  }

  // Wait for page to load
  async waitForPageToLoad() {
    await expect(this.page.getByTestId("recipes-page")).toBeVisible();
    await expect(this.page.getByTestId("recipes-title")).toHaveText("Moje przepisy");
  }

  // Wait for recipes to load properly
  async waitForRecipesToLoad() {
    // Wait for the container to be visible
    await expect(this.page.getByTestId("recipe-list-container")).toBeVisible();

    // Wait for either recipes table or empty state to appear
    await Promise.race([
      this.page.getByTestId("recipes-table").waitFor({ state: "visible", timeout: 10000 }),
      this.page.getByTestId("recipes-empty-state").waitFor({ state: "visible", timeout: 10000 }),
    ]);

    // If loading is still visible, wait for it to disappear
    const loadingContainer = this.page.getByTestId("recipes-loading-container");
    if (await loadingContainer.isVisible()) {
      await expect(loadingContainer).not.toBeVisible({ timeout: 10000 });
    }
  }

  // Search functionality
  async searchForRecipe(recipeName: string) {
    await this.page.getByTestId("recipe-search-input").fill(recipeName);
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
    const remainingRows = this.page.locator('[data-testid*="recipe-row-"]');
    const remainingCount = await remainingRows.count();

    if (remainingCount === 0) {
      await expect(this.page.getByTestId("recipes-empty-state")).toBeVisible();
      await expect(this.page.getByTestId("recipes-empty-message")).toHaveText("Nie znaleziono przepisów.");
    } else {
      // If there are still recipes, make sure our deleted recipe is not among them
      for (let i = 0; i < remainingCount; i++) {
        const row = remainingRows.nth(i);
        const recipeId = await row.getAttribute("data-testid");
        const extractedId = recipeId?.replace("recipe-row-", "") || "";
        const nameElement = this.page.getByTestId(`recipe-name-${extractedId}`);
        const nameText = await nameElement.textContent();
        expect(nameText).not.toContain(recipeName);
      }
    }
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
