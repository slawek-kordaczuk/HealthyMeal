import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { LoginFormComponent } from "./components/LoginFormComponent";

export class LoginPage extends BasePage {
  // Page URL
  readonly url = "/login";
  readonly loginForm: LoginFormComponent;

  constructor(page: Page) {
    super(page);
    this.loginForm = new LoginFormComponent(page);
  }

  // Page navigation
  async navigateToLoginPage(): Promise<void> {
    await this.goto(this.url);
    await this.waitForPageLoad();
    await this.loginForm.waitForForm();
  }

  // Delegate form actions to the component
  async fillEmail(email: string): Promise<void> {
    await this.loginForm.fillEmail(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.loginForm.fillPassword(password);
  }

  async fillLoginForm(email: string, password: string): Promise<void> {
    await this.loginForm.fillForm(email, password);
  }

  async submitLogin(): Promise<void> {
    await this.loginForm.submit();
  }

  async login(): Promise<void> {
    await this.loginForm.login();
  }

  async clickForgotPassword(): Promise<void> {
    await this.loginForm.clickForgotPassword();
  }

  async clickRegisterLink(): Promise<void> {
    await this.loginForm.clickRegisterLink();
  }

  // Delegate validation methods to the component
  async isLoginFormVisible(): Promise<boolean> {
    return await this.loginForm.isVisible();
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.loginForm.isErrorVisible();
  }

  async getErrorMessage(): Promise<string> {
    return await this.loginForm.getErrorText();
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.loginForm.isSubmitButtonDisabled();
  }

  async getSubmitButtonText(): Promise<string> {
    return await this.loginForm.getSubmitButtonText();
  }

  // Additional page-level validation methods
  async waitForError(): Promise<void> {
    await this.loginForm.waitForError();
  }

  async hasValidationErrors(): Promise<boolean> {
    const hasEmailError = await this.loginForm.hasEmailError();
    const hasPasswordError = await this.loginForm.hasPasswordError();
    return hasEmailError || hasPasswordError;
  }

  // Page-specific actions that combine multiple components
  async attemptLoginAndWaitForResult(): Promise<"success" | "error"> {
    await this.login();

    // Wait for either navigation (success) or error message
    try {
      await this.loginForm.waitForError();
      return "error";
    } catch {
      // If no error appears, assume success (navigation happened)
      return "success";
    }
  }
}
