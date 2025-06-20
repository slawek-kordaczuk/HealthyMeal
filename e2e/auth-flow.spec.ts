import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should login and logout successfully", async ({ page }) => {
    // Idź na stronę logowania
    await page.goto("/login");
    await expect(page.getByTestId("login-form")).toBeVisible();

    // Poczekaj aż formularz będzie w pełni załadowany i React się zainicjalizuje
    await page.waitForTimeout(2000);

    // Upewnij się, że pola są dostępne i gotowe
    await expect(page.getByTestId("login-email-input")).toBeEnabled();
    await expect(page.getByTestId("login-password-input")).toBeEnabled();

    // Wypełnij pola bardziej niezawodnie
    const emailInput = page.getByTestId("login-email-input");
    const passwordInput = page.getByTestId("login-password-input");

    // Wyczyść i wypełnij email
    await emailInput.click();
    await emailInput.clear();
    await emailInput.fill("test@test.pl");
    await emailInput.blur(); // Stracenie focusu może pomóc z walidacją

    // Wyczyść i wypełnij hasło
    await passwordInput.click();
    await passwordInput.clear();
    await passwordInput.fill("TestPassword123");
    await passwordInput.blur();

    // Poczekaj chwilę na React state updates
    await page.waitForTimeout(500);

    // Upewnij się, że pola są wypełnione
    await expect(emailInput).toHaveValue("test@test.pl", { timeout: 10000 });
    await expect(passwordInput).toHaveValue("TestPassword123", { timeout: 10000 });

    // Poczekaj na odpowiedź z API po kliknięciu przycisku
    const loginPromise = page.waitForResponse("/api/auth/login");
    await page.getByTestId("login-submit-button").click();

    // Czekaj na odpowiedź z API logowania
    const loginResponse = await loginPromise;
    expect(loginResponse.status()).toBe(200);

    // Sprawdź czy logowanie się udało - czekaj aż pojawią się elementy zalogowanego użytkownika
    // (LoginForm przekierowuje automatycznie na / po logowaniu)
    await expect(page.getByTestId("nav-authenticated-links")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("nav-logout-button")).toBeVisible();

    // Sprawdź czy jesteś na stronie głównej
    await expect(page).toHaveURL("/");

    // Wyloguj się
    await page.getByTestId("nav-logout-button").click();

    // Sprawdź czy wylogowanie się udało - powinny pojawić się przyciski logowania
    await expect(page.getByTestId("nav-auth-buttons")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("nav-login-button")).toBeVisible();

    // Sprawdź czy jesteś z powrotem na stronie głównej w stanie niezalogowanym
    await expect(page).toHaveURL("/");
  });
});
