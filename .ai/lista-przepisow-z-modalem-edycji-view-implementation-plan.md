# Plan implementacji widoku: Lista przepisów z modalem edycji

## 1. Przegląd
Widok "Lista przepisów z modalem edycji" ma na celu umożliwienie użytkownikom przeglądania, wyszukiwania, filtrowania, edytowania (ręcznego lub z pomocą AI) oraz usuwania swoich przepisów kulinarnych. Jest to kluczowy element aplikacji HealthyMeal, pozwalający na zarządzanie przepisami i dostosowywanie ich do indywidualnych potrzeb.

## 2. Routing widoku
- **Ścieżka:** `/recipes`
- Strona będzie dostępna po zalogowaniu użytkownika.

## 3. Struktura komponentów
Widok będzie zaimplementowany jako strona Astro (`RecipesPage.astro`) zawierająca główny kontener React (`RecipeListContainer.tsx`).

```
/recipes (RecipesPage.astro)
  └── RecipeListContainer (React)
      ├── RecipeFilterControls (React) // Opcjonalne, jeśli filtry będą rozbudowane
      ├── RecipeSearchInput (React)
      ├── RecipeTable (lub RecipeCardList) (React)
      │   └── RecipeRow (lub RecipeCard) (React) [* wiele]
      │       ├── Przycisk "Edytuj"
      │       ├── Przycisk "Usuń"
      ├── RecipePagination (React)
      ├── EditRecipeModal (React)
      │   ├── Zakładka "Edycja ręczna"
      │   │   └── ManualEditForm (React)
      │   ├── Zakładka "Modyfikacja AI"
      │   │   └── AiModificationView (React)
      │   │       └── MissingPreferencesNotification (React) [renderowany warunkowo]
      └── ConfirmDeleteModal (React)
```
Komponenty UI będą bazować na bibliotece Shadcn/ui.

## 4. Szczegóły komponentów

### `RecipesPage.astro`
- **Opis komponentu:** Główny plik strony Astro dla ścieżki `/recipes`. Odpowiedzialny za renderowanie kontenera React i przekazanie początkowych danych, jeśli to konieczne (np. informacji o sesji).
- **Główne elementy:** Wrapper dla `RecipeListContainer`.
- **Obsługiwane interakcje:** Brak bezpośrednich.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak specyficznych.
- **Propsy:** Brak.

### `RecipeListContainer.tsx` (React)
- **Opis komponentu:** Główny kontener React zarządzający stanem listy przepisów, logiką pobierania danych, filtrowaniem, wyszukiwaniem, paginacją oraz interakcjami z modalami edycji i usuwania.
- **Główne elementy:** Wykorzystuje `RecipeSearchInput`, `RecipeTable`, `RecipePagination`, `EditRecipeModal`, `ConfirmDeleteModal`. Może zawierać `RecipeFilterControls`.
- **Obsługiwane interakcje:** Zmiana zapytania wyszukiwania, zmiana strony paginacji, kliknięcie przycisku "Edytuj" na przepisie, kliknięcie przycisku "Usuń" na przepisie.
- **Obsługiwana walidacja:** Wyszukiwanie (np. minimalna długość zapytania, jeśli zaimplementowane).
- **Typy:** `RecipeDTO[]`, `GetRecipesQuery`, `PaginationMetadata`.
- **Propsy:** Brak (jest komponentem najwyższego poziomu w części React).

### `RecipeSearchInput.tsx` (React)
- **Opis komponentu:** Pole tekstowe do wyszukiwania przepisów po nazwie.
- **Główne elementy:** `Input` z Shadcn/ui.
- **Obsługiwane interakcje:** Wprowadzanie tekstu przez użytkownika.
- **Obsługiwana walidacja:** Opcjonalnie (np. minimalna/maksymalna długość zapytania).
- **Typy:** `string` (wartość wyszukiwania).
- **Propsy:**
    - `searchQuery: string`
    - `onSearchQueryChange: (query: string) => void`
    - `placeholder?: string`

### `RecipeTable.tsx` (lub `RecipeCardList.tsx`) (React)
- **Opis komponentu:** Wyświetla listę przepisów w formie tabeli lub siatki kart. Każdy element listy zawiera podstawowe informacje o przepisie i przyciski akcji.
- **Główne elementy:** Tabela (`Table` z Shadcn/ui) lub kontenery dla kart. Zawiera instancje `RecipeRow` lub `RecipeCard`.
- **Obsługiwane interakcje:** Brak bezpośrednich (delegowane do `RecipeRow`/`RecipeCard`).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `RecipeDTO[]`.
- **Propsy:**
    - `recipes: RecipeDTO[]`
    - `onEditRecipe: (recipe: RecipeDTO) => void`
    - `onDeleteRecipe: (recipe: RecipeDTO) => void`

