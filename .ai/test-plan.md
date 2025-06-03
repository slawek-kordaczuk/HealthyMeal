# Plan Testów dla Projektu HealthyMeal

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument określa strategię, zakres, podejście oraz zasoby przeznaczone do przeprowadzenia testów aplikacji HealthyMeal. Projekt HealthyMeal wykorzystuje nowoczesny stos technologiczny oparty o Astro 5.5.5, React 19, TypeScript 5 (strict mode), Tailwind CSS 4.0.17, Shadcn/ui oraz Supabase 2.49.4 jako backend i OpenRouter.ai do integracji z modelami AI. Aplikacja wykorzystuje server-side rendering (SSR), React Hook Form z Zod do walidacji formularzy, oraz wiele innych nowoczesnych narzędzi deweloperskich. Celem planu jest zapewnienie wysokiej jakości produktu końcowego poprzez systematyczne wykrywanie i eliminowanie błędów na różnych etapach rozwoju aplikacji.

### 1.2. Cele Testowania

Główne cele procesu testowania to:

*   Weryfikacja, czy aplikacja spełnia zdefiniowane wymagania funkcjonalne i niefunkcjonalne.
*   Zapewnienie stabilności, niezawodności i wydajności aplikacji.
*   Wykrycie i zaraportowanie defektów w celu ich naprawy przed wdrożeniem.
*   Potwierdzenie, że interfejs użytkownika jest intuicyjny, spójny i zgodny z zasadami dostępności (a11y).
*   Ocena bezpieczeństwa aplikacji, w szczególności w kontekście autentykacji i ochrony danych.
*   Minimalizacja ryzyka związanego z wdrożeniem nowych funkcjonalności lub zmian w istniejących.
*   Dostarczenie informacji o jakości oprogramowania interesariuszom projektu.

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami

Testowaniu podlegać będą wszystkie kluczowe moduły i funkcjonalności aplikacji, w tym:

*   **Frontend (Astro + React):**
    *   Renderowanie stron i komponentów.
    *   Nawigacja między stronami.
    *   Interakcje użytkownika z komponentami React (formularze, przyciski, dynamiczne treści).
    *   Wyświetlanie danych pobieranych z API.
    *   Responsywność interfejsu na różnych urządzeniach.
    *   Dostępność (a11y).
    *   Walidacja formularzy po stronie klienta.
*   **Backend (API - Astro Endpoints, Supabase):**
    *   Endpointy API (`src/pages/api`):
        *   Autentykacja użytkowników (rejestracja, logowanie, wylogowywanie, zarządzanie sesją).
        *   Autoryzacja dostępu do zasobów.
        *   Operacje CRUD na danych (np. przepisy, plany żywieniowe, dane użytkownika).
        *   Integracja z Supabase (poprawność zapytań, obsługa odpowiedzi).
        *   Integracja z Openrouter.ai (komunikacja, obsługa odpowiedzi, zarządzanie kluczami).
        *   Walidacja danych wejściowych po stronie serwera.
        *   Obsługa błędów i zwracanie odpowiednich kodów statusu HTTP.
    *   Logika Middleware (`src/middleware/index.ts`):
        *   Ochrona tras.
        *   Przetwarzanie żądań/odpowiedzi.
*   **Baza Danych (Supabase/PostgreSQL):**
    *   Integralność danych.
    *   Poprawność schematu bazy danych i migracji.
    *   Reguły bezpieczeństwa na poziomie wierszy (RLS), jeśli zaimplementowane.
*   **Integracje:**
    *   Poprawna komunikacja i wymiana danych z Supabase.
    *   Poprawna komunikacja i wymiana danych z Openrouter.ai.

### 2.2. Funkcjonalności nieobjęte testami (jeśli dotyczy)

