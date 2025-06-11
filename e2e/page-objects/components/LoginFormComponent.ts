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
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.click();
    await this.passwordInput.fill(password);
  }

  async fillForm(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    // Poczekaj aż formularz będzie w pełni załadowany
    await this.page.waitForTimeout(1000);

    // Upewnij się, że pola są dostępne i gotowe
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // Wypełnij formularz z kliknięciem
    await this.fillForm(email, password);

    // Sprawdź czy pola są wypełnione
    await this.page.waitForFunction(
      ({ emailSelector, passwordSelector, expectedEmail, expectedPassword }) => {
        const emailEl = document.querySelector(`[data-testid="${emailSelector}"]`) as HTMLInputElement;
        const passwordEl = document.querySelector(`[data-testid="${passwordSelector}"]`) as HTMLInputElement;
        return emailEl?.value === expectedEmail && passwordEl?.value === expectedPassword;
      },
      {
        emailSelector: "login-email-input",
        passwordSelector: "login-password-input",
        expectedEmail: email,
        expectedPassword: password,
      },
      { timeout: 5000 }
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
