# AI Recipe Modification Flow - E2E Test

## Opis

Ten test implementuje pełny scenariusz użytkownika związany z modyfikacją przepisów przy pomocy AI. Test sprawdza cały flow od logowania, przez konfigurację preferencji, dodanie przepisu z modyfikacją AI, weryfikację i cleanup.

## Scenariusze testowe

### 1. Główny scenariusz (Complete AI Recipe Modification Journey)

**Kroki:**
1. Zaloguj się użytkownikiem `test@test.pl` i hasłem `TestPassword123`
2. Poczekaj aż użytkownik będzie zalogowany i pojawi się przycisk "Preferencje" na górnej belce nawigacyjnej
3. Wejdź w zakładkę Preferencje w górnej belce nawigacyjnej
4. Uzupełnij wszystkie pola preferencji losowymi wartościami zgodnymi z walidacją
5. Zapisz preferencje
6. Wejdź w zakładkę "Dodaj Przepis" w górnej belce nawigacyjnej
7. Wprowadź nazwę przepisu, ocenę i treść przepisu
8. Zmodyfikuj przepis przy pomocy AI i poczekaj aż zmodyfikowany przepis się pojawi
9. Zatwierdź zmodyfikowany przepis
10. Wejdź w zakładkę "Moje Przepisy" w górnej belce nawigacyjnej
11. Sprawdź czy zapisany przepis pojawił się na liście (z oznaczeniem źródła "AI")
12. Usuń stworzony przepis

### 2. Scenariusz obsługi błędów (AI Modification Without Preferences)

**Kroki:**
1. Zaloguj się bez ustawionych preferencji
2. Spróbuj utworzyć przepis z modyfikacją AI
3. Sprawdź czy pojawia się modal z informacją o wymaganych preferencjach
4. Przejdź do preferencji z modala
5. Uzupełnij preferencje
6. Wróć do dodawania przepisu
7. Ponownie spróbuj modyfikacji AI (tym razem powinna się udać)

## Komponenty testowane

### Nowe data-testid dodane do komponentów:

#### AIPreviewSection.tsx
- `ai-preview-section` - główny kontener sekcji podglądu AI
- `ai-preview-title` - tytuł sekcji
- `ai-preview-content-comparison` - kontener porównania treści
- `ai-preview-original-section` - sekcja z oryginalną treścią
- `ai-preview-original-title` - tytuł oryginalnej treści
- `ai-preview-original-content` - oryginalna treść przepisu
- `ai-preview-modified-section` - sekcja ze zmodyfikowaną treścią
- `ai-preview-modified-title` - tytuł zmodyfikowanej treści
- `ai-preview-modified-content` - zmodyfikowana treść przepisu
- `ai-preview-actions` - kontener z przyciskami akcji
- `ai-preview-approve-button` - przycisk zatwierdzenia zmian AI
- `ai-preview-reject-button` - przycisk odrzucenia zmian AI

#### ConfirmAIModificationModal.tsx
- `confirm-ai-modification-modal` - główny kontener modala
- `confirm-ai-modification-modal-content` - zawartość modala
- `confirm-ai-modification-modal-header` - nagłówek modala
- `confirm-ai-modification-modal-title` - tytuł modala
- `confirm-ai-modification-modal-description` - opis wymagania preferencji
- `confirm-ai-modification-modal-body` - treść modala
- `confirm-ai-modification-modal-explanation` - dodatkowe wyjaśnienie
- `confirm-ai-modification-modal-footer` - stopka z przyciskami
- `confirm-ai-modification-modal-cancel-button` - przycisk anulowania
- `confirm-ai-modification-modal-go-to-preferences-button` - przycisk przejścia do preferencji

### Rozszerzone AddRecipePage metody:

#### AI Flow
- `isAIPreviewSectionVisible()` - sprawdza czy sekcja podglądu AI jest widoczna
- `waitForAIPreviewSection()` - czeka na pojawienie się sekcji podglądu AI
- `getOriginalContent()` - pobiera oryginalną treść przepisu
- `getModifiedContent()` - pobiera zmodyfikowaną treść przepisu
- `approveAIChanges()` - zatwierdza zmiany AI
- `rejectAIChanges()` - odrzuca zmiany AI

#### Modal Flow
- `isConfirmAIModificationModalVisible()` - sprawdza czy modal preferencji jest widoczny
- `waitForConfirmAIModificationModal()` - czeka na pojawienie się modala
- `closeConfirmAIModificationModal()` - zamyka modal
- `goToPreferencesFromModal()` - przechodzi do preferencji z modala
- `getConfirmAIModificationModalTitle()` - pobiera tytuł modala

#### Complete Flow
- `submitWithAIAndApprove()` - kompletny flow: wypełnienie formularza → submit z AI → zatwierdzenie

## Uruchomienie testów

```bash
# Uruchomienie tylko testów AI Recipe Modification Flow
npx playwright test ai-recipe-modification-flow.spec.ts

# Uruchomienie z widoczną przeglądarką
npx playwright test ai-recipe-modification-flow.spec.ts --headed

# Uruchomienie z debug mode
npx playwright test ai-recipe-modification-flow.spec.ts --debug

# Uruchomienie konkretnego testu
npx playwright test ai-recipe-modification-flow.spec.ts -g "should complete full AI recipe modification journey"
```

## Wymagania

- Uruchomiony backend z działającym API
- Konto testowe `test@test.pl` z hasłem `TestPassword123`
- Działające API endpoints:
  - `/api/auth/login`
  - `/api/preferences`
  - `/api/recipes/create`
  - `/api/recipes/modify`
  - `/api/recipes` (GET)
  - `/api/recipes/delete`

## Wzorce testowe zastosowane

- **Page Object Model** - wszystkie interakcje z UI są enkapsulowane w Page Objects
- **Data-testid selectors** - używane zgodnie z best practices Playwright
- **Arrange-Act-Assert** - każdy test ma wyraźną strukturę AAA
- **Helper functions** - wspólne operacje (login, setup preferences) są wydzielone
- **Network monitoring** - test monitoruje odpowiedzi HTTP żeby zweryfikować operacje
- **Explicit waits** - używane timeouty i wait conditions dla stabilności testów
- **Console logging** - każdy krok jest logowany dla łatwiejszego debugowania

## Uwagi techniczne

- Test używa unikalnych nazw przepisów z timestamp żeby uniknąć konfliktów
- Implementuje retry logic dla operacji usuwania przepisów
- Sprawdza zarówno pozytywne jak i negatywne scenariusze
- Veryfikuje czy przepisy utworzone z AI mają poprawne oznaczenie źródła
- Cleanup po każdym teście (usuwanie utworzonych danych) 