*   Testowanie wewnętrznej logiki i wydajności samej platformy Supabase (traktowane jako stabilna usługa zewnętrzna).
*   Testowanie wewnętrznej logiki i wydajności modeli AI dostarczanych przez Openrouter.ai (skupienie na integracji).
*   Dogłębne testy penetracyjne (mogą być przedmiotem osobnego zlecenia dla wyspecjalizowanej firmy).

## 3. Typy Testów do Przeprowadzenia

Zastosowane zostaną następujące typy testów:

*   **Testy Jednostkowe (Unit Tests):**
    *   **Cel:** Weryfikacja poprawności działania małych, izolowanych fragmentów kodu (funkcje, komponenty React, moduły w `src/lib`).
    *   **Narzędzia:** Vitest/Jest, React Testing Library.
    *   **Zakres:** Logika biznesowa, funkcje pomocnicze, renderowanie i logika komponentów React, funkcje dostępu do danych (z mockowaniem zależności).
*   **Testy Integracyjne (Integration Tests):**
    *   **Cel:** Weryfikacja współpracy między różnymi modułami i serwisami.
    *   **Narzędzia:** Vitest/Jest, Supertest (dla API), mocki dla zewnętrznych serwisów (np. MSW - Mock Service Worker).
    *   **Zakres:** Interakcja komponentów frontendowych z API, współpraca modułów backendowych, komunikacja z Supabase (z testową bazą danych lub mockowanym SDK), integracja z Openrouter.ai (z mockowanym API).
*   **Testy End-to-End (E2E Tests):**
    *   **Cel:** Weryfikacja kompletnych przepływów użytkownika w aplikacji, symulując rzeczywiste scenariusze użycia.
    *   **Narzędzia:** Playwright lub Cypress.
    *   **Zakres:** Rejestracja, logowanie, tworzenie/edycja/usuwanie danych, nawigacja, kluczowe ścieżki użytkownika.
*   **Testy API:**
    *   **Cel:** Bezpośrednie testowanie endpointów API pod kątem poprawności odpowiedzi, obsługi błędów, bezpieczeństwa i wydajności.
    *   **Narzędzia:** Postman/Insomnia (manualne), Supertest/axios w skryptach automatycznych (w ramach testów integracyjnych/E2E).
    *   **Zakres:** Wszystkie endpointy w `src/pages/api`.
*   **Testy Wydajnościowe (Performance Tests):**
    *   **Cel:** Ocena szybkości odpowiedzi aplikacji, czasu ładowania stron i zachowania pod obciążeniem.
    *   **Narzędzia:** Lighthouse, PageSpeed Insights, k6 (dla API).
    *   **Zakres:** Kluczowe strony, endpointy API generujące duże obciążenie.
*   **Testy Bezpieczeństwa (Security Tests):**
    *   **Cel:** Identyfikacja potencjalnych luk bezpieczeństwa.
    *   **Narzędzia:** OWASP ZAP (podstawowe skanowanie), manualna weryfikacja (np. podatności wg OWASP Top 10), lintery bezpieczeństwa.
    *   **Zakres:** Autentykacja, autoryzacja, walidacja danych wejściowych, ochrona przed XSS, CSRF.
*   **Testy Dostępności (Accessibility Tests - a11y):**
    *   **Cel:** Zapewnienie, że aplikacja jest użyteczna dla osób z niepełnosprawnościami.
    *   **Narzędzia:** Axe DevTools, Lighthouse.
    *   **Zakres:** Wszystkie strony i komponenty interaktywne.
*   **Testy Wizualnej Regresji (Visual Regression Tests):**
    *   **Cel:** Wykrywanie niezamierzonych zmian w wyglądzie interfejsu użytkownika.
    *   **Narzędzia:** Playwright (z integracją np. pixelmatch) lub dedykowane narzędzia jak Percy, Applitools.
    *   **Zakres:** Kluczowe strony i komponenty.
*   **Testy Akceptacyjne Użytkownika (UAT - User Acceptance Tests):**
    *   **Cel:** Potwierdzenie przez klienta/użytkowników końcowych, że aplikacja spełnia ich oczekiwania i potrzeby.
    *   **Forma:** Manualne testy przeprowadzane przez wyznaczonych użytkowników na podstawie przygotowanych scenariuszy.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

