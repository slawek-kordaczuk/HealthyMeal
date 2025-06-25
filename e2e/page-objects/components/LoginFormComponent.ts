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

  async login(email: string, password: string): Promise<void> {
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

    // Sprawdź czy pola są wypełnione z dłuższym timeout
    await this.page.waitForFunction(
      () => {
        const emailEl = document.querySelector('[data-testid="login-email-input"]') as HTMLInputElement;
        const passwordEl = document.querySelector('[data-testid="login-password-input"]') as HTMLInputElement;
        return emailEl?.value?.length > 0 && passwordEl?.value?.length > 0;
      },
      { timeout: 10000 }
    );

    // Czekaj na odpowiedź z API i wyślij formularz
    const loginPromise = this.page.waitForResponse("/api/auth/login");
    await this.submit();

    // Czekaj na odpowiedź
    await loginPromise;
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
