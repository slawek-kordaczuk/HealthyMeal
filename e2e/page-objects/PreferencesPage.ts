import { BasePage } from "./BasePage";

export class PreferencesPage extends BasePage {
  readonly url = "/preferences";

  // Page navigation
  async navigateToPreferencesPage(): Promise<void> {
    await this.goto(this.url);
    await this.waitForPageLoad();
    await this.waitForFormToLoad();
  }

  // Page elements
  get pageContainer() {
    return this.page.getByTestId("preferences-page");
  }

  get container() {
    return this.page.getByTestId("preferences-container");
  }

  get title() {
    return this.page.getByTestId("preferences-title");
  }

  get description() {
    return this.page.getByTestId("preferences-description");
  }

  // Form container and elements
  get formContainer() {
    return this.page.getByTestId("preferences-form-container");
  }

  get form() {
    return this.page.getByTestId("preferences-form");
  }

  // Alert elements
  get sessionExpiredAlert() {
    return this.page.getByTestId("preferences-session-expired-alert");
  }

  get errorAlert() {
    return this.page.getByTestId("preferences-error-alert");
  }

  get errorMessage() {
    return this.page.getByTestId("preferences-error-message");
  }

  get successAlert() {
    return this.page.getByTestId("preferences-success-alert");
  }

  get successMessage() {
    return this.page.getByTestId("preferences-success-message");
  }

  // Form field inputs
  get dietTypeInput() {
    return this.page.getByTestId("preferences-diet-type-input");
  }

  get calorieRequirementInput() {
    return this.page.getByTestId("preferences-calorie-requirement-input");
  }

  get allergiesInput() {
    return this.page.getByTestId("preferences-allergies-input");
  }

  get foodIntolerancesInput() {
    return this.page.getByTestId("preferences-food-intolerances-input");
  }

  get preferredCuisinesInput() {
    return this.page.getByTestId("preferences-preferred-cuisines-input");
  }

  get excludedIngredientsInput() {
    return this.page.getByTestId("preferences-excluded-ingredients-input");
  }

  get proteinInput() {
    return this.page.getByTestId("preferences-protein-input");
  }

  get fatsInput() {
    return this.page.getByTestId("preferences-fats-input");
  }

  get carbohydratesInput() {
    return this.page.getByTestId("preferences-carbohydrates-input");
  }

  get submitButton() {
    return this.page.getByTestId("preferences-submit-button");
  }

  // Form field containers and labels
  get dietTypeField() {
    return this.page.getByTestId("preferences-diet-type-field");
  }

  get calorieRequirementField() {
    return this.page.getByTestId("preferences-calorie-requirement-field");
  }

  get allergiesField() {
    return this.page.getByTestId("preferences-allergies-field");
  }

  get foodIntolerancesField() {
    return this.page.getByTestId("preferences-food-intolerances-field");
  }

  get preferredCuisinesField() {
    return this.page.getByTestId("preferences-preferred-cuisines-field");
  }

  get excludedIngredientsField() {
    return this.page.getByTestId("preferences-excluded-ingredients-field");
  }

  get macroDistributionSection() {
    return this.page.getByTestId("preferences-macro-distribution-section");
  }

  get proteinField() {
    return this.page.getByTestId("preferences-protein-field");
  }

  get fatsField() {
    return this.page.getByTestId("preferences-fats-field");
  }

  get carbohydratesField() {
    return this.page.getByTestId("preferences-carbohydrates-field");
  }

  // Form actions
  async fillDietType(value: string): Promise<void> {
    await this.dietTypeInput.click();
    await this.dietTypeInput.clear();
    await this.dietTypeInput.fill(value);
  }

  async fillCalorieRequirement(value: number): Promise<void> {
    await this.calorieRequirementInput.click();
    await this.calorieRequirementInput.clear();
    await this.calorieRequirementInput.fill(value.toString());
  }

  async fillAllergies(value: string): Promise<void> {
    await this.allergiesInput.click();
    await this.allergiesInput.clear();
    await this.allergiesInput.fill(value);
  }

  async fillFoodIntolerances(value: string): Promise<void> {
    await this.foodIntolerancesInput.click();
    await this.foodIntolerancesInput.clear();
    await this.foodIntolerancesInput.fill(value);
  }

  async fillPreferredCuisines(value: string): Promise<void> {
    await this.preferredCuisinesInput.click();
    await this.preferredCuisinesInput.clear();
    await this.preferredCuisinesInput.fill(value);
  }