### `RecipeRow.tsx` (lub `RecipeCard.tsx`) (React)
- **Opis komponentu:** Reprezentuje pojedynczy przepis na liście. Wyświetla jego nazwę, ocenę, źródło oraz przyciski "Edytuj" i "Usuń".
- **Główne elementy:** Komórki tabeli (`TableCell`) lub elementy karty (`Card` z Shadcn/ui), `Button` z Shadcn/ui.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Edytuj", kliknięcie przycisku "Usuń".
- **Obsługiwana walidacja:** Brak.
- **Typy:** `RecipeDTO`.
- **Propsy:**
    - `recipe: RecipeDTO`
    - `onEdit: (recipe: RecipeDTO) => void`
    - `onDelete: (recipe: RecipeDTO) => void`

### `RecipePagination.tsx` (React)
- **Opis komponentu:** Komponent do obsługi paginacji listy przepisów.
- **Główne elementy:** Przyciski "Następna strona", "Poprzednia strona", numery stron (komponent `Pagination` z Shadcn/ui).
- **Obsługiwane interakcje:** Kliknięcie przycisków paginacji.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `PaginationMetadata`.
- **Propsy:**
    - `paginationData: PaginationMetadata`
    - `onPageChange: (page: number) => void`

### `EditRecipeModal.tsx` (React)
- **Opis komponentu:** Modal do edycji przepisu. Umożliwia przełączanie między edycją ręczną a modyfikacją przez AI. Wykorzystuje komponent `Dialog` oraz `Tabs` z Shadcn/ui.
- **Główne elementy:**
    - Zakładka "Edycja ręczna": Formularz z polami `name` (Input), `rating` (Input type number/Slider), `recipe` (Textarea).
    - Zakładka "Modyfikacja AI": Wyświetlenie oryginalnego tekstu przepisu, przycisk "Generuj modyfikację AI", miejsce na wyświetlenie sugestii AI, przyciski "Zatwierdź" / "Odrzuć". Warunkowo wyświetla `MissingPreferencesNotification`.
- **Obsługiwane interakcje:**
    - Przełączanie zakładek (manual/AI).
    - Wprowadzanie danych w formularzu edycji ręcznej.
    - Kliknięcie "Zapisz" (edycja ręczna).
    - Kliknięcie "Generuj modyfikację AI".
    - Kliknięcie "Zatwierdź" (sugestia AI).
    - Kliknięcie "Odrzuć" (sugestia AI).
    - Zamknięcie modala.
- **Obsługiwana walidacja:**
    - **Edycja ręczna:**
        - `name`: wymagane, string, min 1, max 255 znaków.
        - `rating`: opcjonalne, liczba, min 1, max 10.
        - `recipe` (zawartość tekstowa): Jeśli `RecipeDTO.recipe` to `Json` w formie `{ "content": "text" }`, walidacja `content` (np. min/max długość).
    - **Modyfikacja AI:**
        - `recipe_text` (tekst istniejącego przepisu do wysłania do `/api/recipes/modify`): string, min 100, max 10000 znaków.
- **Typy:** `RecipeDTO` (edytowany przepis), `EditRecipeFormViewModel`, `AiModificationStateViewModel`.
- **Propsy:**
    - `isOpen: boolean`
    - `recipeToEdit: RecipeDTO | null`
    - `onClose: () => void`
    - `onRecipeUpdate: (recipeId: number, data: UpdateRecipeCommand) => Promise<void>`
    - `preferencesAvailable: boolean` (informacja, czy użytkownik ma skonfigurowane preferencje)
    - `onNavigateToPreferences: () => void`

### `ConfirmDeleteModal.tsx` (React)
- **Opis komponentu:** Modal potwierdzający usunięcie przepisu. Wykorzystuje komponent `AlertDialog` z Shadcn/ui.
- **Główne elementy:** Tekst potwierdzenia, przyciski "Potwierdź usunięcie", "Anuluj".
- **Obsługiwane interakcje:** Kliknięcie "Potwierdź usunięcie", kliknięcie "Anuluj", zamknięcie modala.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `RecipeDTO`.
- **Propsy:**
    - `isOpen: boolean`
    - `recipeToDelete: RecipeDTO | null`
    - `onClose: () => void`
    - `onConfirmDelete: (recipeId: number) => Promise<void>`

