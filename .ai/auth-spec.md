## Specyfikacja systemu rejestracji, logowania i odzyskiwania hasła użytkowników

### 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

#### a) Ogólna koncepcja
- Interfejs użytkownika zostanie rozbudowany o mechanizmy autoryzacji, przy czym widoki oraz komponenty muszą obsługiwać dwa stany: **auth** (użytkownik zalogowany) oraz **non-auth** (użytkownik niezalogowany).
- Nowe elementy obejmą formularze rejestracji, logowania oraz odzyskiwania hasła, które będą dostępne jako osobne komponenty i strony. Ich integracja z istniejącą strukturą (Astro i React) zostanie wykonana w sposób spójny z obecnym designem (Tailwind, Shadcn/ui).

#### b) Zmiany w warstwie frontendu

1. **Strony Astro:**
   - `src/pages/add-recipe.astro`, `src/pages/preferences.astro`, `src/pages/recipes.astro`, `src/pages/index.astro` oraz `src/components/Welcome.astro`:
     - Dla widoków dostępnych tylko dla użytkowników zalogowanych ("Moje Przepisy", "Dodaj Przepis", "Preferencje") należy dodać mechanizm sprawdzający stan autentykacji. W przypadku braku sesji, widok powinien przekierować użytkownika do strony logowania lub wyświetlić stosowny komunikat.
     - Widok strony głównej (`index.astro`) oraz `Welcome.astro` zachowają swój charakter ogólnodostępny, ale mogą zawierać linki do logowania/rejestracji w nagłówku.

2. **Komponenty React (Client-side):**
   - `RecipeForm.tsx`:
     - Obecny komponent sprawdza stan sesji (np. brak identyfikatora użytkownika) i wyświetla komunikat: "Brak identyfikatora użytkownika. Zaloguj się ponownie.".
     - Dodatkowo, w przypadku próby modyfikacji przepisu przy użyciu AI, jeżeli preferencje żywieniowe użytkownika nie zostały uzupełnione, komponent wyświetla komunikat: "Twoje preferencje żywieniowe są niekompletne. Uzupełnij je, aby kontynuować.".
     - W przyszłości, po implementacji autentykacji, ten komponent może również dynamicznie pobierać dane sesji, aby wyświetlić odpowiednie akcje (np. zapis przepisu tylko dla zalogowanych).
   - `RecipeListContainer.tsx`:
     - Komponent odpowiadający za listę przepisów powinien dodatkowo uwzględniać logikę autoryzacji przy edycji lub usuwaniu przepisów (komunikaty o wygasłej sesji, komunikaty błędów itp.).
   - `PreferencesForm.tsx`:
     - Formularz konfiguracji preferencji musi odwoływać się do danych autoryzacji pobieranych z Supabase. Zależnie od stanu sesji wyświetla komunikaty błędów (np. "Sesja wygasła. Zaloguj się ponownie.") oraz umożliwia edycję tylko jeśli użytkownik jest zalogowany.
   - `NavigationMenuContainer.tsx` oraz `Layout.astro`:
     - Menu nawigacyjne musi dynamicznie wyświetlać linki ("Moje Przepisy", "Dodaj Przepis", "Preferencje") tylko dla zalogowanych użytkowników lub zastępować je komunikatami/wyświetlać opcje logowania i rejestracji w trybie non-auth.

#### c) Rozdzielenie odpowiedzialności
- Strony Astro odpowiadają za ogólną strukturę, layout oraz routing w aplikacji. Integracja logiki autoryzacji odbywa się za pomocą middleware (np. kontrola ciasteczek, sesji) oraz poprzez przekazywanie stanu do komponentów React.
- Komponenty React (np. `RecipeForm.tsx`, `RecipeListContainer.tsx`, `PreferencesForm.tsx`) są odpowiedzialne za interakcję z użytkownikiem (walidacja formularzy, wyświetlanie komunikatów, obsługa zdarzeń) oraz komunikację z backendem poprzez API.
- Walidacja danych odbywa się dwustopniowo: po stronie klienta (z wykorzystaniem Zod oraz React Hook Form) oraz po stronie serwera (w endpointach API, z użyciem Zod do walidacji danych wejściowych).

#### d) Walidacja i komunikaty błędów
- Komunikaty walidacyjne (np. brak wymaganych pól, niepoprawny format danych) będą wyświetlane bezpośrednio przy polach formularzy.
- Błędy związane z autentykacją (np. wygasła sesja, brak uprawnień, błąd logowania) będą wyświetlane jako alerty w widocznych miejscach interfejsu (np. na górze formularza lub w modalu).
- Najważniejsze scenariusze obejmują:
  - Próba ingerencji w operacje wymagające autentykacji przez użytkownika niezalogowanego (wyświetlenie alertu i/lub przekierowanie do logowania).
  - Wygasła sesja – komunikat o konieczności ponownego zalogowania.
  - Błędy walidacji danych podczas rejestracji i logowania – szczegółowe komunikaty (np. "Podany email jest nieprawidłowy", "Hasło musi zawierać co najmniej 8 znaków").

### 2. LOGIKA BACKENDOWA

#### a) Struktura endpointów API
- Nowe endpointy API zostaną dodane w katalogu `src/pages/api/auth`, obejmujące:
  - `register`: endpoint rejestracji (POST), przyjmujący dane użytkownika (email, hasło, opcjonalnie inne dane profilowe) i tworzący konto w Supabase Auth.
  - `login`: endpoint logowania (POST), przyjmujący dane logowania, sprawdzający poprawność danych i zwracający token/zasady sesji.
  - `logout`: endpoint wylogowania (POST lub DELETE), który kończy sesję użytkownika.
  - `recover`: endpoint odzyskiwania konta (POST), umożliwiający wysłanie linku do resetu hasła lub generowanie tymczasowego tokenu resetującego.

