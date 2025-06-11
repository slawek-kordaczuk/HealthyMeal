import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should login and logout successfully", async ({ page }) => {
    // Idź na stronę logowania
    await page.goto("/login");
    await expect(page.getByTestId("login-form")).toBeVisible();

    // Poczekaj aż formularz będzie w pełni załadowany
    await page.waitForTimeout(1000);

    // Upewnij się, że pola są dostępne i gotowe
    await expect(page.getByTestId("login-email-input")).toBeEnabled();
    await expect(page.getByTestId("login-password-input")).toBeEnabled();

    // Zaloguj się - z wolniejszym wpisywaniem
    await page.getByTestId("login-email-input").click();
    await page.getByTestId("login-email-input").fill("test@test.pl");
    await page.getByTestId("login-password-input").click();
    await page.getByTestId("login-password-input").fill("TestPassword123");

    // Upewnij się, że pola są wypełnione
    await expect(page.getByTestId("login-email-input")).toHaveValue("test@test.pl");
    await expect(page.getByTestId("login-password-input")).toHaveValue("TestPassword123");

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