### `MissingPreferencesNotification.tsx` (React)
- **Opis komponentu:** Komunikat (np. `Alert` z Shadcn/ui) wyświetlany w modalu edycji AI, gdy użytkownik nie ma skonfigurowanych preferencji żywieniowych.
- **Główne elementy:** Tekst informacyjny, link do strony konfiguracji preferencji.
- **Obsługiwane interakcje:** Kliknięcie linku do preferencji.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:**
    - `isVisible: boolean`
    - `onNavigateToPreferences: () => void`

## 5. Typy
Oprócz istniejących typów DTO (`RecipeDTO`, `UpdateRecipeCommand`, `RecipeModificationCommand`, `RecipeModificationResponseDTO`, `GetRecipesQuery`, `PaginationMetadata`, `GetRecipesResponse`) z `src/types/types.ts`, potrzebne będą następujące ViewModels:

-   **`EditRecipeFormViewModel`** (stan formularza ręcznej edycji w `EditRecipeModal`)
    ```typescript
    interface EditRecipeFormViewModel {
      name: string;
      rating: number | string; // string dla input, konwersja do number
      recipeContent: string; // Tekstowa zawartość przepisu
    }
    ```

-   **`AiModificationStateViewModel`** (stan trybu modyfikacji AI w `EditRecipeModal`)
    ```typescript
    interface AiModificationStateViewModel {
      originalRecipeText: string;
      suggestedRecipeText: string | null;
      isLoadingAiSuggestion: boolean;
      aiError: string | null; // Komunikat błędu od AI
      showMissingPreferencesWarning: boolean; // Czy pokazać ostrzeżenie o braku preferencji
    }
    ```

-   **`RecipeFiltersViewModel`** (stan filtrów i wyszukiwania w `RecipeListContainer`)
    ```typescript
    interface RecipeFiltersViewModel {
      searchTerm: string;
      sortBy: SortBy; // 'name' | 'created_at' | 'rating'
      order: Order;   // 'asc' | 'desc'
      page: number;
      limit: number;
      // Opcjonalnie: source: Source | 'all';
    }
    ```
    Zakładamy, że `RecipeDTO.recipe` (typu `Json`) przechowuje tekst przepisu w strukturze, np. `{ "content": "pełny tekst przepisu..." }`. Frontend będzie musiał odpowiednio odczytywać i zapisywać tę strukturę.

## 6. Zarządzanie stanem

-   **`RecipeListContainer.tsx`:**
    -   `recipes: RecipeDTO[]` - lista przepisów.
    -   `pagination: PaginationMetadata | null` - dane paginacji.
    -   `isLoading: boolean` - status ładowania danych.
    -   `error: string | null` - komunikat błędu.
    -   `filters: RecipeFiltersViewModel` - aktualne filtry, wyszukiwanie, sortowanie, strona.
    -   `isEditModalOpen: boolean`, `selectedRecipeForEdit: RecipeDTO | null` - kontrola modala edycji.
    -   `isDeleteModalOpen: boolean`, `selectedRecipeForDelete: RecipeDTO | null` - kontrola modala usuwania.
    -   `arePreferencesSet: boolean` - pobrane np. przy inicjalizacji komponentu, informacja czy użytkownik ma ustawione preferencje (potrzebne dla US-006).

-   **`EditRecipeModal.tsx`:**
    -   `currentRecipeData: RecipeDTO` (otrzymane z props).
    -   `activeTab: 'manual' | 'ai'` - aktywna zakładka.
    -   **Dla trybu manualnego (stan formularza):** `formData: EditRecipeFormViewModel`.
    -   **Dla trybu AI:** `aiState: AiModificationStateViewModel`.

