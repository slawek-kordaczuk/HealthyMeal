import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
  async goto() {
    await super.goto("/");
    await this.waitForPageLoad();
  }

  // Homepage specific elements
  get heroSection(): Locator {
    return this.page.locator('[data-testid="hero-section"]').or(this.page.locator("h1, h2, .hero, .welcome"));
  }

  get loginButton(): Locator {
    return this.page.locator('a[href="/login"], button:has-text("Zaloguj")');
  }

  get registerButton(): Locator {
    return this.page.locator('a[href="/register"], button:has-text("Zarejestruj")');
  }

  get featuresSection(): Locator {
    return this.page.locator('[data-testid="features"]').or(this.page.locator(".features, .benefits"));
  }

  // Actions
  async clickLogin() {
    await this.loginButton.click();
  }

  async clickRegister() {
    await this.registerButton.click();
  }

  async verifyPageElements() {
    await this.mainContent.waitFor();
    // Add more specific verifications based on actual homepage content
  }
}
