import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { NavigationPage } from "./page-objects/NavigationPage";

test.describe("Authentication Flow - Page Object Model", () => {
  test("should login and logout successfully", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const navigationPage = new NavigationPage(page);

    // Zaloguj się
    await loginPage.navigateToLoginPage();
    await loginPage.login();

    // Sprawdź czy logowanie się udało
    await navigationPage.waitForAuthenticatedState();
    expect(await navigationPage.isAuthenticated()).toBe(true);

    // Wyloguj się
    await navigationPage.clickLogout();

    // Sprawdź czy wylogowanie się udało
    await navigationPage.waitForNonAuthenticatedState();
    expect(await navigationPage.isNotAuthenticated()).toBe(true);
  });
});