-   **Custom Hooks:**
    -   **`useRecipes` (w `RecipeListContainer`):**
        -   **Cel:** Hermetyzacja logiki pobierania przepisów (w tym obsługa `filters`), zarządzanie stanem `recipes`, `pagination`, `isLoading`, `error`.
        -   **Eksportuje:** `recipes`, `pagination`, `isLoading`, `error`, `filters`, `setFilters` (lub indywidualne funkcje `setSearchTerm`, `setPage` etc.), `refreshRecipes`.
    -   **`useRecipeForm` (w `EditRecipeModal` dla edycji ręcznej):**
        -   **Cel:** Zarządzanie stanem formularza `EditRecipeFormViewModel`, walidacja pól.
        -   **Eksportuje:** `formData`, `handleInputChange`, `formErrors`, `resetForm`, `isFormValid`.
    -   **`useAiRecipeModification` (w `EditRecipeModal` dla modyfikacji AI):**
        -   **Cel:** Zarządzanie stanem `AiModificationStateViewModel`, obsługa wywołania API `/api/recipes/modify`, obsługa błędów (w tym braku preferencji).
        -   **Eksportuje:** `aiState`, `generateSuggestion`, `approveSuggestion`, `rejectSuggestion`.

## 7. Integracja API

-   **`GET /api/recipes`** (Endpoint do pobierania listy przepisów - zakładamy jego istnienie, np. `src/pages/api/recipes/index.ts` lub `src/pages/api/recipes/list.ts`)
    -   **Frontend Action:** Pobieranie listy przepisów przy montowaniu komponentu `RecipeListContainer` oraz przy zmianie filtrów, paginacji, wyszukiwania.
    -   **Request Payload:** `GetRecipesQuery` (parametry query string: `page`, `limit`, `sortBy`, `order`, `searchTerm`).
    -   **Response:** `GetRecipesResponse` (`data: RecipeDTO[]`, `pagination: PaginationMetadata`).

-   **`PUT /api/recipes/update`** (`src/pages/api/recipes/update.ts`)
    -   **Frontend Action:** Aktualizacja przepisu po ręcznej edycji lub po zatwierdzeniu modyfikacji AI.
    -   **Request Payload:** `recipeId` w ścieżce URL (Astro `params`) lub w ciele żądania. Ciało żądania: `UpdateRecipeCommand` (`{ name?: string, rating?: number, recipe?: Json }`). Pole `recipe` powinno zawierać zaktualizowany tekst przepisu w ustalonej strukturze JSON.
    -   **Response:** Zaktualizowany `RecipeDTO`.

-   **`DELETE /api/recipes/delete`** (`src/pages/api/recipes/delete.ts`)
    -   **Frontend Action:** Usunięcie przepisu.
    -   **Request Payload:** `{ recipeId: number }` w ciele żądania.
    -   **Response:** Sukces (200 OK z wiadomością lub 204 No Content).

-   **`POST /api/recipes/modify`** (`src/pages/api/recipes/modify.ts`)
    -   **Frontend Action:** Żądanie modyfikacji przepisu przez AI.
    -   **Request Payload:** `RecipeModificationCommand` (`{ recipe_text: string }`). `recipe_text` to tekstowa zawartość oryginalnego przepisu.
    -   **Response:** `RecipeModificationResponseDTO` (`{ modified_recipe: string }`).

## 8. Interakcje użytkownika

1.  **Przeglądanie listy:** Użytkownik widzi listę swoich przepisów z paginacją.
2.  **Wyszukiwanie:** Wpisanie tekstu w `RecipeSearchInput` dynamicznie filtruje listę.
3.  **Zmiana strony:** Kliknięcie na numer strony w `RecipePagination` ładuje odpowiednią stronę przepisów.
4.  **Kliknięcie "Edytuj" na przepisie:** Otwiera `EditRecipeModal` z danymi wybranego przepisu, domyślnie w zakładce "Edycja ręczna".
5.  **Edycja ręczna:**
    - Użytkownik modyfikuje pola `name`, `rating`, `recipeContent`.
    - Kliknięcie "Zapisz" wysyła żądanie `PUT /api/recipes/update`. Po sukcesie modal jest zamykany, lista odświeżana.
6.  **Przełączenie na zakładkę "Modyfikacja AI" w modalu:**
    - Wyświetlany jest oryginalny tekst przepisu.
    - Jeśli preferencje użytkownika nie są ustawione (sprawdzone np. przy ładowaniu `RecipeListContainer` i przekazane do modala), przycisk "Generuj modyfikację AI" może być wyszarzony lub po kliknięciu od razu pokaże `MissingPreferencesNotification`. Alternatywnie, backend zwróci błąd, który spowoduje wyświetlenie notyfikacji.