  async fillExcludedIngredients(value: string): Promise<void> {
    await this.excludedIngredientsInput.click();
    await this.excludedIngredientsInput.clear();
    await this.excludedIngredientsInput.fill(value);
  }

  async fillProtein(value: number): Promise<void> {
    await this.proteinInput.click();
    await this.proteinInput.clear();
    await this.proteinInput.fill(value.toString());
  }

  async fillFats(value: number): Promise<void> {
    await this.fatsInput.click();
    await this.fatsInput.clear();
    await this.fatsInput.fill(value.toString());
  }

  async fillCarbohydrates(value: number): Promise<void> {
    await this.carbohydratesInput.click();
    await this.carbohydratesInput.clear();
    await this.carbohydratesInput.fill(value.toString());
  }

  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }

  // Complete form filling with random valid data
  async fillFormWithRandomData(): Promise<void> {
    // Fill basic preferences
    await this.fillDietType("wegetariańska");
    await this.fillCalorieRequirement(2000);
    await this.fillAllergies("orzechy, skorupiaki");
    await this.fillFoodIntolerances("laktoza");
    await this.fillPreferredCuisines("włoska, śródziemnomorska");
    await this.fillExcludedIngredients("mięso czerwone");

    // Fill macronutrients that sum to 100%
    await this.fillProtein(30);
    await this.fillFats(30);
    await this.fillCarbohydrates(40);
  }

  // Complete form filling with valid data that sums to 100%
  async fillFormWithValidMacros(protein: number, fats: number, carbohydrates: number): Promise<void> {
    // Validate that macros sum to 100
    if (protein + fats + carbohydrates !== 100) {
      throw new Error(`Macros must sum to 100%, got: ${protein + fats + carbohydrates}%`);
    }

    await this.fillDietType("keto");
    await this.fillCalorieRequirement(1800);
    await this.fillAllergies("jaja, mleko");
    await this.fillFoodIntolerances("gluten");
    await this.fillPreferredCuisines("azjatycka, meksykańska");
    await this.fillExcludedIngredients("cukier biały, olej palmowy");

    await this.fillProtein(protein);
    await this.fillFats(fats);
    await this.fillCarbohydrates(carbohydrates);
  }

  // Validation methods
  async isFormVisible(): Promise<boolean> {
    return await this.form.isVisible();
  }

  async isSuccessAlertVisible(): Promise<boolean> {
    return await this.successAlert.isVisible();
  }

  async isErrorAlertVisible(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  async getSuccessMessage(): Promise<string> {
    return (await this.successMessage.textContent()) || "";
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  async getSubmitButtonText(): Promise<string> {
    return (await this.submitButton.textContent()) || "";
  }

  // Wait methods
  async waitForFormToLoad(): Promise<void> {
    await this.formContainer.waitFor({ state: "visible" });
    await this.form.waitFor({ state: "visible" });
    await this.submitButton.waitFor({ state: "visible" });
  }

  async waitForSuccess(): Promise<void> {
    await this.successAlert.waitFor({ state: "visible", timeout: 30000 });
  }

  async waitForError(): Promise<void> {
    await this.errorAlert.waitFor({ state: "visible", timeout: 30000 });
  }

  // Complete workflow methods
  async fillAndSubmitForm(): Promise<void> {
    await this.fillFormWithRandomData();

    // Wait for form to be ready
    await this.page.waitForTimeout(500);

    // Wait for API response after submitting
    const responsePromise = this.page.waitForResponse("/api/preferences");
    await this.submitForm();

    // Wait for response
    await responsePromise;
  }

  async submitAndWaitForResult(): Promise<"success" | "error"> {
    const responsePromise = this.page.waitForResponse("/api/preferences");
    await this.submitForm();

    const response = await responsePromise;

    await this.page.waitForLoadState("networkidle");

    if (response.status() === 200) {
      await this.waitForSuccess();
      return "success";
    } else {
      await this.waitForError();
      return "error";
    }
  }

  // Verification methods
  async verifyPreferencesPageLoaded(): Promise<boolean> {
    const isTitleVisible = await this.title.isVisible();
    const isFormVisible = await this.isFormVisible();
    const isSubmitButtonVisible = await this.submitButton.isVisible();

    return isTitleVisible && isFormVisible && isSubmitButtonVisible;
  }
}
