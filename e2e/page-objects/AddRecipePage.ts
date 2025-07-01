import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class AddRecipePage extends BasePage {
  // Navigation
  async navigateToAddRecipePage() {
    await this.page.goto("/add-recipe");
  }

  // Page verification
  async waitForPageToLoad() {
    await expect(this.page.getByTestId("add-recipe-title")).toBeVisible();
    await expect(this.page.getByTestId("recipe-form-container")).toBeVisible();
  }

  async verifyPageLoaded(): Promise<boolean> {
    try {
      await this.waitForPageToLoad();
      return true;
    } catch {
      return false;
    }
  }

  // Form fields
  async fillRecipeName(name: string) {
    await this.page.getByTestId("recipe-name-input").fill(name);
  }

  async fillRecipeRating(rating: number) {
    await this.page.getByTestId("recipe-rating-input").fill(rating.toString());
  }

  async fillRecipeContent(content: string) {
    await this.page.getByTestId("recipe-content-input").fill(content);
  }

  // Form actions
  async submitRecipe() {
    await this.page.getByTestId("recipe-save-button").click();
  }

  async submitRecipeWithAI() {
    await this.page.getByTestId("recipe-save-with-ai-button").click();
  }

  // Form validation
  async getNameError(): Promise<string> {
    const errorElement = this.page.getByTestId("recipe-name-error");
    return (await errorElement.textContent()) || "";
  }

  async getRatingError(): Promise<string> {
    const errorElement = this.page.getByTestId("recipe-rating-error");
    return (await errorElement.textContent()) || "";
  }

  async getContentError(): Promise<string> {
    const errorElement = this.page.getByTestId("recipe-content-error");
    return (await errorElement.textContent()) || "";
  }

  // Success/Error states
  async isSuccessAlertVisible(): Promise<boolean> {
    try {
      await expect(this.page.getByTestId("recipe-form-success-alert")).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async isErrorAlertVisible(): Promise<boolean> {
    try {
      await expect(this.page.getByTestId("recipe-form-error-alert")).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getSuccessMessage(): Promise<string> {
    const messageElement = this.page.getByTestId("recipe-form-success-message");
    return (await messageElement.textContent()) || "";
  }

  async getErrorMessage(): Promise<string> {
    const messageElement = this.page.getByTestId("recipe-form-error-message");
    return (await messageElement.textContent()) || "";
  }

  // Form state checks
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.page.getByTestId("recipe-save-button").isDisabled();
  }

  async isSubmitWithAIButtonDisabled(): Promise<boolean> {
    return await this.page.getByTestId("recipe-save-with-ai-button").isDisabled();
  }

  async getSubmitButtonText(): Promise<string> {
    return (await this.page.getByTestId("recipe-save-button").textContent()) || "";
  }

  async getSubmitWithAIButtonText(): Promise<string> {
    return (await this.page.getByTestId("recipe-save-with-ai-button").textContent()) || "";
  }

  // Complex interactions
  async fillFormWithValidData(recipeName: string, rating?: number, content?: string) {
    const defaultContent =
      content ||
      `
      Składniki:
      - 200g mąki pszennej
      - 2 jajka
      - 250ml mleka
      - 2 łyżki oleju
      - 1 łyżeczka soli
      - 1 łyżeczka cukru
      
      Przygotowanie:
      1. Wymieszaj mąkę z solą i cukrem w misce
      2. Dodaj jajka i mleko, wymieszaj na gładkie ciasto
      3. Dodaj olej i ponownie wymieszaj
      4. Rozgrzej patelnię i smaż naleśniki z obu stron
      5. Podawaj ciepłe z ulubionymi dodatkami
    `.trim();

    await this.fillRecipeName(recipeName);
    if (rating !== undefined) {
      await this.fillRecipeRating(rating);
    }
    await this.fillRecipeContent(defaultContent);
  }

  async submitAndWaitForResult(): Promise<"success" | "error"> {
    // Monitor network requests
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/recipes/create") && response.request().method() === "POST"
    );

    await this.submitRecipe();

    try {
      const response = await responsePromise;

      if (response.ok()) {
        // Wait for success alert
        await this.page.waitForSelector('[data-testid="recipe-form-success-alert"]', { timeout: 5000 });
        return "success";
      } else {
        // Wait for error alert
        await this.page.waitForSelector('[data-testid="recipe-form-error-alert"]', { timeout: 5000 });
        return "error";
      }
    } catch {
      // Check if any alert is visible at all
      const successAlert = await this.page.locator('[data-testid="recipe-form-success-alert"]').isVisible();
      const errorAlert = await this.page.locator('[data-testid="recipe-form-error-alert"]').isVisible();

      if (successAlert) return "success";
      if (errorAlert) return "error";

      return "error";
    }
  }
}
