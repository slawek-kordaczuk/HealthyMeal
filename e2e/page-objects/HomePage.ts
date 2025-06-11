import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { NavigationMenuComponent } from "./components/NavigationMenuComponent";

export class HomePage extends BasePage {
  readonly url = "/";
  readonly navigationComponent: NavigationMenuComponent;

  constructor(page: Page) {
    super(page);
    this.navigationComponent = new NavigationMenuComponent(page);
  }

  async navigateToHomePage(): Promise<void> {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // Page-specific elements
  get heroSection() {
    return this.page.locator('[data-testid="hero-section"]');
  }

  get featuresSection() {
    return this.page.locator('[data-testid="features-section"]');
  }

  get ctaSection() {
    return this.page.locator('[data-testid="cta-section"]');
  }

  // Navigation actions via component
  async navigateToLogin(): Promise<void> {
    await this.navigationComponent.clickLogin();
  }

  async navigateToRegister(): Promise<void> {
    await this.navigationComponent.clickRegister();
  }

  // State validation
  async isHomePageLoaded(): Promise<boolean> {
    return await this.mainContent.isVisible();
  }

  async isNavigationVisible(): Promise<boolean> {
    return await this.navigationComponent.isVisible();
  }

  async isInNonAuthenticatedState(): Promise<boolean> {
    return await this.navigationComponent.isNotAuthenticated();
  }

  async isInAuthenticatedState(): Promise<boolean> {
    return await this.navigationComponent.isAuthenticated();
  }

  // Page workflows
  async verifyHomePageForAnonymousUser(): Promise<boolean> {
    const isHomeLoaded = await this.isHomePageLoaded();
    const isNavVisible = await this.isNavigationVisible();
    const isNotAuth = await this.isInNonAuthenticatedState();

    return isHomeLoaded && isNavVisible && isNotAuth;
  }

  async verifyHomePageForAuthenticatedUser(): Promise<boolean> {
    const isHomeLoaded = await this.isHomePageLoaded();
    const isNavVisible = await this.isNavigationVisible();
    const isAuth = await this.isInAuthenticatedState();

    return isHomeLoaded && isNavVisible && isAuth;
  }
}
