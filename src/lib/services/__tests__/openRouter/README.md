# OpenRouterService Test Suite

Kompletny zestaw testów jednostkowych dla `OpenRouterService` z użyciem Vitest.

## Struktura Testów

### `OpenRouterService.sendMessage.test.ts`
Główne testy dla metody `sendMessage()` obejmujące:

#### Walidacja Danych Wejściowych
- ❌ Puste wiadomości
- ❌ Wiadomości przekraczające limit znaków (10000)
- ❌ Nieprawidłowe parametry użytkownika (temperature, max_tokens, top_p, etc.)
- ✅ Wiadomości o maksymalnej dozwolonej długości

#### Sanityzacja Wiadomości
- 🧹 Usuwanie znaków kontrolnych
- 🧹 Normalizacja białych znaków
- 🧹 Obsługa znaków Unicode

#### Budowanie Payloadu Żądania
- 📦 Poprawna struktura żądania z domyślnymi parametrami
- 📦 Nadpisywanie parametrów opcjami użytkownika
- 📦 Integracja z niestandardowymi wiadomościami systemowymi
- 📦 Poprawne nagłówki HTTP

#### Obsługa Odpowiedzi
- ✅ Prawidłowe formatowanie odpowiedzi
- ✅ Przechowywanie ostatniej odpowiedzi
- ⚠️ Obsługa odpowiedzi bez informacji o użyciu

#### Obsługa Błędów HTTP
- 🚫 401 - Błędy autoryzacji
- 🚫 429 - Przekroczenie limitu żądań
- 🚫 400 - Błędne żądania
- 🚫 500 - Błędy serwera
- 🚫 Nieznane kody błędów
- 🚫 Zniekształcone odpowiedzi błędów

#### Walidacja Odpowiedzi API
- ❌ Odpowiedzi bez `choices`
- ❌ Puste tablice `choices`
- ❌ Brak zawartości wiadomości

#### Obsługa Błędów Sieciowych
- 🌐 Timeouty sieciowe
- 🌐 Niepowodzenia fetch
- 🌐 Nieznane błędy sieciowe

#### Logika Ponownych Prób
- 🔄 Ponowne próby przy 429 (rate limit)
- 🔄 Ponowne próby przy 500+ (błędy serwera)
- 🔄 Ponowne próby przy błędach sieciowych
- ⛔ Brak ponownych prób przy 401/400
- ⛔ Zatrzymanie po maksymalnej liczbie prób

#### Logowanie Błędów
- 📝 Strukturowane logowanie kontekstu błędów
- 📝 Zawieranie timestampów i metadanych

#### Przypadki Brzegowe
- 🎯 Wiadomości o granicznych długościach
- 🌍 Znaki Unicode
- ⚡ Równoczesne żądania

### `OpenRouterService.additional.test.ts`
Testy dla pozostałych metod serwisu:

#### Walidacja Konstruktora
- ❌ Brak klucza API
- ❌ Nieprawidłowy format klucza API
- ❌ Nieprawidłowy URL endpoint
- ✅ Poprawna inicjalizacja
- ✅ Domyślne wartości konfiguracji
- ❌ Walidacja parametrów modelu przy inicjalizacji

#### `setSystemMessage()`
- ❌ Puste wiadomości systemowe
- ❌ Wiadomości przekraczające limit
- ✅ Prawidłowe wiadomości systemowe
- 🧹 Sanityzacja wiadomości systemowych

#### `configureModel()`
- ❌ Puste nazwy modeli
- ❌ Nieprawidłowe znaki w nazwach modeli
- ✅ Prawidłowe nazwy modeli
- ❌ Walidacja parametrów modelu
- 🔀 Scalanie z istniejącą konfiguracją

#### `getLastResponse()`
- 🔍 Zwracanie null gdy brak odpowiedzi
- 🔍 Zgodność z właściwością `lastResponse`

#### Przypadki Brzegowe Konfiguracji
- 🎯 Wartości graniczne parametrów
- 🔄 Częściowe aktualizacje parametrów
- ⚙️ Obsługa parametrów opcjonalnych

## Uruchamianie Testów

```bash
# Wszystkie testy OpenRouterService
npm test src/lib/services/__tests__/openRouter

# Tylko testy sendMessage
npm test src/lib/services/__tests__/openRouter/OpenRouterService.sendMessage.test.ts

# Tylko testy dodatkowe
npm test src/lib/services/__tests__/openRouter/OpenRouterService.additional.test.ts

# Testy z pokryciem
npm test -- --coverage src/lib/services/__tests__/openRouter
```

## Mocki i Zależności

### Zmienne Środowiskowe
```typescript
vi.mock('astro:env', () => ({
  OPENROUTER_API_KEY: 'test-api-key-1234567890',
  OPENROUTER_ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
  OPENROUTER_REFERER: 'https://localhost:3000',
  OPENROUTER_TITLE: 'HealthyMeal App'
}));
```

### Fetch API
- Globalne mockowanie `fetch`
- Różne scenariusze odpowiedzi
- Symulacja błędów sieciowych

### Console
- Wyciszenie logów w testach
- Sprawdzanie wywołań `console.error`

## Kluczowe Reguły Biznesowe Testowane

1. **Walidacja Długości Wiadomości**: Max 10000 znaków
2. **Parametry Modelu**:
   - `temperature`: 0-2
   - `max_tokens`: 1-4096
   - `top_p`: 0-1
   - `frequency_penalty`: -2 do 2
   - `presence_penalty`: -2 do 2
3. **Klucz API**: Min 10, max 200 znaków
4. **Endpoint**: Tylko HTTPS
5. **Retry Logic**: Max 3 próby dla 429/500+/network errors
6. **Sanityzacja**: Usuwanie znaków kontrolnych, normalizacja whitespace

## Pokrycie Testów

Testy zapewniają 100% pokrycie linii kodu dla:
- ✅ Wszystkie publiczne metody
- ✅ Wszystkie ścieżki błędów
- ✅ Wszystkie walidacje
- ✅ Logika retry
- ✅ Sanityzacja danych

## Utrzymanie Testów

### Dodawanie Nowych Testów
1. Umieść w odpowiednim pliku (`sendMessage` vs `additional`)
2. Użyj opisowych nazw testów
3. Grupuj podobne testy w `describe` bloki
4. Dodaj komentarze dla złożonych scenariuszy

### Aktualizacja Przy Zmianach API
1. Zaktualizuj mocki odpowiedzi API
2. Sprawdź walidacje parametrów
3. Dodaj testy dla nowych funkcji
4. Utrzymaj backwards compatibility testy

### Debugging
1. Użyj `fit` lub `fdescribe` dla izolacji testów
2. Sprawdź mocki `mockFetch.mock.calls`
3. Włącz console logi tymczasowo
4. Użyj `--verbose` dla szczegółowych raportów 