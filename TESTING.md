# Środowisko Testowe - HealthyMeal

## Przegląd

Projekt wykorzystuje dwa główne frameworki testowe:
- **Vitest** - do testów jednostkowych i integracyjnych
- **Playwright** - do testów end-to-end (E2E)

## Testy Jednostkowe (Vitest)

### Konfiguracja
- Framework: Vitest z React Testing Library
- Środowisko: jsdom
- Pokrycie kodu: v8 provider
- Setup: `src/test/setup.ts`

### Uruchamianie testów

```bash
# Uruchom testy w trybie watch
npm run test

# Uruchom testy jednokrotnie
npm run test:run

# Uruchom testy z interfejsem UI
npm run test:ui

# Uruchom testy z pokryciem kodu
npm run test:coverage

# Uruchom testy w trybie watch (explicit)
npm run test:watch
```

### Struktura testów
- Pliki testowe: `*.test.tsx` lub `*.spec.tsx` w katalogu `src/`
- Utilities: `src/test/utils.tsx` - custom render z providerami
- Setup: `src/test/setup.ts` - globalne mocki i konfiguracja

### Przykład testu
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Testy E2E (Playwright)

### Konfiguracja
- Framework: Playwright
- Przeglądarki: Chromium (Desktop Chrome)
- Pattern: Page Object Model
- Base URL: http://localhost:4321

### Uruchamianie testów

```bash
# Uruchom testy E2E
npm run test:e2e

# Uruchom testy z interfejsem UI
npm run test:e2e:ui

# Uruchom testy w trybie headed (widoczna przeglądarka)
npm run test:e2e:headed

# Uruchom testy w trybie debug
npm run test:e2e:debug

# Uruchom wszystkie testy (jednostkowe + E2E)
npm run test:all
```

### Struktura testów E2E
- Pliki testowe: `e2e/*.spec.ts`
- Page Objects: `e2e/page-objects/`
- Screenshots: `e2e/screenshots/` (ignorowane w git)
- Raporty: `playwright-report/` (ignorowane w git)

### Page Object Model
```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';

test('homepage test', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await expect(homePage.mainContent).toBeVisible();
});
```

## Mocki i Utilities

### Globalne mocki (setup.ts)
- **Next Themes** - mockowany dla uniknięcia problemów SSR
- **Supabase** - mockowany klient z podstawowymi metodami
- **Environment variables** - testowe wartości
- **Browser APIs** - matchMedia, ResizeObserver

### Test utilities
- **Custom render** - z ThemeProvider
- **Mock factories** - createMockUser(), createMockRecipe()

## Pokrycie kodu

Minimalne progi pokrycia:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## CI/CD Integration

Testy są skonfigurowane do uruchamiania w GitHub Actions:
- Testy jednostkowe uruchamiają się na każdy push
- Testy E2E uruchamiają się z retry (2x) w środowisku CI
- Generowane są raporty HTML dla obu typów testów

## Debugowanie

### Vitest
```bash
# UI mode dla interaktywnego debugowania
npm run test:ui

# Watch mode z filtrowaniem
npm run test -- --watch -t "nazwa testu"
```

### Playwright
```bash
# Debug mode z krokowaniem
npm run test:e2e:debug

# Headed mode do obserwacji
npm run test:e2e:headed

# Trace viewer dla analizy błędów
npx playwright show-trace trace.zip
```

## Najlepsze praktyki

### Testy jednostkowe
1. Używaj `describe` do grupowania powiązanych testów
2. Testuj zachowanie, nie implementację
3. Używaj meaningful assertion messages
4. Mockuj zewnętrzne zależności
5. Testuj edge cases i error handling

### Testy E2E
1. Używaj Page Object Model dla maintainability
2. Używaj data-testid dla stabilnych selektorów
3. Testuj complete user journeys
4. Używaj visual regression testing
5. Izoluj testy - każdy test powinien być niezależny

## Troubleshooting

### Problemy z testami jednostkowymi
- Sprawdź czy wszystkie mocki są poprawnie skonfigurowane
- Upewnij się że komponenty są renderowane z odpowiednimi providerami
- Sprawdź console.error w testach

### Problemy z testami E2E
- Upewnij się że serwer dev jest uruchomiony (http://localhost:4321)
- Sprawdź czy Chromium jest zainstalowany: `npx playwright install chromium`
- Użyj `--headed` mode do debugowania wizualnego 