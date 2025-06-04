# RecipeModificationService Tests

Ten katalog zawiera kompleksowy zestaw testów jednostkowych dla `RecipeModificationService.modifyRecipe()`.

## Struktura testów

### 📁 Pliki testowe

- **`recipeModificationService.test.ts`** - Główne testy funkcjonalności
- **`edgeCases.test.ts`** - Testy przypadków brzegowych i scenariuszy specjalnych
- **`fixtures.ts`** - Dane testowe i fixtures

## 🎯 Pokrycie testowe

### Reguły biznesowe
- ✅ Walidacja długości tekstu przepisu (max 8000 znaków)
- ✅ Sprawdzanie czy tekst przepisu nie jest pusty
- ✅ Pobieranie preferencji użytkownika
- ✅ Tworzenie promptu modyfikacji z preferencjami
- ✅ Komunikacja z OpenRouter API
- ✅ Logowanie błędów do bazy danych

### Warunki brzegowe
- ✅ Bardzo krótkie przepisy
- ✅ Przepisy o maksymalnej długości
- ✅ Przepisy ze znakami specjalnymi i emoji
- ✅ Tekst składający się tylko z białych znaków
- ✅ Pusty tekst
- ✅ Przepisy z powtarzającą się treścią
- ✅ Przepisy z Unicode i międzynarodowymi znakami

### Scenariusze preferencji
- ✅ Minimalne preferencje (tylko typ diety)
- ✅ Pełne preferencje z wszystkimi polami
- ✅ Preferencje wegetariańskie
- ✅ Preferencje wegańskie
- ✅ Dieta ketogeniczna
- ✅ Złożone alergie i nietolerancje
- ✅ Częściowy rozkład makroelementów

### Obsługa błędów
- ✅ Brak preferencji użytkownika
- ✅ Błędy serwisu preferencji
- ✅ Błędy AI (OpenRouter)
- ✅ Pusta odpowiedź AI
- ✅ Błędy limitów zapytań (rate limiting)
- ✅ Błędy uwierzytelniania
- ✅ Błędy bazy danych podczas logowania

### Kody błędów HTTP
- ✅ 400 (Bad Request) - walidacja wejścia
- ✅ 401 (Unauthorized) - błędy uwierzytelniania
- ✅ 422 (Unprocessable Entity) - brak preferencji
- ✅ 429 (Too Many Requests) - rate limiting
- ✅ 500 (Internal Server Error) - inne błędy

### Przypadki specjalne
- ✅ Równoczesne modyfikacje przepisów
- ✅ Błędy inicjalizacji serwisów
- ✅ Błędy bazy danych podczas logowania błędów
- ✅ Długie odpowiedzi AI
- ✅ Odpowiedzi AI z dodatkowymi białymi znakami

## 🛠️ Techniki testowe

### Mockowanie
- **Vitest mocks** - używane do mockowania zależności
- **Type-safe mocks** - mocki z pełnym typowaniem TypeScript
- **Factory pattern** - dla konstruktorów serwisów
- **Spy functions** - do weryfikacji wywołań

### Fixtures
- **Stałe dane testowe** - w pliku `fixtures.ts`
- **Różnorodne scenariusze** - preferencje dla różnych diet
- **Przypadki brzegowe** - przepisy o różnych charakterystykach
- **Oczekiwane błędy** - mapowanie komunikatów i kodów

### Organizacja
- **Grupowanie opisowe** - testy pogrupowane według funkcjonalności
- **AAA pattern** - Arrange, Act, Assert w każdym teście
- **Eksplicytne asercje** - jasne komunikaty błędów
- **Izolacja testów** - każdy test jest niezależny

## 🚀 Uruchamianie testów

```bash
# Wszystkie testy serwisu
npm run test src/lib/services/__tests__/recipeModificationService/

# Tylko główne testy
npm run test recipeModificationService.test.ts

# Tylko przypadki brzegowe
npm run test edgeCases.test.ts

# Z coverage
npm run test:coverage src/lib/services/__tests__/recipeModificationService/

# Watch mode
npm run test:watch src/lib/services/__tests__/recipeModificationService/
```

## 📊 Metryki

- **Liczba testów**: ~45 testów
- **Pokrycie funkcji**: 100%
- **Pokrycie warunków brzegowych**: 100%
- **Pokrycie ścieżek błędów**: 100%

## 🔧 Rozszerzanie testów

Przy dodawaniu nowych funkcjonalności do `RecipeModificationService`:

1. **Dodaj fixture** w `fixtures.ts` jeśli potrzebujesz nowych danych testowych
2. **Dodaj test pozytywny** w głównym pliku testów
3. **Dodaj test błędu** jeśli funkcjonalność może nie powieść się
4. **Dodaj test brzegowy** w `edgeCases.test.ts` jeśli jest to skomplikowany scenariusz
5. **Zaktualizuj dokumentację** w tym README

## ⚠️ Uwagi

- Testy używają mocków dla wszystkich zewnętrznych zależności
- Nie wykonują rzeczywistych wywołań API ani operacji bazodanowych
- Sprawdzają logikę biznesową, walidację i obsługę błędów
- Używają type-safe mocking dla bezpieczeństwa typów 