#### b) Modele danych i walidacja
- Dane wejściowe do powyższych endpointów będą walidowane za pomocą bibliotek takich jak Zod, np.:
  - Schemat rejestracji: email (wymagany, format email), hasło (wymagane, minimalna długość, złożoność), potwierdzenie hasła (zgodność z hasłem).
  - Schemat logowania: email i hasło.
  - Schemat odzyskiwania hasła: email.
- W przypadku niepoprawnych danych odpowiedzi serwera będą zawierały status błędu 400 (Bad Request) wraz z jasnymi komunikatami o przyczynie błędu.

#### c) Obsługa wyjątków
- Backend będzie opierać się na strukturze try/catch dla obsługi wyjątków. W przypadku błędów wewnętrznych serwera status odpowiedzi będzie 500, a komunikat odpowiednio logowany oraz przekazywany w przyjaznej formie do interfejsu użytkownika.
- Dla błędów autoryzacyjnych status 401 (Unauthorized) lub 403 (Forbidden) będą zwracane z odpowiednimi komunikatami.

#### d) Renderowanie stron server-side
- W związku z integracją z Astro, strony takie jak `add-recipe.astro`, `preferences.astro`, `recipes.astro` mogą być renderowane po stronie serwera. W konfiguracji Astro (`astro.config.mjs`) należy upewnić się, że ustawienie `export const prerender = false` jest stosowane tam, gdzie dynamiczna walidacja stanu sesji jest kluczowa.

### 3. SYSTEM AUTENTYKACJI

#### a) Wykorzystanie Supabase Auth
- System autentykacji będzie opierał się o Supabase Auth, który zapewnia out-of-the-box funkcjonalności rejestracji, logowania, wylogowywania oraz odzyskiwania hasła.
- Integracja z Supabase obejmie:
  - Konfigurację klienta Supabase zarówno w komponentach klientów (`src/db/supabase.client.ts`), jak i w logice backendowej (endpointy API).
  - Użycie metod takich jak `signUp`, `signIn`, `signOut` oraz `resetPassword` w odpowiednich formularzach.

#### b) Proces rejestracji, logowania i odzyskiwania konta
- **Rejestracja:**
  - Użytkownik wprowadza swoje dane w formularzu rejestracyjnym (email, hasło, potwierdzenie hasła). Dane są walidowane po obu stronach – klient i serwer.
  - Po udanej rejestracji Supabase zwraca informacje o sesji, które są przechowywane (np. ciasteczka, tokeny).
- **Logowanie:**
  - Formularz logowania umożliwia użytkownikowi wprowadzenie danych, które są weryfikowane za pomocą Supabase Auth. W przypadku błędnych danych wyświetlany jest komunikat błędu.
- **Wylogowanie:**
  - Użytkownik może zakończyć sesję poprzez kliknięcie odpowiedniej opcji w interfejsie (np. w menu nawigacyjnym). Metoda `signOut` kończy sesję i czyści dane autoryzacyjne.
- **Odzyskiwanie hasła:**
  - Formularz odzyskiwania konta umożliwia wprowadzenie adresu email, na który Supabase wyśle link do resetu hasła. Proces ten obsługuje również walidację i komunikaty błędów (np. "Podany email nie istnieje w systemie").

#### c) Integracja z Astro i middleware
- Middleware Astro może służyć do weryfikacji ciasteczek oraz sesji przy wejściu na strony chronione. W przypadku braku ważnej sesji następuje przekierowanie do strony logowania.
- Endpoints API związane z autentykacją oraz inne operacje wymagające autoryzacji korzystają z mechanizmu 'credentials: include' oraz obsługują tokeny autoryzacyjne.

### Kluczowe moduły, komponenty i kontrakty

- **Frontend:**
  - Komponenty: `RecipeForm.tsx`, `RecipeListContainer.tsx`, `PreferencesForm.tsx`, nowo utworzone formularze logowania/rejestracji/odzyskiwania hasła.
  - Widoki/strony Astro: `add-recipe.astro`, `preferences.astro`, `recipes.astro`, `index.astro`, `Welcome.astro`.
  - Layout i nawigacja: `Layout.astro`, `NavigationMenuContainer.tsx` – dynamiczne zarządzanie stanem auth w menu.
  - Walidacja: Zastosowanie Zod i React Hook Form po stronie klienta.

- **Backend:**
  - Endpointy API: Umieszczone w `src/pages/api/auth` (register, login, logout, recover) oraz aktualizacja istniejących endpointów (np. przepisy, preferencje) o kontrolę autoryzacji.
  - Walidacja: Zod stosowany do schematów walidacji danych wejściowych.
  - Obsługa błędów: Mechanizmy try/catch z odpowiednim logowaniem i zwracaniem statusów HTTP.

- **System autentykacji:**
  - Wykorzystanie Supabase Auth jako głównego mechanizmu zarządzania sesją.
  - Klient Supabase skonfigurowany w `src/db/supabase.client.ts`.
  - Middleware oraz integracja z Astro dla renderowania stron w trybie server-side.

### Podsumowanie

Przyjęta architektura modułu rejestracji, logowania i odzyskiwania hasła uwzględnia spójność z istniejącym systemem aplikacji HealthyMeal, w której używane są Astro, React, Tailwind i Shadcn/ui. System ten zapewni zarówno wysoki poziom bezpieczeństwa (poprzez walidację zarówno po stronie klienta, jak i serwera), jak i przyjazne doświadczenie użytkownika z dynamiczną nawigacją oraz czytelnymi komunikatami o błędach. Wdrożenie oparte na Supabase Auth umożliwi skalowanie i łatwą integrację z dodatkowymi funkcjonalnościami autoryzacyjnymi w przyszłości. 