7.  **Kliknięcie "Generuj modyfikację AI":**
    - Wysyłane jest żądanie `POST /api/recipes/modify`.
    - W trakcie ładowania wyświetlany jest wskaźnik postępu.
    - **Sukces:** Wyświetlany jest zmodyfikowany tekst przepisu oraz przyciski "Zatwierdź" i "Odrzuć".
    - **Błąd (brak preferencji):** Wyświetlany jest `MissingPreferencesNotification` z linkiem do ustawień preferencji.
    - **Inny błąd:** Wyświetlany jest komunikat błędu.
8.  **Kliknięcie "Zatwierdź" (sugestia AI):**
    - Zmodyfikowany tekst przepisu jest używany do przygotowania `UpdateRecipeCommand`.
    - Wysyłane jest żądanie `PUT /api/recipes/update`. Po sukcesie modal jest zamykany, lista odświeżana.
9.  **Kliknięcie "Odrzuć" (sugestia AI):**
    - Sugestia AI jest odrzucana. Użytkownik wraca do widoku z oryginalnym tekstem przepisu w zakładce AI lub do edycji ręcznej.
10. **Kliknięcie "Usuń" na przepisie:** Otwiera `ConfirmDeleteModal` z pytaniem o potwierdzenie.
11. **Potwierdzenie usunięcia:** Wysyła żądanie `DELETE /api/recipes/delete`. Po sukcesie modal jest zamykany, lista odświeżana.
12. **Anulowanie usuwania / Zamknięcie modala:** Modal jest zamykany bez podejmowania akcji.

## 9. Warunki i walidacja

-   **Dostęp do widoku:** Użytkownik musi być zalogowany. Komponenty powinny sprawdzać sesję.
-   **Formularz edycji ręcznej (`EditRecipeModal`):**
    -   `name`: Wymagane. Max 255 znaków. Komunikat błędu, jeśli niespełnione.
    -   `rating`: Liczba od 1 do 10. Komunikat błędu, jeśli poza zakresem.
    -   `recipeContent`: (Jeśli walidowane) np. minimalna/maksymalna długość. Komunikat błędu.
    -   Przycisk "Zapisz" jest aktywny tylko, gdy formularz jest poprawny.
-   **Żądanie modyfikacji AI (`EditRecipeModal`):**
    -   Tekst przepisu (`recipe_text`) musi mieć od 100 do 10000 znaków (walidacja po stronie backendu, frontend może ją powtórzyć).
    -   Użytkownik musi mieć skonfigurowane preferencje żywieniowe. Jeśli nie, `POST /api/recipes/modify` zwróci błąd (np. 422), co spowoduje wyświetlenie `MissingPreferencesNotification`. Przycisk "Generuj modyfikację AI" może być nieaktywny, jeśli frontend wie o braku preferencji.
-   **Usuwanie przepisu (`ConfirmDeleteModal`):** Wymaga potwierdzenia użytkownika.

## 10. Obsługa błędów

-   **Błędy sieciowe / ogólne błędy serwera (500):** Wyświetlanie globalnych powiadomień (np. toastów z Shadcn/ui) "Wystąpił błąd. Spróbuj ponownie później."
-   **Błąd pobierania listy przepisów (`GET /api/recipes`):** W `RecipeListContainer` wyświetlić komunikat "Nie udało się załadować przepisów." zamiast listy.
-   **Błędy walidacji formularza (`PUT /api/recipes/update` zwraca 400):** Wyświetlanie komunikatów błędów przy odpowiednich polach w `EditRecipeModal`. Modal pozostaje otwarty.
-   **Przepis nie znaleziony (`PUT /api/recipes/update` lub `DELETE /api/recipes/delete` zwraca 404):** Wyświetlenie toastu "Nie znaleziono przepisu." Modal powinien zostać zamknięty, a lista odświeżona.
-   **Brak autoryzacji (API zwraca 401):** Wyświetlenie toastu "Sesja wygasła, zaloguj się ponownie." Rozważenie przekierowania na stronę logowania.
-   **Brak preferencji przy modyfikacji AI (`POST /api/recipes/modify` zwraca błąd np. 422):** W `EditRecipeModal` wyświetlić `MissingPreferencesNotification` z linkiem do strony preferencji. Przycisk generowania AI może zostać zablokowany do czasu uzupełnienia preferencji.
-   **Inne błędy AI (`POST /api/recipes/modify`):** W `EditRecipeModal` wyświetlić komunikat "Modyfikacja AI nie powiodła się."

