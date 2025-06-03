import type { Page, Locator } from "@playwright/test";

export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path = "") {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState("domcontentloaded");
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async takeScreenshot(name: string) {
    return await this.page.screenshot({ path: `e2e/screenshots/${name}.png` });
  }

  // Common elements that appear on multiple pages
  get navigationMenu(): Locator {
    return this.page.locator('[data-slot="navigation-menu"]');
  }

  get mainContent(): Locator {
    return this.page.locator("main");
  }

  // Navigation helpers
  async navigateToHome() {
    await this.page.click('a[href="/"]');
  }

  async navigateToRecipes() {
    await this.page.click('a[href="/recipes"]');
  }

  async navigateToAddRecipe() {
    await this.page.click('a[href="/add-recipe"]');
  }

  async navigateToPreferences() {
    await this.page.click('a[href="/preferences"]');
  }
}
