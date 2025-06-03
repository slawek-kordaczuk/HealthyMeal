# Testy jednostkowe dla `useRecipes` Hook

## Przegląd

Ten plik zawiera kompleksowy zestaw testów jednostkowych dla hooka `useRecipes`, który jest kluczowym elementem zarządzania stanem przepisów w aplikacji HealthyMeal.

## Struktura testów

### 1. **Initial State** - Stan początkowy
- ✅ Weryfikacja domyślnych wartości przy inicjalizacji
- ✅ Sprawdzenie automatycznego wywołania API przy mount

### 2. **Filter Management** - Zarządzanie filtrami
- ✅ **Reguła biznesowa**: `setSearchTerm` resetuje stronę do 1
- ✅ Aktualizacja tylko określonych filtrów przez `setPage`
- ✅ Zachowanie pozostałych filtrów przy zmianie search term
- ✅ Kompletna aktualizacja przez `setFilters`

### 3. **API Query Parameters** - Parametry zapytań API
- ✅ Poprawne budowanie URL z wszystkimi filtrami
- ✅ Pomijanie pustych wartości search term
- ✅ **Edge case**: Znaki specjalne w search term (enkodowanie URL)

### 4. **Successful Data Fetching** - Pomyślne pobieranie danych
- ✅ Aktualizacja stanu po udanym API response
- ✅ **Edge case**: Pusta odpowiedź (0 przepisów)
- ✅ Zarządzanie stanem loading (async behavior)

### 5. **Error Handling** - Obsługa błędów
- ✅ **Reguła biznesowa**: Specyficzny komunikat dla 401 (sesja wygasła)
- ✅ Ogólne błędy HTTP (500, etc.)
- ✅ Błędy sieciowe (network failures)
- ✅ Błędy parsowania JSON
- ✅ **Edge case**: Nieznane typy błędów
- ✅ Czyszczenie poprzednich błędów przy retry

### 6. **Refresh Functionality** - Funkcjonalność odświeżania
- ✅ Refresh z zachowaniem bieżących filtrów
- ✅ Obsługa błędów podczas refresh

### 7. **Effect Triggers** - Wyzwalacze efektów
- ✅ Automatyczne fetchowanie przy zmianie filtrów
- ✅ **Edge case**: Unmount podczas pendującego fetch

### 8. **Edge Cases** - Przypadki brzegowe
- ✅ Szybkie zmiany filtrów (race conditions)
- ✅ Źle sformowane odpowiedzi API
- ✅ Wartości graniczne dla paginacji (0, 999999)

### 9. **TypeScript Type Safety** - Bezpieczeństwo typów
- ✅ Weryfikacja poprawnych typów dla wszystkich zwracanych wartości

## Kluczowe reguły biznesowe testowane

1. **Reset strony**: Przy zmianie `searchTerm` strona zawsze resetuje się do 1
2. **Obsługa 401**: Specyficzny komunikat "Sesja wygasła, zaloguj się ponownie."
3. **URL encoding**: Znaki specjalne w search term są poprawnie enkodowane
4. **State cleanup**: Błędy i dane są czyszczone przy nowych zapytaniach
5. **Loading state**: Poprawne zarządzanie stanem ładowania dla UX

## Uruchamianie testów

```bash
# Uruchom wszystkie testy hooka useRecipes
npm run test src/components/hooks/__tests__/useRecipes.test.ts

# Uruchom w trybie watch
npm run test:watch src/components/hooks/__tests__/useRecipes.test.ts

# Uruchom z coverage
npm run test:coverage src/components/hooks/__tests__/useRecipes.test.ts

# Uruchom konkretny test
npm run test -- -t "should reset page to 1 when search term changes"
```

## Testowane scenariusze użycia

### Typowy flow użytkownika:
1. Użytkownik otwiera listę przepisów (initial fetch)
2. Wprowadza search term → strona resetuje się do 1
3. Przechodzi na kolejne strony → inne filtry zachowane
4. Zmienia sortowanie → fetch z nowymi parametrami
5. Traci połączenie → obsługa błędu sieciowego
6. Odświeża stronę → retry z bieżącymi filtrami

### Edge cases pokryte:
- Błędy 401 (wylogowanie)
- Bardzo szybkie zmiany filtrów
- Nieprawidłowe odpowiedzi API
- Unmount komponentu podczas API call

## Mock Strategy

- **Global fetch**: Mockowanie przy użyciu `vi.fn()`
- **Factory functions**: `createMockRecipe`, `createMockPagination`, `createMockResponse`
- **Type safety**: `MockFetchResponse` interface dla typowanego mockowania
- **Cleanup**: Automatyczne czyszczenie mocków między testami

## Wskazówki dla rozszerzania testów

Przy dodawaniu nowych funkcjonalności do `useRecipes`, pamiętaj o:

1. **Dodaniu testów dla nowych filtrów** - sprawdź czy są poprawnie przekazywane do API
2. **Testowaniu nowych error case'ów** - szczególnie nowe kody HTTP
3. **Weryfikacji side effects** - np. toast notifications, localStorage
4. **Edge cases dla nowych parametrów** - wartości graniczne, null/undefined
5. **Race conditions** - szczególnie przy async operations

## Coverage

Testy pokrywają:
- ✅ 100% linii kodu hooka `useRecipes`
- ✅ Wszystkie ścieżki error handling
- ✅ Wszystkie kombinacje filtrów
- ✅ Wszystkie publiczne metody hooka
- ✅ Wszystkie useEffect dependencies 