Poniżej przedstawiono przykładowe, ogólne scenariusze testowe. Szczegółowe przypadki testowe zostaną opracowane oddzielnie.

**4.1. Rejestracja i Logowanie Użytkownika:**

*   **Scenariusz 1:** Pomyślna rejestracja nowego użytkownika z poprawnymi danymi.
*   **Scenariusz 2:** Próba rejestracji z niepoprawnymi danymi (np. zły format emaila, za krótkie hasło).
*   **Scenariusz 3:** Próba rejestracji z już istniejącym adresem email.
*   **Scenariusz 4:** Pomyślne logowanie istniejącego użytkownika.
*   **Scenariusz 5:** Próba logowania z niepoprawnym hasłem/emailem.
*   **Scenariusz 6:** Funkcjonalność "Zapomniałem hasła" (jeśli zaimplementowana).
*   **Scenariusz 7:** Wylogowanie użytkownika.
*   **Scenariusz 8:** Ochrona tras wymagających zalogowania (próba dostępu bez logowania).

**4.2. Zarządzanie Przepisami (Przykładowa funkcjonalność CRUD):**

*   **Scenariusz 1:** Dodanie nowego przepisu z wszystkimi wymaganymi polami.
*   **Scenariusz 2:** Próba dodania przepisu z brakującymi wymaganymi polami.
*   **Scenariusz 3:** Wyświetlenie listy przepisów (paginacja, sortowanie, filtrowanie - jeśli dotyczy).
*   **Scenariusz 4:** Wyświetlenie szczegółów pojedynczego przepisu.
*   **Scenariusz 5:** Edycja istniejącego przepisu.
*   **Scenariusz 6:** Usunięcie przepisu.
*   **Scenariusz 7:** Weryfikacja uprawnień (np. tylko autor może edytować/usuwać swój przepis).

**4.3. Interakcja z Modelem AI (np. generowanie planu dietetycznego):**

*   **Scenariusz 1:** Pomyślne wysłanie zapytania do modelu AI z poprawnymi danymi wejściowymi.
*   **Scenariusz 2:** Poprawne przetworzenie i wyświetlenie odpowiedzi od modelu AI.
*   **Scenariusz 3:** Obsługa błędów komunikacji z API Openrouter.ai.
*   **Scenariusz 4:** Obsługa sytuacji, gdy model AI zwraca nieoczekiwaną odpowiedź lub błąd.
*   **Scenariusz 5:** Weryfikacja limitów użycia API (jeśli dotyczy).

**4.4. Responsywność i Dostępność Strony Głównej:**

*   **Scenariusz 1:** Poprawne wyświetlanie strony głównej na różnych rozdzielczościach (desktop, tablet, mobile).
*   **Scenariusz 2:** Możliwość nawigacji po stronie głównej przy użyciu klawiatury.
*   **Scenariusz 3:** Sprawdzenie kontrastu kolorów i czytelności tekstu.
*   **Scenariusz 4:** Weryfikacja atrybutów ARIA dla elementów interaktywnych.

**4.5. Walidacja Formularzy (React Hook Form + Zod):**

*   **Scenariusz 1:** Testowanie walidacji po stronie klienta z wykorzystaniem schematów Zod.
*   **Scenariusz 2:** Sprawdzenie wyświetlania komunikatów błędów walidacji.
*   **Scenariusz 3:** Testowanie komponentów formularzy Shadcn/ui z React Hook Form.
*   **Scenariusz 4:** Weryfikacja działania formularzy w trybie controlled/uncontrolled.

**4.6. Preferencje Użytkownika i Motywy (Next Themes):**