## 11. Kroki implementacji

1.  **Utworzenie struktury plików:**
    -   `src/pages/recipes.astro`
    -   `src/components/recipes/RecipeListContainer.tsx`
    -   `src/components/recipes/RecipeSearchInput.tsx`
    -   `src/components/recipes/RecipeTable.tsx` (lub `RecipeCardList.tsx`)
    -   `src/components/recipes/RecipeRow.tsx` (lub `RecipeCard.tsx`)
    -   `src/components/recipes/RecipePagination.tsx`
    -   `src/components/recipes/EditRecipeModal.tsx`
    -   `src/components/recipes/ConfirmDeleteModal.tsx`
    -   `src/components/recipes/MissingPreferencesNotification.tsx`
    -   `src/hooks/useRecipes.ts`
    -   `src/hooks/useRecipeForm.ts`
    -   `src/hooks/useAiRecipeModification.ts`
    -   Zdefiniowanie/aktualizacja ViewModeli w `src/types/viewModels.ts` (lub podobnym pliku).

2.  **Implementacja `RecipesPage.astro`:**
    -   Podstawowy layout strony.
    -   Renderowanie komponentu `RecipeListContainer` z odpowiednią dyrektywą `client:`.

3.  **Implementacja haka `useRecipes`:**
    -   Logika pobierania przepisów (`GET /api/recipes`).
    -   Zarządzanie stanem `recipes`, `pagination`, `isLoading`, `error`, `filters`.
    -   Funkcje do aktualizacji filtrów, wyszukiwania, paginacji.

4.  **Implementacja `RecipeListContainer.tsx`:**
    -   Użycie haka `useRecipes`.
    -   Renderowanie `RecipeSearchInput`, `RecipeTable`, `RecipePagination`.
    -   Obsługa otwierania modali `EditRecipeModal` i `ConfirmDeleteModal` oraz przekazywanie do nich danych i callbacków.
    -   Pobranie informacji o tym, czy preferencje użytkownika są ustawione i przekazanie tej informacji do `EditRecipeModal`.

5.  **Implementacja komponentów listy:** `RecipeSearchInput`, `RecipeTable` (z `RecipeRow`), `RecipePagination`. Stylizacja z użyciem Tailwind i komponentów Shadcn/ui.

6.  **Implementacja haka `useRecipeForm`:**
    -   Zarządzanie stanem formularza edycji ręcznej.
    -   Walidacja pól.

7.  **Implementacja haka `useAiRecipeModification`:**
    -   Zarządzanie stanem modyfikacji AI.
    -   Logika wywołania `POST /api/recipes/modify`.
    -   Obsługa odpowiedzi i błędów (w tym braku preferencji).

8.  **Implementacja `EditRecipeModal.tsx`:**
    -   Struktura modala z zakładkami (Shadcn/ui `Dialog`, `Tabs`).
    -   Formularz edycji ręcznej (użycie `useRecipeForm`).
    -   Interfejs modyfikacji AI (użycie `useAiRecipeModification`).
    -   Logika przełączania zakładek.
    -   Obsługa zapisu (`PUT /api/recipes/update`) dla obu trybów.
    -   Renderowanie `MissingPreferencesNotification`.

9.  **Implementacja `MissingPreferencesNotification.tsx`:**
    -   Wyświetlanie komunikatu i linku.

10. **Implementacja `ConfirmDeleteModal.tsx`:**
    -   Struktura modala (Shadcn/ui `AlertDialog`).
    -   Obsługa potwierdzenia usunięcia (`DELETE /api/recipes/delete`).

11. **Integracja API:** Podłączenie wszystkich wywołań API z odpowiednimi typami żądań i odpowiedzi.

12. **Obsługa stanu i błędów:** Zapewnienie poprawnego przepływu danych, aktualizacji UI po operacjach API oraz wyświetlania komunikatów o błędach i sukcesach.

13. **Testowanie:**
    -   Testowanie wszystkich interakcji użytkownika.
    -   Testowanie walidacji formularzy.
    -   Testowanie obsługi błędów API.
    -   Testowanie responsywności widoku.
    -   Sprawdzenie zgodności z User Stories US-004, US-005, US-006.

14. **Stylowanie i UX:** Dopracowanie wyglądu i działania komponentów, aby były zgodne z designem aplikacji i zapewniały dobre doświadczenie użytkownika. Wykorzystanie Tailwind i Shadcn/ui. 