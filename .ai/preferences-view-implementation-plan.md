# Plan implementacji widoku Konfiguracja Preferencji

## 1. Przegląd
Widok Konfiguracji Preferencji umożliwia użytkownikom aplikacji HealthyMeal definiowanie i edytowanie swoich indywidualnych preferencji żywieniowych. Te preferencje są kluczowe dla funkcji modyfikacji przepisów przez AI, pozwalając na dostosowanie przepisów do potrzeb dietetycznych, alergii, nietolerancji pokarmowych i innych kryteriów użytkownika. Widok składa się z formularza, który po wypełnieniu i zapisaniu, aktualizuje dane użytkownika w systemie.

## 2. Routing widoku
Widok powinien być dostępny pod następującą ścieżką:
- `/preferences`

## 3. Struktura komponentów
```
/preferences (PreferencesPage.astro) - Strona Astro hostująca komponent React
    └── MainLayout (Astro Layout) - Główny layout aplikacji
        └── PreferencesForm (React Client Component - src/components/PreferencesForm.tsx) - Główny formularz
            ├── Shadcn/ui Form (z react-hook-form)
            │   ├── FormField (dla diet_type: np. Select/Input)
            │   ├── FormField (dla daily_calorie_requirement: Input type number)
            │   ├── FormField (dla allergies: Textarea/Input)
            │   ├── FormField (dla food_intolerances: Textarea/Input)
            │   ├── FormField (dla preferred_cuisines: Textarea/Input)
            │   ├── FormField (dla excluded_ingredients: Textarea/Input)
            │   ├── FormField (dla macro_distribution_protein: Input type number)
            │   ├── FormField (dla macro_distribution_fats: Input type number)
            │   ├── FormField (dla macro_distribution_carbohydrates: Input type number)
            │   └── Shadcn/ui Button (Submit) - Przycisk do zapisu formularza
            └── NotificationArea (React Fragment/Component) - Obszar na komunikaty (ładowanie, błędy, sukces)
```
Komponent `PreferencesStatusIndicator` (React Client Component - `src/components/PreferencesStatusIndicator.tsx`) będzie używany w innych częściach aplikacji (np. przy modyfikacji przepisu lub w globalnym layout'cie) do informowania o braku skonfigurowanych preferencji i linkowania do `/preferences`.

## 4. Szczegóły komponentów

### `PreferencesPage.astro`
- **Opis komponentu**: Główny plik strony Astro dla ścieżki `/preferences`. Odpowiedzialny za renderowanie layoutu i osadzenie klienckiego komponentu React `PreferencesForm`. Może przekazywać początkowe dane (np. `userId`, jeśli dostępne serwerowo) do komponentu React.
- **Główne elementy**: `<MainLayout>`, `<PreferencesForm client:load />`.
- **Obsługiwane interakcje**: Nawigacja na stronę.
- **Obsługiwana walidacja**: Brak na tym poziomie.
- **Typy**: Brak specyficznych DTO/ViewModel.
- **Propsy**: Potencjalnie `userId: string`, `initialPreferences: PreferencesDTO | null` (jeśli dane są pobierane po stronie serwera Astro).

### `PreferencesForm.tsx`
- **Opis komponentu**: Interaktywny formularz React (używajacy `react-hook-form` i Zod do walidacji) pozwalający użytkownikowi na wprowadzenie i zapisanie swoich preferencji żywieniowych. Komponent będzie pobierał istniejące preferencje przy załadowaniu i wysyłał zaktualizowane dane do API.
- **Główne elementy**:
    - `Form` (z `shadcn/ui`, zintegrowany z `react-hook-form`)
    - `FormField` dla każdego pola preferencji:
        - `diet_type`: `Input` lub `Select` (z `shadcn/ui`)
        - `daily_calorie_requirement`: `Input` typu `number` (z `shadcn/ui`)
        - `allergies`: `Textarea` lub `Input` (z `shadcn/ui`)
        - `food_intolerances`: `Textarea` lub `Input` (z `shadcn/ui`)
        - `preferred_cuisines`: `Textarea` lub `Input` (z `shadcn/ui`)
        - `excluded_ingredients`: `Textarea` lub `Input` (z `shadcn/ui`)
        - `macro_distribution_protein`: `Input` typu `number` (z `shadcn/ui`)
        - `macro_distribution_fats`: `Input` typu `number` (z `shadcn/ui`)
        - `macro_distribution_carbohydrates`: `Input` typu `number` (z `shadcn/ui`)
    - `Button` (z `shadcn/ui`) do wysłania formularza.
    - Elementy do wyświetlania stanu ładowania oraz komunikatów o sukcesie lub błędzie (np. `Alert` z `shadcn/ui`).
- **Obsługiwane interakcje**:
    - Wprowadzanie danych w polach formularza.
    - Kliknięcie przycisku "Zapisz".
- **Obsługiwana walidacja** (za pomocą Zod schemy z `react-hook-form`):
    - `userId`: Wymagany (ukryte pole, pobierane z kontekstu użytkownika).
    - `diet_type`: `string | null`.
    - `daily_calorie_requirement`: `number | null`. Jeśli podane, musi być liczbą dodatnią.
    - `allergies`: `string | null`.
    - `food_intolerances`: `string | null`.
    - `preferred_cuisines`: `string | null`.
    - `excluded_ingredients`: `string | null`.
    - `macro_distribution_protein`: `number | null`. Jeśli podane, wartość między 0 a 100.
    - `macro_distribution_fats`: `number | null`. Jeśli podane, wartość między 0 a 100.
    - `macro_distribution_carbohydrates`: `number | null`. Jeśli podane, wartość między 0 a 100.
    - Opcjonalna walidacja: Suma wartości pól makroskładników (białko, tłuszcze, węglowodany) powinna wynosić 100, jeśli wszystkie są podane. Może być wyświetlone ostrzeżenie.
- **Typy**:
    - `PreferencesDTO` (do typowania danych formularza i odpowiedzi API).
    - `PreferencesCommandDTO` (do typowania danych wysyłanych do API).
    - Zod schema dla walidacji formularza.
- **Propsy**:
    - `userId: string` (ID zalogowanego użytkownika, wymagane do wysłania żądania POST).
    - `initialPreferences?: PreferencesDTO | null` (opcjonalne, jeśli dane są przekazywane z komponentu Astro).

### `PreferencesStatusIndicator.tsx`
- **Opis komponentu**: Mały komponent React wyświetlający status konfiguracji preferencji użytkownika. Jeśli preferencje nie są ustawione, wyświetla komunikat i link do strony `/preferences`.
- **Główne elementy**: Tekst, link (`<a>` lub komponent `Link` z Astro/React Router jeśli dotyczy). Może używać `Alert` z `shadcn/ui` do wyróżnienia.
- **Obsługiwane interakcje**: Kliknięcie linku nawigującego do `/preferences`.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak specyficznych DTO.
- **Propsy**:
    - `arePreferencesSet: boolean` (informacja, czy preferencje są ustawione).
    - `className?: string` (opcjonalne klasy Tailwind).

## 5. Typy
Główne typy danych są już zdefiniowane w `src/types/types.ts`.

- **`PreferencesDTO`**: Używany do reprezentowania danych preferencji pobieranych z API i jako podstawa dla stanu formularza.
  ```typescript
  export interface PreferencesDTO {
    id: number;
    userId: string; // mapowane z pola "user_id" w bazie danych
    diet_type: string | null;
    daily_calorie_requirement: number | null;
    allergies: string | null;
    food_intolerances: string | null;
    preferred_cuisines: string | null;
    excluded_ingredients: string | null;
    macro_distribution_protein: number | null;
    macro_distribution_fats: number | null;
    macro_distribution_carbohydrates: number | null;
  }
  ```

- **`PreferencesCommandDTO`**: Używany jako payload dla żądania `POST /api/preferences`.
  ```typescript
  export type PreferencesCommandDTO = Omit<PreferencesDTO, "id"> & { id?: number };
  ```

- **ViewModel dla formularza (Zod Schema)**:
  Definiowany przy użyciu Zod do walidacji i typowania w `react-hook-form`. Pola będą odpowiadać `PreferencesDTO`, z uwzględnieniem, że wartości z inputów mogą być początkowo stringami i wymagać konwersji/przetworzenia.
  Przykład fragmentu schemy Zod:
  ```typescript
  import { z } from "zod";

  const preferencesFormSchema = z.object({
    id: z.number().optional(),
    userId: z.string().min(1, "User ID is required"), // Zazwyczaj nieedytowalne, ustawiane programowo
    diet_type: z.string().nullable().optional(),
    daily_calorie_requirement: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
      z.number().positive("Must be a positive number").nullable().optional()
    ),
    allergies: z.string().nullable().optional(),
    food_intolerances: z.string().nullable().optional(),
    preferred_cuisines: z.string().nullable().optional(),
    excluded_ingredients: z.string().nullable().optional(),
    macro_distribution_protein: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
      z.number().min(0).max(100).nullable().optional()
    ),
    macro_distribution_fats: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
      z.number().min(0).max(100).nullable().optional()
    ),
    macro_distribution_carbohydrates: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
      z.number().min(0).max(100).nullable().optional()
    ),
  }).refine(data => { // Opcjonalna walidacja sumy makroskładników
    const { macro_distribution_protein, macro_distribution_fats, macro_distribution_carbohydrates } = data;
    if (macro_distribution_protein !== null && macro_distribution_fats !== null && macro_distribution_carbohydrates !== null) {
      return macro_distribution_protein + macro_distribution_fats + macro_distribution_carbohydrates === 100;
    }
    return true;
  }, {
    message: "Suma procentowa makroskładników (białko, tłuszcze, węglowodany) powinna wynosić 100%, jeśli wszystkie są podane.",
    path: ["macro_distribution_protein"], // Ścieżka do pierwszego pola makro, aby tam pojawił się błąd
  });

  export type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;
  ```

## 6. Zarządzanie stanem
- **Stan formularza**: Zarządzany przez `react-hook-form` w komponencie `PreferencesForm.tsx`. Obejmuje to wartości pól, stan walidacji i stan wysyłania.
- **Stan ładowania i błędów API**:
    - `isLoading: boolean`: Wskazuje, czy trwa operacja API (pobieranie lub wysyłanie preferencji).
    - `error: string | null`: Przechowuje komunikaty o błędach z API.
    - `successMessage: string | null`: Przechowuje komunikaty o powodzeniu operacji.
    Te stany będą zarządzane lokalnie w `PreferencesForm.tsx` za pomocą `useState`.
- **Dane użytkownika (w tym `userId` i `preferencesId`)**:
    - `userId`: Powinien być dostępny globalnie po zalogowaniu, np. poprzez React Context API (`UserContext`) lub dedykowany hook `useUser()`.
    - `preferencesId: number | undefined`: ID istniejących preferencji, pobierane z `GET /api/preferences` i przechowywane w stanie komponentu `PreferencesForm.tsx`.
- **Custom Hook `usePreferences` (opcjonalnie)**:
  Można stworzyć hook `usePreferences` do enkapsulacji logiki pobierania (GET) i zapisywania (POST) preferencji, zarządzania stanami ładowania/błędów oraz integracji z globalnym stanem użytkownika (np. do aktualizacji flagi `arePreferencesSet`).

## 7. Integracja API
Integracja z API `/api/preferences` będzie realizowana w komponencie `PreferencesForm.tsx`.

- **Pobieranie preferencji (GET `/api/preferences`)**:
    - **Kiedy**: Przy pierwszym renderowaniu komponentu `PreferencesForm`.
    - **Żądanie**: `GET` na `/api/preferences`. Wymaga autoryzacji (przesyłanej przez mechanizm sesji/ciasteczek).
    - **Odpowiedź**:
        - `200 OK`: Zawiera `PreferencesDTO`. Dane są używane do wypełnienia formularza. Zapisywane jest `id` preferencji.
        - `404 Not Found`: Użytkownik nie ma jeszcze zapisanych preferencji. Formularz pozostaje pusty (lub z wartościami domyślnymi).
        - `401 Unauthorized`: Użytkownik nie jest zalogowany. Należy obsłużyć np. przez redirect do logowania.
- **Zapisywanie preferencji (POST `/api/preferences`)**:
    - **Kiedy**: Po pomyślnej walidacji i wysłaniu formularza.
    - **Żądanie**: `POST` na `/api/preferences`.
        - **Payload**: `PreferencesCommandDTO`. Musi zawierać `userId` zalogowanego użytkownika. Jeśli aktualizujemy istniejące preferencje, payload będzie również zawierał `id`.
        ```json
        // Przykład (tworzenie nowych):
        {
          "userId": "aktualny-user-id",
          "diet_type": "vegan",
          "daily_calorie_requirement": 2000,
          // ... reszta pól, null jeśli puste
        }
        // Przykład (aktualizacja):
        {
          "id": 123, // ID istniejących preferencji
          "userId": "aktualny-user-id",
          "diet_type": "vegetarian",
          // ... reszta pól
        }
        ```
    - **Odpowiedź**:
        - `200 OK` (lub `201 Created`): Zawiera zapisane/zaktualizowane `PreferencesDTO`. Wyświetlany jest komunikat o sukcesie. `id` preferencji jest aktualizowane w stanie.
        - `400 Bad Request`: Błędy walidacji po stronie serwera. Wyświetlane są odpowiednie komunikaty.
        - `401 Unauthorized`: Użytkownik nie jest zalogowany.
        - `403 Forbidden`: `userId` w payloadzie nie zgadza się z `userId` sesji. Jest to błąd logiki frontendu.
        - `500 Internal Server Error`: Ogólny błąd serwera.

## 8. Interakcje użytkownika
- **Wejście na stronę `/preferences`**:
    - System próbuje załadować istniejące preferencje użytkownika.
    - Jeśli istnieją, formularz jest nimi wypełniany.
    - Jeśli nie istnieją, formularz jest pusty lub ma wartości domyślne.
- **Wypełnianie/modyfikacja formularza**:
    - Użytkownik wprowadza dane w poszczególne pola.
    - Walidacja inline (np. dla formatu liczb, zakresów) może dostarczać natychmiastowego feedbacku (realizowane przez `react-hook-form` i Zod).
- **Kliknięcie "Zapisz"**:
    1. Uruchamiana jest walidacja całego formularza.
    2. Jeśli są błędy walidacyjne, są one wyświetlane pod odpowiednich polach, a wysyłanie jest blokowane.
    3. Jeśli walidacja przejdzie pomyślnie:
        - Wyświetlany jest wskaźnik ładowania.
        - Wysyłane jest żądanie `POST /api/preferences` z danymi formularza.
        - Po otrzymaniu odpowiedzi:
            - Sukces: Wskaźnik ładowania jest ukrywany, wyświetlany jest komunikat o sukcesie. Formularz może pozostać wypełniony zaktualizowanymi danymi.
            - Błąd: Wskaźnik ładowania jest ukrywany, wyświetlany jest komunikat o błędzie.

## 9. Warunki i walidacja
Warunki walidacji są szczegółowo opisane w sekcji "Szczegóły komponentów" (`PreferencesForm.tsx`) oraz "Typy" (Zod schema). Kluczowe punkty:
- Pola liczbowe (`daily_calorie_requirement`, makroskładniki) powinny być dodatnie (lub w zakresie 0-100 dla makro). Konwersja z pustego stringa na `null` jest istotna.
- `userId` jest wymagane i musi być poprawne.
- Opcjonalna walidacja sumy makroskładników do 100%.
- Walidacja jest realizowana na froncie przy użyciu Zod i `react-hook-form` przed wysłaniem żądania do API.
- Komunikaty o błędach walidacji są wyświetlane przy odpowiednich polach formularza.
- Stan interfejsu (np. możliwość kliknięcia przycisku "Zapisz", wyświetlanie komunikatów) zależy od wyniku walidacji i stanu komunikacji z API.

## 10. Obsługa błędów
- **Brak autoryzacji (401)**: Przekierowanie na stronę logowania lub wyświetlenie komunikatu o konieczności zalogowania.
- **Preferencje nie znalezione (404 dla GET)**: Traktowane jako normalny przypadek dla nowego użytkownika; formularz jest pusty.
- **Błąd walidacji po stronie serwera (400 dla POST)**: Wyświetlenie komunikatu o błędzie. Idealnie, walidacja front-end powinna minimalizować te przypadki.
- **Błąd uprawnień (403 dla POST)**: Wskazuje na problem z logiką aplikacji po stronie klienta (niepoprawny `userId`). Powinien być zalogowany jako błąd systemowy, a użytkownikowi wyświetlony ogólny komunikat błędu.
- **Błędy serwera (500)**: Wyświetlenie ogólnego komunikatu "Wystąpił błąd. Spróbuj ponownie później."
- **Błędy sieciowe**: Wyświetlenie komunikatu o problemie z połączeniem.
- Komunikaty o błędach powinny być przyjazne dla użytkownika i wyświetlane w dedykowanym miejscu w formularzu (np. komponent `Alert` z Shadcn/ui).

## 11. Kroki implementacji
1.  **Przygotowanie środowiska**:
    *   Upewnić się, że projekt Astro z React i TypeScript jest poprawnie skonfigurowany.
    *   Zainstalować zależności, jeśli jeszcze nie są: `react-hook-form`, `zod`, `@hookform/resolvers`. Shadcn/ui powinno być już skonfigurowane.
2.  **Utworzenie strony Astro (`PreferencesPage.astro`)**:
    *   Stworzyć plik `src/pages/preferences.astro`.
    *   Dodać podstawowy layout i zaimportować (z `client:load` lub `client:visible`) komponent `PreferencesForm.tsx`.
    *   Rozważyć, czy konieczne jest pobieranie `userId` lub `initialPreferences` po stronie serwera Astro i przekazywanie ich jako propsy. Alternatywnie, `PreferencesForm` może sam pobrać `userId` z kontekstu i `initialPreferences` przez API call.
3.  **Stworzenie komponentu `PreferencesForm.tsx`**:
    *   Stworzyć plik `src/components/PreferencesForm.tsx`.
    *   Zaimplementować logikę pobierania `userId` (np. z globalnego kontekstu użytkownika).
    *   Zdefiniować schemę walidacji Zod (`preferencesFormSchema`).
    *   Użyć hooka `useForm` z `react-hook-form` i resolvera Zod.
    *   Zbudować strukturę formularza używając komponentów `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` z Shadcn/ui oraz odpowiednich inputów (`Input`, `Select`, `Textarea`).
4.  **Implementacja logiki API w `PreferencesForm.tsx`**:
    *   Funkcja do pobierania preferencji (`fetchPreferences`): Wywołuje `GET /api/preferences` przy montowaniu komponentu. Wypełnia formularz danymi lub ustawia `preferencesId`.
    *   Funkcja do zapisu preferencji (`onSubmit`): Wywoływana po wysłaniu formularza. Konstruuje `PreferencesCommandDTO` (z `userId` i opcjonalnym `id`). Wywołuje `POST /api/preferences`.
    *   Obsługa stanów ładowania (`isLoading`) oraz komunikatów o sukcesie/błędzie.
5.  **Stworzenie komponentu `PreferencesStatusIndicator.tsx` (jeśli potrzebny od razu)**:
    *   Stworzyć plik `src/components/PreferencesStatusIndicator.tsx`.
    *   Przyjmuje prop `arePreferencesSet: boolean`.
    *   Wyświetla odpowiedni komunikat i link do `/preferences` jeśli `arePreferencesSet` jest `false`.
    *   Logika determining `arePreferencesSet` (np. z globalnego stanu lub przez API call) musi być zaimplementowana tam, gdzie ten komponent będzie używany.
6.  **Styling**:
    *   Użyć Tailwind CSS do dostosowania wyglądu, jeśli standardowe style Shadcn/ui nie są wystarczające.
    *   Zapewnić responsywność formularza.
7.  **Testowanie**:
    *   Testowanie ręczne:
        *   Przypadek nowego użytkownika (brak preferencji).
        *   Przypadek użytkownika z istniejącymi preferencjami (edycja).
        *   Walidacja pól (puste, niepoprawne wartości, zakresy).
        *   Poprawność wysyłania danych i odpowiedzi API.
        *   Obsługa błędów API.
        *   Responsywność.
8.  **Integracja `PreferencesStatusIndicator`**:
    *   Zintegrować `PreferencesStatusIndicator` w odpowiednich miejscach aplikacji (np. w layout'cie, na stronach gdzie preferencje są kluczowe, jak modyfikacja przepisu).
    *   Zapewnić, że stan `arePreferencesSet` jest poprawnie przekazywany lub pobierany.