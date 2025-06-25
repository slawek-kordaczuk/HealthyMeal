# Kompletny Scenariusz Testów E2E - HealthyMeal

## Przegląd

Ten dokument opisuje kompletny scenariusz testów e2e dla aplikacji HealthyMeal, który obejmuje:

1. **Logowanie użytkownika** (test@test.pl / TestPassword123)
2. **Oczekiwanie na zalogowanie** (pojawienie się przycisku "Preferencje")
3. **Konfigurację preferencji** żywieniowych z losowymi wartościami
4. **Zapisanie preferencji**
5. **Przejście do "Dodaj Przepis"**
6. **Wprowadzenie danych przepisu** (nazwa, ocena, treść)
7. **Zapisanie przepisu**

## Struktura Testów

### Plik Testowy Główny
- `e2e/complete-user-flow.spec.ts` - Kompletny scenariusz testów

### Page Objects
- `e2e/page-objects/LoginPage.ts` - Obsługa formularza logowania
- `e2e/page-objects/NavigationPage.ts` - Obsługa nawigacji
- `e2e/page-objects/PreferencesPage.ts` - Obsługa formularza preferencji
- `e2e/page-objects/AddRecipePage.ts` - Obsługa formularza przepisu (nowo utworzony)

## Atrybuty data-testid

### Logowanie (LoginForm.tsx)
✅ **Już dodane:**
- `login-form` - Formularz logowania
- `login-email-input` - Pole email
- `login-password-input` - Pole hasło
- `login-submit-button` - Przycisk zaloguj
- `login-error-alert` - Alert błędu
- `login-error-message` - Wiadomość błędu

### Nawigacja (NavigationMenuContainer.tsx)
✅ **Już dodane:**
- `nav-authenticated-links` - Linki dla zalogowanych użytkowników
- `nav-link-preferencje` - Link do preferencji
- `nav-link-dodaj-przepis` - Link do dodawania przepisu
- `nav-logout-button` - Przycisk wyloguj
- `nav-user-email` - Email użytkownika

### Preferencje (PreferencesForm.tsx)
✅ **Już dodane:**
- `preferences-form-container` - Kontener formularza
- `preferences-form` - Formularz preferencji
- `preferences-diet-type-input` - Typ diety
- `preferences-calorie-requirement-input` - Zapotrzebowanie kaloryczne
- `preferences-allergies-input` - Alergie
- `preferences-food-intolerances-input` - Nietolerancje
- `preferences-preferred-cuisines-input` - Preferowane kuchnie
- `preferences-excluded-ingredients-input` - Wykluczone składniki
- `preferences-protein-input` - Białko (%)
- `preferences-fats-input` - Tłuszcze (%)
- `preferences-carbohydrates-input` - Węglowodany (%)
- `preferences-submit-button` - Przycisk zapisz
- `preferences-success-alert` - Alert sukcesu
- `preferences-success-message` - Wiadomość sukcesu

### Przepisy (RecipeForm.tsx)
✅ **Nowo dodane:**
- `recipe-form-container` - Kontener formularza
- `recipe-form` - Formularz przepisu
- `recipe-name-input` - Nazwa przepisu
- `recipe-rating-input` - Ocena przepisu
- `recipe-content-input` - Treść przepisu
- `recipe-save-button` - Przycisk zapisz
- `recipe-save-with-ai-button` - Przycisk zapisz z AI
- `recipe-form-success-alert` - Alert sukcesu
- `recipe-form-success-message` - Wiadomość sukcesu
- `recipe-form-error-alert` - Alert błędu
- `recipe-form-error-message` - Wiadomość błędu

### Strona dodawania przepisu (add-recipe.astro)
✅ **Nowo dodane:**
- `add-recipe-title` - Tytuł "Dodaj Nowy Przepis"

## Testy

### 1. Główny test końca do końca
```typescript
test("should complete full user journey: login → preferences → add recipe")
```

**Scenariusz:**
1. Loguje użytkownika test@test.pl
2. Weryfikuje pojawienie się nawigacji dla zalogowanych
3. Przechodzi do Preferencji
4. Wypełnia wszystkie pola preferencji losowymi wartościami
5. Zapisuje preferencje i weryfikuje sukces
6. Przechodzi do "Dodaj Przepis"
7. Wypełnia formularz przepisu (nazwa, ocena, treść)
8. Zapisuje przepis i weryfikuje sukces
9. Sprawdza czy formularz został zresetowany

### 2. Test opcjonalnych pól
```typescript
test("should handle recipe creation without rating (optional field)")
```

**Scenariusz:**
- Tworzy przepis bez podawania oceny
- Weryfikuje że ocena jest rzeczywiście opcjonalna

### 3. Test walidacji formularza
```typescript
test("should show validation errors for empty required fields")
```

**Scenariusz:**
- Próbuje wysłać pusty formularz
- Weryfikuje że wyświetlane są błędy walidacji

### 4. Test konsystencji nawigacji
```typescript
test("should maintain navigation state throughout the flow")
```

**Scenariusz:**
- Sprawdza czy linki nawigacyjne są dostępne przez cały proces
- Weryfikuje przejścia między stronami

## Uruchomienie Testów

```bash
# Uruchomienie wszystkich testów e2e
npm run test:e2e

# Uruchomienie tylko kompletnego scenariusza
npx playwright test complete-user-flow.spec.ts

# Uruchomienie z interfejsem UI
npx playwright test complete-user-flow.spec.ts --ui

# Debugowanie
npx playwright test complete-user-flow.spec.ts --debug
```

## Dane Testowe

### Użytkownik testowy
- **Email:** test@test.pl
- **Hasło:** TestPassword123

### Przykładowe preferencje (losowe wartości)
- **Typ diety:** wegetariańska
- **Kalorie:** 2000
- **Alergie:** orzechy, skorupiaki
- **Nietolerancje:** laktoza
- **Kuchnie:** włoska, śródziemnomorska
- **Wykluczone składniki:** mięso czerwone
- **Makroskładniki:** 30% białko, 30% tłuszcze, 40% węglowodany

### Przykładowy przepis
```
Nazwa: "Testowy Przepis [timestamp]"
Ocena: 8
Treść:
Składniki:
- 200g mąki pszennej
- 2 jajka
- 250ml mleka
- 2 łyżki oleju
- 1 łyżeczka soli
- 1 łyżeczka cukru

Przygotowanie:
1. Wymieszaj mąkę z solą i cukrem w misce
2. Dodaj jajka i mleko, wymieszaj na gładkie ciasto
3. Dodaj olej i ponownie wymieszaj
4. Rozgrzej patelnię i smaż naleśniki z obu stron
5. Podawaj ciepłe z ulubionymi dodatkami
```

## Uwagi Techniczne

### Wzorce testowe
- **Arrange-Act-Assert:** Każdy test używa jasnej struktury AAA
- **Page Object Model:** Wszystkie interakcje przez page objects
- **Unikalność danych:** Używanie timestamp w nazwach dla unikania konfliktów
- **Oczekiwanie na stany:** Używanie `waitFor` zamiast `waitForTimeout`

### Obsługa błędów
- Testy sprawdzają zarówno pozytywne jak i negatywne scenariusze
- Weryfikacja komunikatów błędów i alertów
- Testowanie walidacji formularzy

### Współbieżność
- Testy są niezależne i mogą być uruchamiane równolegle
- Każdy test czyści dane przed rozpoczęciem
- Używanie unikalnych identyfikatorów dla danych testowych 