*   **Scenariusz 1:** Przełączanie między trybem jasnym i ciemnym.
*   **Scenariusz 2:** Zachowanie preferencji motywu po odświeżeniu strony.
*   **Scenariusz 3:** Dostępność przełącznika motywu w nawigacji.
*   **Scenariusz 4:** Poprawne renderowanie komponentów w obu motywach.

**4.7. Server-Side Rendering (SSR) i Middleware:**

*   **Scenariusz 1:** Testowanie ochrony tras przez middleware (`src/middleware/index.ts`).
*   **Scenariusz 2:** Weryfikacja poprawnego renderowania po stronie serwera.
*   **Scenariusz 3:** Testowanie hydratacji komponentów React po stronie klienta.
*   **Scenariusz 4:** Sprawdzenie działania sesji Supabase w kontekście SSR.

## 5. Środowisko Testowe

Zostaną przygotowane następujące środowiska:

*   **Środowisko Deweloperskie (Lokalne):**
    *   **Cel:** Testy jednostkowe, integracyjne, E2E przeprowadzane przez deweloperów podczas pracy.
    *   **Konfiguracja:** Lokalne instancje aplikacji, lokalna baza Supabase (Docker lub Supabase CLI), mockowane API Openrouter.ai.
*   **Środowisko Testowe/Staging:**
    *   **Cel:** Pełne testy integracyjne, E2E, akceptacyjne, wydajnościowe. Środowisko jak najbardziej zbliżone do produkcyjnego.
    *   **Konfiguracja:** Dedykowany serwer (np. DigitalOcean), oddzielna instancja Supabase (może być darmowy plan na początek), skonfigurowane klucze do Openrouter.ai (z limitami deweloperskimi/testowymi).
*   **Środowisko Produkcyjne:**
    *   **Cel:** Testy dymne (smoke tests) po wdrożeniu, monitoring.
    *   **Konfiguracja:** Infrastruktura produkcyjna.

## 6. Narzędzia do Testowania

### 6.1. Narzędzia Development i Quality Assurance (obecne w projekcie)

*   **Linters i Analiza Statyczna:**
    *   ESLint 9.23.0 z TypeScript ESLint 8.28.0
    *   Prettier 
    *   Husky + lint-staged (pre-commit hooks)
    *   TypeScript Compiler (`tsc --noEmit`) w trybie strict
*   **Frameworki do testów jednostkowych/integracyjnych:** Vitest (preferowany dla projektów Vite/Astro) lub Jest
*   **Biblioteka do testowania komponentów React:** React Testing Library
*   **Mockowanie:** Mock Service Worker (MSW), `vi.mock` (Vitest) / `jest.mock`

### 6.2. Narzędzia do różnych typów testów (do skonfigurowania)

*   **Frameworki do testów E2E:** Playwright (rekomendowany ze względu na wsparcie dla wielu przeglądarek i dobre API) lub Cypress
*   **Narzędzia do testowania API:**
    *   Manualne: Postman, Insomnia
    *   Automatyczne: Supertest (w Node.js), wbudowane możliwości Playwright/Cypress
*   **Testy Wydajności:** Google Lighthouse, PageSpeed Insights, k6 (dla API)
*   **Testy Dostępności:** Axe DevTools, Lighthouse
*   **Testy Wizualnej Regresji:** Playwright (z porównywaniem screenshotów), Percy, Applitools

### 6.3. Infrastruktura i CI/CD

*   **System CI/CD:** GitHub Actions (do automatycznego uruchamiania testów)
*   **Środowiska:** Node.js z adapterem @astrojs/node (standalone mode)
*   **Zarządzanie Testami i Błędami:** GitHub Issues (zintegrowane z projektem) lub Jira/Trello

### 6.4. Specjalne narzędzia dla stosu technologicznego

*   **Testowanie komponentów Shadcn/ui:** React Testing Library z customowymi renderami
*   **Testowanie React Hook Form:** Testing Library z symulacją interakcji formularzy
*   **Testowanie Zod schemas:** Unit testy walidacji schematów
*   **Testowanie Next Themes:** Testy przełączania motywów i localStorage
*   **Mockowanie Supabase:** Dedykowane mocki dla klienta Supabase
*   **Mockowanie OpenRouter API:** MSW lub dedykowane mocki dla wywołań AI

