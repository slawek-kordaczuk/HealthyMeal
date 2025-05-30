# OpenRouter Service Implementation Plan

## 1. Opis usługi

Usługa OpenRouter to integracja z zewnętrznym API, która umożliwia uzupełnienie czatów opartych na LLM (Language Learning Model). Główne cele usługi to:

- Przetwarzanie komunikatów systemowych i użytkowników oraz przekazywanie ich do OpenRouter.
- Odbieranie ustrukturyzowanych odpowiedzi w formacie JSON zgodnie z zdefiniowanym schematem.
- Zarządzanie konfiguracją modelu, obejmującą nazwę modelu oraz parametry, takie jak temperature i max_tokens.

## 2. Opis konstruktora

Konstruktor serwisu inicjalizuje wszystkie niezbędne ustawienia, w tym:

1. Klucz API i endpoint (przechowywane w zmiennych środowiskowych dla bezpieczeństwa).
2. Domyślną konfigurację modelu, np.:
   - Nazwa modelu: `gpt-3.5-turbo`
   - Parametry modelu: `{ "temperature": 0.7, "max_tokens": 150 }`
3. Standardowy komunikat systemowy, który definiuje kontekst rozmowy.

**Przykład inicjalizacji:**
```typescript
const openRouterService = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY,
  endpoint: 'https://api.openrouter.com/endpoint',
  defaultModel: 'gpt-3.5-turbo',
  modelParams: { temperature: 0.7, max_tokens: 150 }
});
```

## 3. Publiczne metody i pola

Serwis powinien udostępniać następujące publiczne metody:

1. **sendMessage(message: string, userOptions?: object): Promise<Response>**
   - Wysyłanie komunikatu użytkownika do OpenRouter.
2. **setSystemMessage(systemMsg: string): void**
   - Ustawianie lub aktualizacja komunikatu systemowego.
3. **configureModel(modelName: string, params: object): void**
   - Konfiguracja nazwy modelu oraz jego parametrów.
4. **getLastResponse(): Response | null**
   - Pobranie ostatnio otrzymanej odpowiedzi.

Pola publiczne:

- `lastResponse` – ostatnia odpowiedź z API.
- `config` – aktualna konfiguracja usługi (API key, endpoint, model, parametry).

## 4. Prywatne metody i pola

Wewnątrz serwisu warto zaimplementować następujące prywatne metody:

1. **_buildRequestPayload(systemMsg: string, userMsg: string): object**
   - Budowanie ładunku żądania, łączącego komunikat systemowy i użytkownika.
2. **_handleApiResponse(response: any): Response**
   - Parsowanie i walidacja odpowiedzi zgodnie z `response_format`.
3. **_makeApiCall(payload: object): Promise<any>**
   - Wysyłanie żądania do API OpenRouter.
4. **_logError(error: Error): void**
   - Logowanie błędów i zbieranie danych diagnostycznych.

Prywatne pola mogą obejmować:

- `_apiKey`
- `_endpoint`
- `_currentConfig`

## 5. Obsługa błędów

Przykładowe scenariusze błędów oraz ich obsługa:

1. **Błąd autoryzacji (401 Unauthorized)**
   - Wyzwanie: Nieprawidłowy lub wygasły klucz API.
   - Rozwiązanie: Walidacja klucza API przed wysłaniem żądania, przechwycenie błędu i zwrócenie jasnego komunikatu o błędzie.

2. **Przekroczenie limitu zapytań lub tokenów**
   - Wyzwanie: Użytkownik osiąga limit API.
   - Rozwiązanie: Implementacja mechanizmu rate limiting oraz retry z wykładniczym backoff.

3. **Błędy sieciowe (timeout, brak połączenia)**
   - Wyzwanie: Niestabilność połączenia.
   - Rozwiązanie: Retry z odpowiednimi odstępami czasu oraz fallback do lokalnego cache'u, jeśli to możliwe.

4. **Niezgodność formatu odpowiedzi (response_format)**
   - Wyzwanie: Odpowiedź nie spełnia zdefiniowanego schematu JSON.
   - Rozwiązanie: Walidacja odpowiedzi za pomocą predefiniowanego schematu i logowanie rozbieżności.

## 6. Kwestie bezpieczeństwa

1. **Bezpieczne przechowywanie kluczy API**
   - Użycie zmiennych środowiskowych oraz bezpiecznych magazynów konfiguracji.
2. **Komunikacja HTTPS**
   - Wszystkie połączenia z API powinny odbywać się przez bezpieczne połączenie.
3. **Rate limiting i zabezpieczenia przed nadużyciami**
   - Implementacja mechanizmów ograniczających liczbę żądań.
4. **Walidacja i sanitizacja danych wejściowych**
   - Upewnienie się, że dane przesyłane do API są odpowiednio sformatowane i bezpieczne.
5. **Logowanie i monitorowanie**
   - Śledzenie błędów oraz anomalii w działaniu usługi w celu szybkiej reakcji.

## 7. Plan wdrożenia krok po kroku

1. **Stworzenie modułu usługi**
   - Utworzenie pliku `OpenRouterService.ts` w katalogu `./src/lib/`.
   - Zdefiniowanie interfejsu klasy i konstruktora.

2. **Implementacja metod publicznych**
   - `sendMessage`: Integracja z API i wysyłanie komunikatów użytkownika.
   - `setSystemMessage`: Umożliwienie dynamicznej zmiany komunikatu systemowego.
   - `configureModel`: Konfiguracja nazwy modelu oraz parametrów.
   - `getLastResponse`: Zapewnienie metody dostępu do ostatniej odpowiedzi

3. **Implementacja metod prywatnych**
   - `_buildRequestPayload`: Łączy komunikat systemowy i użytkownika w jeden payload.
   - `_handleApiResponse`: Parsowanie i walidacja odpowiedzi przy użyciu schematu JSON (response_format). 
     - **Przykładowy response_format:**
     ```json
     {
       "type": "json_schema",
       "json_schema": {
         "name": "ResponseSchema",
         "strict": true,
         "schema": {
           "reply": "string",
           "usage": "number"
         }
       }
     }
     ```
   - `_makeApiCall`: Wykonanie żądania do API z odpowiednim payloadem.
   - `_logError`: Logowanie i monitorowanie błędów.

4. **Konfiguracja komunikatów i parametrów**
   - **Komunikat systemowy:**
     - Przykład: "System: You are interacting with an intelligent assistant leveraging OpenRouter API."
   - **Komunikat użytkownika:**
     - Przykład: "User: What is the weather like today?"
   - **Response Format:**
     - Używanie predefiniowanego schematu JSON, jak pokazano wyżej.
   - **Nazwa modelu:**
     - Przykład: `gpt-3.5-turbo` lub inna, zgodnie z wymaganiami.
   - **Parametry modelu:**
     - Przykład: `{ "temperature": 0.7, "max_tokens": 150 }`

5. **Integracja z istniejącym systemem**
   - Włączenie serwisu w głównym komponencie komunikacji.
   - Aktualizacja konfiguracji aplikacji, w tym zmiennych środowiskowych. 