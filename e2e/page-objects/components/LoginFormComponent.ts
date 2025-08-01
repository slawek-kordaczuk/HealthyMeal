import type { Locator, Page } from "@playwright/test";

export class LoginFormComponent {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Form container
  get container(): Locator {
    return this.page.getByTestId("login-form");
  }

  // Input fields
  get emailInput(): Locator {
    return this.page.getByTestId("login-email-input");
  }

  get passwordInput(): Locator {
    return this.page.getByTestId("login-password-input");
  }

  // Submit button
  get submitButton(): Locator {
    return this.page.getByTestId("login-submit-button");
  }

  // Error elements
  get errorAlert(): Locator {
    return this.page.getByTestId("login-error-alert");
  }

  get errorMessage(): Locator {
    return this.page.getByTestId("login-error-message");
  }

  // Navigation links
  get forgotPasswordLink(): Locator {
    return this.page.getByTestId("login-forgot-password-link");
  }

  get registerLink(): Locator {
    return this.page.getByTestId("login-register-link");
  }

  // Actions
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.click();
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await this.emailInput.blur();
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.click();
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
    await this.passwordInput.blur();
  }

  async fillForm(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(): Promise<void> {
    // Pobierz dane logowania z zmiennych środowiskowych
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("Missing E2E_USERNAME or E2E_PASSWORD environment variables");
    }

    // Poczekaj aż formularz będzie w pełni załadowany i React się zainicjalizuje
    await this.page.waitForTimeout(2000);

    // Upewnij się, że pola są dostępne i gotowe
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // Wypełnij email
    await this.emailInput.click();
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await this.emailInput.blur();

    // Wypełnij hasło
    await this.passwordInput.click();
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
    await this.passwordInput.blur();

    // Poczekaj chwilę na React state updates
    await this.page.waitForTimeout(500);

    await this.page.locator('[data-testid="login-email-input"]').waitFor({ state: "visible" });
    await this.page.locator('[data-testid="login-password-input"]').waitFor({ state: "visible" });

    // Sprawdź wartości pól
    const emailInput = this.page.getByTestId("login-email-input");
    const passwordInput = this.page.getByTestId("login-password-input");
    await emailInput.waitFor({ state: "visible", timeout: 10000 });
    await passwordInput.waitFor({ state: "visible", timeout: 10000 });

    const loginPromise = this.page.waitForResponse("/api/auth/login");
    await this.submit();

    const loginResponse = await loginPromise;
    if (loginResponse.status() !== 200) {
      const responseText = await loginResponse.text();
      throw new Error(`Login failed with status ${loginResponse.status()}: ${responseText}`);
    }
  }

  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  async clickRegisterLink(): Promise<void> {
    await this.registerLink.click();
  }

  // Validation methods
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible();
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  async getSubmitButtonText(): Promise<string> {
    return (await this.submitButton.textContent()) || "";
  }

  async waitForForm(): Promise<void> {
    await this.container.waitFor({ state: "visible" });
  }

  async waitForError(): Promise<void> {
    await this.errorAlert.waitFor({ state: "visible", timeout: 15000 });
  }

  // Form validation states
  async hasEmailError(): Promise<boolean> {
    return (await this.emailInput.getAttribute("aria-invalid")) === "true";
  }

  async hasPasswordError(): Promise<boolean> {
    return (await this.passwordInput.getAttribute("aria-invalid")) === "true";
  }
}