## 7. Harmonogram Testów

Testowanie będzie procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania (Agile/Scrum).

*   **Sprint 0 / Faza Inicjalna:**
    *   Konfiguracja środowisk testowych.
    *   Wybór i konfiguracja narzędzi testowych.
    *   Opracowanie wstępnej wersji planu testów i scenariuszy dla kluczowych funkcjonalności.
    *   Ustawienie CI/CD do uruchamiania testów jednostkowych i linterów.
*   **Podczas Każdego Sprintu:**
    *   **Planowanie Sprintu:** Identyfikacja funkcjonalności do przetestowania, estymacja pracochłonności testów.
    *   **Development:** Deweloperzy piszą testy jednostkowe i integracyjne dla tworzonych funkcjonalności.
    *   **W trakcie Sprintu:** Tester (lub deweloper w roli testera) tworzy i wykonuje testy dla nowych funkcjonalności (manualne, automatyzacja E2E). Testy regresji dla powiązanych obszarów.
    *   **Koniec Sprintu/Przed Demonstracją:** Pełne testy regresji (automatyczne), testy akceptacyjne dla ukończonych historyjek.
*   **Faza Stabilizacji / Przed Wydaniem Wersji:**
    *   Intensywne testy E2E.
    *   Testy wydajnościowe.
    *   Testy bezpieczeństwa (podstawowe).
    *   Testy dostępności.
    *   Pełne testy regresji na środowisku Staging.
    *   Testy akceptacyjne użytkownika (UAT).
*   **Po Wdrożeniu (Produkcja):**
    *   Testy dymne (smoke tests).
    *   Monitoring aplikacji.

Szczegółowy harmonogram będzie dostosowywany do planu wydań i postępów prac deweloperskich.

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (Rozpoczęcia Testów)

*   Dostępna dokumentacja wymagań/historyjek użytkownika.
*   Funkcjonalność/moduł został zaimplementowany i przekazany do testów.
*   Testy jednostkowe i podstawowe testy integracyjne napisane przez deweloperów przechodzą pomyślnie.
*   Środowisko testowe jest gotowe i stabilne.
*   Dane testowe są przygotowane.

### 8.2. Kryteria Wyjścia (Zakończenia Testów / Wydania)

*   Wszystkie zaplanowane przypadki testowe zostały wykonane.
*   Określony procent przypadków testowych zakończył się sukcesem (np. 100% dla krytycznych, 95% dla wysokiego priorytetu).
*   Wszystkie krytyczne i wysokiego priorytetu błędy zostały naprawione i retestowane pomyślnie.
*   Pozostałe błędy (średniego i niskiego priorytetu) są udokumentowane, przeanalizowane i zaakceptowane przez interesariuszy (mogą być odłożone do naprawy w kolejnych iteracjach).
*   Pokrycie kodu testami (code coverage) osiągnęło zdefiniowany poziom (np. >80% dla testów jednostkowych).
*   Testy wydajnościowe i bezpieczeństwa spełniają określone progi.
*   Pomyślnie zakończone testy akceptacyjne użytkownika (UAT).
*   Dokumentacja testowa jest zaktualizowana.

## 9. Role i Odpowiedzialności w Procesie Testowania

*   **Deweloperzy:**
    *   Tworzenie i utrzymanie testów jednostkowych.
    *   Tworzenie i utrzymanie testów integracyjnych dla swoich modułów.
    *   Naprawa błędów wykrytych podczas testów.
    *   Dbanie o jakość kodu (code reviews, lintery).
    *   Wsparcie w analizie i diagnozowaniu problemów.
