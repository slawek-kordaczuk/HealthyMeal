import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { NavigationMenuComponent } from "./components/NavigationMenuComponent";

export class NavigationPage extends BasePage {
  readonly navigationComponent: NavigationMenuComponent;

  constructor(page: Page) {
    super(page);
    this.navigationComponent = new NavigationMenuComponent(page);
  }

  // Delegate all navigation actions to the component
  async clickLogin(): Promise<void> {
    await this.navigationComponent.clickLogin();
  }

  async clickRegister(): Promise<void> {
    await this.navigationComponent.clickRegister();
  }

  async clickLogout(): Promise<void> {
    await this.navigationComponent.clickLogout();
  }

  async clickLogo(): Promise<void> {
    await this.navigationComponent.clickLogo();
  }

  // Navigation methods for authenticated users
  async navigateToRecipes(): Promise<void> {
    await this.navigationComponent.navigateToRecipes();
  }

  async navigateToAddRecipe(): Promise<void> {
    await this.navigationComponent.navigateToAddRecipe();
  }

  async navigateToPreferences(): Promise<void> {
    await this.navigationComponent.navigateToPreferences();
  }

  // State validation methods - delegate to component
  async isNavigationVisible(): Promise<boolean> {
    return await this.navigationComponent.isVisible();
  }

  async isNavigationLoading(): Promise<boolean> {
    return await this.navigationComponent.isLoading();
  }

  async isAuthenticated(): Promise<boolean> {
    return await this.navigationComponent.isAuthenticated();
  }

  async isNotAuthenticated(): Promise<boolean> {
    return await this.navigationComponent.isNotAuthenticated();
  }

  async getUserEmail(): Promise<string> {
    return await this.navigationComponent.getUserEmail();
  }

  async isLogoutButtonVisible(): Promise<boolean> {
    return await this.navigationComponent.isLogoutButtonVisible();
  }

  async isLoginButtonVisible(): Promise<boolean> {
    return await this.navigationComponent.isLoginButtonVisible();
  }

  async isRegisterButtonVisible(): Promise<boolean> {
    return await this.navigationComponent.isRegisterButtonVisible();
  }

  // Wait for authentication states - delegate to component
  async waitForAuthenticatedState(): Promise<void> {
    await this.navigationComponent.waitForAuthenticatedState();
  }

  async waitForNonAuthenticatedState(): Promise<void> {
    await this.navigationComponent.waitForNonAuthenticatedState();
  }

  async waitForLoading(): Promise<void> {
    await this.navigationComponent.waitForLoading();
  }

  async waitForLoadingToDisappear(): Promise<void> {
    await this.navigationComponent.waitForLoadingToDisappear();
  }

  // Page-level convenience methods that combine component functionality
  async verifyFullAuthenticatedState(expectedEmail?: string): Promise<boolean> {
    const isAuthLayout = await this.navigationComponent.verifyAuthenticatedLayout();

    if (expectedEmail) {
      const userEmail = await this.getUserEmail();
      return isAuthLayout && userEmail.includes(expectedEmail);
    }

    return isAuthLayout;
  }

  async verifyFullNonAuthenticatedState(): Promise<boolean> {
    return await this.navigationComponent.verifyNonAuthenticatedLayout();
  }

  // Navigation workflow methods
  async performLogout(): Promise<void> {
    await this.clickLogout();
    await this.waitForNonAuthenticatedState();
  }

  async navigateToLoginFromNavigation(): Promise<void> {
    await this.clickLogin();
    // Note: This will navigate away from current page
  }

  async navigateToRegisterFromNavigation(): Promise<void> {
    await this.clickRegister();
    // Note: This will navigate away from current page
  }

  async navigateToHomeFromLogo(): Promise<void> {
    await this.clickLogo();
    // Note: This will navigate to home page
  }

  // Access to specific navigation links for testing
  get healthyMealLink() {
    return this.navigationComponent.healthyMealLink;
  }

  get mojePrepisyLink() {
    return this.navigationComponent.mojePrepisyLink;
  }

  get dodajPrepisLink() {
    return this.navigationComponent.dodajPrepisLink;
  }

  get preferencjeLink() {
    return this.navigationComponent.preferencjeLink;
  }
}
