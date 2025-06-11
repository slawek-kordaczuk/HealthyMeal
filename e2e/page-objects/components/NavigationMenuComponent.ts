import type { Locator, Page } from "@playwright/test";

export class NavigationMenuComponent {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Main container
  get container(): Locator {
    return this.page.getByTestId("navigation-container");
  }

  get loadingContainer(): Locator {
    return this.page.getByTestId("navigation-loading");
  }

  // Logo
  get logoLink(): Locator {
    return this.page.getByTestId("nav-logo-link");
  }

  get logoLinkLoading(): Locator {
    return this.page.getByTestId("nav-logo-link-loading");
  }

  // Non-authenticated state elements
  get authButtonsContainer(): Locator {
    return this.page.getByTestId("nav-auth-buttons");
  }

  get loginButton(): Locator {
    return this.page.getByTestId("nav-login-button");
  }

  get registerButton(): Locator {
    return this.page.getByTestId("nav-register-button");
  }

  get mobileMenuButton(): Locator {
    return this.page.getByTestId("nav-mobile-menu-button");
  }

  // Authenticated state elements
  get authenticatedLinksContainer(): Locator {
    return this.page.getByTestId("nav-authenticated-links");
  }

  get userActionsContainer(): Locator {
    return this.page.getByTestId("nav-user-actions");
  }

  get userEmailDisplay(): Locator {
    return this.page.getByTestId("nav-user-email");
  }

  get logoutButton(): Locator {
    return this.page.getByTestId("nav-logout-button");
  }

  get mobileMenuButtonAuthenticated(): Locator {
    return this.page.getByTestId("nav-mobile-menu-button-authenticated");
  }

  // Navigation links for authenticated users
  get healthyMealLink(): Locator {
    return this.page.getByTestId("nav-link-healthymeal");
  }

  get mojePrepisyLink(): Locator {
    return this.page.getByTestId("nav-link-moje-przepisy");
  }

  get dodajPrepisLink(): Locator {
    return this.page.getByTestId("nav-link-dodaj-przepis");
  }

  get preferencjeLink(): Locator {
    return this.page.getByTestId("nav-link-preferencje");
  }

  // Actions for non-authenticated users
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  async clickRegister(): Promise<void> {
    await this.registerButton.click();
  }

  async clickMobileMenu(): Promise<void> {
    await this.mobileMenuButton.click();
  }

  // Actions for authenticated users
  async clickLogout(): Promise<void> {
    await this.logoutButton.click();
  }

  async clickLogo(): Promise<void> {
    await this.logoLink.click();
  }

  async navigateToRecipes(): Promise<void> {
    await this.mojePrepisyLink.click();
  }

  async navigateToAddRecipe(): Promise<void> {
    await this.dodajPrepisLink.click();
  }

  async navigateToPreferences(): Promise<void> {
    await this.preferencjeLink.click();
  }

  async clickMobileMenuAuthenticated(): Promise<void> {
    await this.mobileMenuButtonAuthenticated.click();
  }

  // State validation methods
  async isVisible(): Promise<boolean> {
    return await this.container.isVisible();
  }

  async isLoading(): Promise<boolean> {
    return await this.loadingContainer.isVisible();
  }

  async isAuthenticated(): Promise<boolean> {
    return await this.authenticatedLinksContainer.isVisible();
  }

  async isNotAuthenticated(): Promise<boolean> {
    return await this.authButtonsContainer.isVisible();
  }

  async getUserEmail(): Promise<string> {
    if (await this.userEmailDisplay.isVisible()) {
      return (await this.userEmailDisplay.textContent()) || "";
    }
    return "";
  }

  // Button visibility checks
  async isLogoutButtonVisible(): Promise<boolean> {
    return await this.logoutButton.isVisible();
  }

  async isLoginButtonVisible(): Promise<boolean> {
    return await this.loginButton.isVisible();
  }

  async isRegisterButtonVisible(): Promise<boolean> {
    return await this.registerButton.isVisible();
  }

  // Navigation links visibility checks
  async isHealthyMealLinkVisible(): Promise<boolean> {
    return await this.healthyMealLink.isVisible();
  }

  async isMojePrepisyLinkVisible(): Promise<boolean> {
    return await this.mojePrepisyLink.isVisible();
  }

  async isDodajPrepisLinkVisible(): Promise<boolean> {
    return await this.dodajPrepisLink.isVisible();
  }

  async isPreferencjeLinkVisible(): Promise<boolean> {
    return await this.preferencjeLink.isVisible();
  }

  // Wait for specific states
  async waitForAuthenticatedState(): Promise<void> {
    await this.authenticatedLinksContainer.waitFor({ state: "visible", timeout: 15000 });
    await this.logoutButton.waitFor({ state: "visible", timeout: 15000 });
  }

  async waitForNonAuthenticatedState(): Promise<void> {
    await this.authButtonsContainer.waitFor({ state: "visible", timeout: 15000 });
    await this.loginButton.waitFor({ state: "visible", timeout: 15000 });
    await this.registerButton.waitFor({ state: "visible", timeout: 15000 });
  }

  async waitForLoading(): Promise<void> {
    await this.loadingContainer.waitFor({ state: "visible" });
  }

  async waitForLoadingToDisappear(): Promise<void> {
    await this.loadingContainer.waitFor({ state: "hidden" });
  }

  // Comprehensive state verification
  async verifyAuthenticatedLayout(): Promise<boolean> {
    const isAuth = await this.isAuthenticated();
    const hasLogout = await this.isLogoutButtonVisible();
    const hasHealthyMealLink = await this.isHealthyMealLinkVisible();

    return isAuth && hasLogout && hasHealthyMealLink;
  }

  async verifyNonAuthenticatedLayout(): Promise<boolean> {
    const isNotAuth = await this.isNotAuthenticated();
    const hasLogin = await this.isLoginButtonVisible();
    const hasRegister = await this.isRegisterButtonVisible();

    return isNotAuth && hasLogin && hasRegister;
  }
}