*   **Inżynier QA / Tester (jeśli dedykowana rola):**
    *   Tworzenie i utrzymanie planu testów.
    *   Projektowanie i utrzymanie przypadków testowych (manualnych i automatycznych E2E).
    *   Wykonywanie testów manualnych i automatycznych.
    *   Raportowanie i śledzenie błędów.
    *   Przygotowanie danych testowych.
    *   Konfiguracja i utrzymanie środowisk testowych (we współpracy z DevOps/deweloperami).
    *   Przeprowadzanie testów regresji, wydajnościowych, bezpieczeństwa, dostępności.
    *   Koordynacja UAT.
    *   Dostarczanie raportów o stanie jakości.
*   **Product Owner / Manager Projektu:**
    *   Definiowanie wymagań i kryteriów akceptacji.
    *   Priorytetyzacja błędów.
    *   Uczestnictwo w UAT.
    *   Podejmowanie decyzji o wydaniu produktu na podstawie wyników testów.
*   **Użytkownicy Końcowi / Interesariusze:**
    *   Uczestnictwo w testach akceptacyjnych użytkownika (UAT).
    *   Dostarczanie informacji zwrotnej.

W przypadku braku dedykowanego testera, obowiązki te mogą być rozdzielone między deweloperów i Product Ownera.

## 10. Procedury Raportowania Błędów

Wszystkie wykryte błędy będą raportowane i śledzone przy użyciu wybranego narzędzia (np. GitHub Issues, Jira, Trello).

**Każdy raport o błędzie powinien zawierać co najmniej:**

1.  **ID Błędu:** Unikalny identyfikator.
2.  **Tytuł:** Zwięzły opis problemu.
3.  **Opis:**
    *   Kroki do odtworzenia błędu (szczegółowe i jednoznaczne).
    *   Oczekiwany rezultat.
    *   Rzeczywisty rezultat.
4.  **Środowisko:** Wersja aplikacji, przeglądarka (wersja), system operacyjny, urządzenie, na którym błąd wystąpił.
5.  **Priorytet:** (np. Krytyczny, Wysoki, Średni, Niski) - określający wpływ błędu na działanie aplikacji i pilność naprawy.
    *   **Krytyczny:** Blokuje kluczowe funkcjonalności, uniemożliwia dalsze testy, powoduje utratę danych.
    *   **Wysoki:** Poważnie utrudnia korzystanie z kluczowych funkcjonalności, brak obejścia.
    *   **Średni:** Powoduje nieprawidłowe działanie mniej istotnych funkcji, istnieje obejście.
    *   **Niski:** Drobny błąd kosmetyczny, literówka, nie wpływa na funkcjonalność.
6.  **Stopień Ważności (Severity):** (np. Krytyczny, Poważny, Drobny, Trywialny) - określający techniczny wpływ błędu na system.
7.  **Załączniki:** Zrzuty ekranu, logi, nagrania wideo (jeśli pomocne).
8.  **Osoba Raportująca:** Kto zgłosił błąd.
9.  **Data Zgłoszenia:** Kiedy błąd został zgłoszony.
10. **Przypisany do:** Deweloper odpowiedzialny za naprawę.
11. **Status:** (np. Nowy, Otwarty, W Trakcie Naprawy, Do Retestu, Zamknięty, Odrzucony, Odłożony).

**Cykl życia błędu:**

1.  **Zgłoszenie:** Tester/użytkownik zgłasza błąd.
2.  **Analiza:** Product Owner/Lead Developer analizuje błąd, ustala priorytet i przypisuje do dewelopera.
3.  **Naprawa:** Deweloper naprawia błąd.
4.  **Retest:** Tester weryfikuje, czy błąd został poprawnie naprawiony na środowisku testowym.
5.  **Zamknięcie:** Jeśli błąd został naprawiony, status zmienia się na "Zamknięty". Jeśli nie, wraca do dewelopera z odpowiednim komentarzem.

Regularne spotkania zespołu będą okazją do przeglądu statusu błędów i priorytetyzacji prac naprawczych.
