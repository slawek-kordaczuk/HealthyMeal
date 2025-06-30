import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { NavigationPage } from "./page-objects/NavigationPage";

test.describe("Authentication Flow - Component-Based POM", () => {
  test("should login and logout successfully", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const navigationPage = new NavigationPage(page);

    // Zaloguj się
    await loginPage.navigateToLoginPage();
    await loginPage.login();

    // Sprawdź czy logowanie się udało
    await navigationPage.waitForAuthenticatedState();
    expect(await navigationPage.verifyFullAuthenticatedState(process.env.E2E_USERNAME)).toBe(true);

    // Wyloguj się
    await navigationPage.performLogout();

    // Sprawdź czy wylogowanie się udało
    expect(await navigationPage.verifyFullNonAuthenticatedState()).toBe(true);
  });
});
