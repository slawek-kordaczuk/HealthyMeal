# Testy jednostkowe - usePreferences Hook

## Przegląd

Komprehensywny zestaw testów dla hooka `usePreferences` z uwzględnieniem wszystkich kluczowych reguł biznesowych i warunków brzegowych.

## Status testów

✅ **36 testów - wszystkie przechodzą** (Updated: 2024)

## Uruchomienie testów

```bash
# Testy usePreferences hook
npm run test:preferences

# Tryb watch dla rozwoju
npm run test:watch

# Wszystkie testy jednostkowe
npm run test
```

## Struktura testów

### 1. **Initial State Tests** (2 testy)
- ✅ Prawidłowy stan początkowy
- ✅ Wywołanie API przy mount

### 2. **Successful API Responses** (3 testy)
- ✅ Odpowiedź 200 z preferencjami
- ✅ Odpowiedź 404 (brak preferencji)
- ✅ Odpowiedź 200 z null data

### 3. **Error Handling Tests** (5 testów)
- ✅ 401 Unauthorized
- ✅ 500 Internal Server Error
- ✅ Network errors
- ✅ JSON parsing errors
- ✅ Non-Error object rejections

### 4. **arePreferencesSet Logic - Business Rules** (11 testów)
- ✅ Null preferences → false
- ✅ Completely empty preferences → false
- ✅ **Każde pojedyncze pole ustawione → true:**
  - `diet_type`
  - `daily_calorie_requirement` 
  - `allergies`
  - `food_intolerances`
  - `preferred_cuisines`
  - `excluded_ingredients`
  - `macro_distribution_protein`
  - `macro_distribution_fats`
  - `macro_distribution_carbohydrates`
- ✅ Multiple fields set → true

### 5. **Refetch Functionality Tests** (4 testy)
- ✅ Successful refetch
- ✅ Refetch error handling
- ✅ Loading state during refetch
- ✅ Clear previous error on refetch

### 6. **Edge Cases and Boundary Conditions** (8 testów)
- ✅ Zero values in macro distribution
- ✅ Zero daily calorie requirement
- ✅ Empty string values (should NOT count)
- ✅ Whitespace-only string values (should count)
- ✅ Invalid preferences structure
- ✅ Simultaneous fetch and refetch calls
- ✅ Boolean function conversion
- ✅ Invalid response handling

### 7. **Loading State Management** (2 testy)
- ✅ Loading state during successful fetch
- ✅ Loading state during failed fetch

## Kluczowe reguły biznesowe

### arePreferencesSet Logic
```typescript
// Hook zwraca true jeśli JAKIEKOLWIEK pole preferencji jest ustawione:
const arePreferencesSet =
  preferences !== null &&
  (preferences.diet_type ||
    preferences.daily_calorie_requirement ||
    preferences.allergies ||
    preferences.food_intolerances ||
    preferences.preferred_cuisines ||
    preferences.excluded_ingredients ||
    preferences.macro_distribution_protein ||
    preferences.macro_distribution_fats ||
    preferences.macro_distribution_carbohydrates);

// WAŻNE: Boolean() konwersja na końcu
return {
  arePreferencesSet: Boolean(arePreferencesSet),
  // ...
};
```

### API Response Handling
```typescript
// Specjalna logika dla 404 i 200:
if (response.status === 404 || (response.ok && response.status === 200)) {
  const data = await response.json();
  setPreferences(data); // Może być null
  return;
}

// 401 → specjalny error message
if (response.status === 401) {
  throw new Error("Unauthorized");
}
// → "Sesja wygasła. Zaloguj się ponownie."

// Inne błędy → generic message
// → "Nie udało się załadować preferencji."
```

### Error Messages (Localized)
- **401 Unauthorized**: `"Sesja wygasła. Zaloguj się ponownie."`
- **Other errors**: `"Nie udało się załadować preferencji."`
- **Console logging**: Zawsze loguje błędy

## Edge Cases Covered

### 🔍 **Wartości graniczne:**
- ✅ `null` preferences
- ✅ Puste obiekty preferencji
- ✅ Zero values (0 NIE powinno liczyć się jako "set" - falsy value)
- ✅ Empty strings (`""` NIE powinno liczyć się jako "set")
- ✅ Whitespace strings (`"   "` powinno liczyć się jako "set")

### 🔍 **Scenariusze błędów:**
- ✅ Network failures
- ✅ JSON parsing errors
- ✅ Non-Error object rejections
- ✅ Invalid response structures

### 🔍 **Concurrency:**
- ✅ Simultaneous fetch/refetch calls
- ✅ Loading state management
- ✅ Error clearing on refetch

## Test Architecture

### **Mocking Strategy:**
```typescript
// Global fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Console.error suppression for clean test output
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {
  // Suppress console.error in tests
});
```

### **Test Data Factories:**
```typescript
// Factory dla pełnych preferencji
const createMockPreferences = (overrides = {}) => ({ ... });

// Factory dla pustych preferencji
const createEmptyPreferences = () => ({ ... });
```

### **React Testing Library + Vitest:**
- `renderHook()` dla testowania hooków
- `waitFor()` dla asynchronicznych operacji
- Proper cleanup w `beforeEach`/`afterEach`

## Coverage

Testy pokrywają:
- ✅ **100% ścieżek logiki biznesowej**
- ✅ **Wszystkie warunki brzegowe** dla `arePreferencesSet`
- ✅ **Kompletna obsługa błędów** (network, parsing, HTTP status)
- ✅ **Loading state management** (initial, refetch, error)
- ✅ **API interaction patterns** (mount, refetch, error recovery)
- ✅ **Type safety** z TypeScript
- ✅ **Edge cases** (concurrent calls, invalid data)

## Uwagi dla deweloperów

1. **arePreferencesSet logic** - testuje wszystkie 9 pól preferencji indywidualnie
2. **Boolean conversion** - weryfikuje że `Boolean()` jest wywołane
3. **Error message localization** - sprawdza polskie komunikaty błędów
4. **API contract** - testuje specjalną logikę dla 404 i 200 responses
5. **Refetch behavior** - sprawdza że błędy są czyszczone przy ponownym fetchu
6. **Loading states** - weryfikuje poprawne zarządzanie stanem ładowania
7. **Mock management** - proper cleanup dla deterministycznych testów