# Plan implementacji widoku Dodawania Przepisu

## 1. Przegląd
Widok "Dodaj Przepis" umożliwia użytkownikom tworzenie nowych przepisów kulinarnych. Użytkownik może wprowadzić dane przepisu ręcznie i zapisać go, lub skorzystać z funkcji modyfikacji przez sztuczną inteligencję (AI), aby dostosować przepis do swoich preferencji żywieniowych przed jego finalnym zapisaniem. Widok ten integruje formularz wprowadzania danych, walidację oraz interakcję z API w celu zapisania przepisu i potencjalnej modyfikacji przez AI.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką:
- `/add-recipe`

## 3. Struktura komponentów
Główna struktura komponentów dla widoku `/add-recipe`:
```
AddRecipePage.astro (/src/pages/add-recipe.astro)
└── RecipeForm.tsx (client:visible)
├── Form (Shadcn/ui)
│ ├── FormField (dla Nazwy Przepisu)
│ │ ├── FormLabel
│ │ ├── FormControl
│ │ │ └── Input (Shadcn/ui)
│ │ └── FormMessage
│ ├── FormField (dla Oceny - opcjonalne)
│ │ ├── FormLabel
│ │ ├── FormControl
│ │ │ └── Input type="number" (Shadcn/ui) lub Slider (Shadcn/ui)
│ │ └── FormMessage
│ ├── FormField (dla Treści Przepisu)
│ │ ├── FormLabel
│ │ ├── FormControl
│ │ │ └── Textarea (Shadcn/ui)
│ │ └── FormMessage
├── Button ("Zapisz") (Shadcn/ui)
├── Button ("Zapisz i modyfikuj z AI") (Shadcn/ui)
├── (Warunkowo) AIPreviewSection.tsx
│ ├── div (do wyświetlania oryginalnej treści)
│ ├── div (do wyświetlania zmodyfikowanej treści przez AI)
│ ├── Button ("Zatwierdź zmiany AI") (Shadcn/ui)
│ └── Button ("Odrzuć zmiany AI") (Shadcn/ui)
└── (Warunkowo) ConfirmAIModificationModal.tsx (Shadcn/ui Dialog)
├── DialogHeader
├── DialogContent
├── DialogFooter
│ ├── Button ("Przejdź do preferencji") (Shadcn/ui)
│ └── Button ("Anuluj") (Shadcn/ui)
```
## 4. Szczegóły komponentów

### `AddRecipePage.astro`
- **Opis komponentu:** Główna strona Astro dla ścieżki `/add-recipe`. Renderuje layout strony oraz osadza interaktywny komponent React `RecipeForm`.
- **Główne elementy:** Standardowy layout aplikacji, `<RecipeForm client:visible />`.
- **Obsługiwane interakcje:** Brak bezpośrednich, deleguje do `RecipeForm`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak specyficznych.
- **Propsy:** Potencjalnie dane sesji użytkownika, jeśli nie są pobierane wewnątrz `RecipeForm`.

### `RecipeForm.tsx`
- **Opis komponentu:** Interaktywny formularz React do wprowadzania danych nowego przepisu. Zarządza stanem formularza, walidacją, interakcją z AI oraz komunikacją z API.
- **Główne elementy:**
    - `Input` (Shadcn/ui) dla nazwy przepisu.
    - `Input type="number"` lub `Slider` (Shadcn/ui) dla oceny (opcjonalnie, 1-10).
    - `Textarea` (Shadcn/ui) dla treści przepisu.
    - `Button` (Shadcn/ui) "Zapisz" do zapisu manualnego.
    - `Button` (Shadcn/ui) "Zapisz i modyfikuj z AI" do zainicjowania modyfikacji AI przed zapisem.
    - Warunkowo renderowany `AIPreviewSection` do porównania i akceptacji zmian AI.
    - Warunkowo renderowany `ConfirmAIModificationModal` jeśli preferencje użytkownika nie są ustawione.
- **Obsługiwane interakcje:**
    - Wprowadzanie danych w pola formularza.
    - Kliknięcie przycisku "Zapisz".
    - Kliknięcie przycisku "Zapisz i modyfikuj z AI".
    - Kliknięcie "Zatwierdź zmiany AI" / "Odrzuć zmiany AI" w `AIPreviewSection`.
- **Obsługiwana walidacja (inline i przed wysłaniem):**
    - **Nazwa przepisu (`name`):**
        - Wymagane.
        - Minimum 1 znak.
        - Unikalność (sprawdzana przez API po wysłaniu - błąd 409).
    - **Ocena (`rating`):**
        - Opcjonalne.
        - Jeśli podana, musi być liczbą całkowitą z zakresu 1-10.
    - **Treść przepisu (`recipeContent`):**
        - Wymagane.
        - Długość `JSON.stringify({ "instructions": recipeContent })` musi być pomiędzy 100 a 10000 znaków.
- **Typy:**
    - Props: `userId: string` (przekazany lub pobrany z hooka/kontekstu).
    - State: `AddRecipeFormState` (patrz sekcja 5. Typy).
    - API DTOs: `CreateRecipeCommand`, `RecipeDTO`, `RecipeModificationCommand`, `RecipeModificationResponseDTO`.
- **Propsy:**
    - `userId: string` (opcjonalnie, jeśli strona ma zapewnić ID użytkownika).

### `AIPreviewSection.tsx` (sub-komponent `RecipeForm.tsx`)
- **Opis komponentu:** Wyświetla oryginalną treść przepisu oraz wersję zmodyfikowaną przez AI, umożliwiając użytkownikowi zatwierdzenie lub odrzucenie zmian.
- **Główne elementy:** Dwa bloki tekstowe (oryginał, zmodyfikowany), przyciski "Zatwierdź zmiany AI", "Odrzuć zmiany AI".
- **Obsługiwane interakcje:** Kliknięcie przycisków "Zatwierdź" lub "Odrzuć".
- **Obsługiwana walidacja:** Brak.
- **Typy:**
    - Props: `originalContent: string`, `modifiedContent: string`, `onApprove: () => void`, `onReject: () => void`.
- **Propsy:**
    - `originalContent: string`
    - `modifiedContent: string`
    - `onApprove: () => void`
    - `onReject: () => void`

### `ConfirmAIModificationModal.tsx` (sub-komponent `RecipeForm.tsx`)
- **Opis komponentu:** Modal informujący użytkownika o konieczności skonfigurowania preferencji żywieniowych przed skorzystaniem z modyfikacji AI.
- **Główne elementy:** Tekst informacyjny, przycisk "Przejdź do preferencji" (nawigacja do strony preferencji), przycisk "Anuluj".
- **Obsługiwane interakcje:** Kliknięcie przycisków.
- **Obsługiwana walidacja:** Brak.
- **Typy:**
    - Props: `isOpen: boolean`, `onClose: () => void`, `onGoToPreferences: () => void`.
- **Propsy:**
    - `isOpen: boolean`
    - `onClose: () => void`
    - `onGoToPreferences: () => void`

## 5. Typy

### `CreateRecipeCommand` (Request DTO dla `POST /api/recipes`)
```typescript
export interface CreateRecipeCommand {
  name: string;
  rating?: number; // Walidacja: 1-10
  source: "manual" | "AI";
  recipe: Json; // Struktura np. { "instructions": string }, walidacja długości JSON.stringify: 100-10000
}
```

### `RecipeDTO` (Response DTO z `POST /api/recipes`)
```typescript
export interface RecipeDTO {
  id: number;
  name: string;
  rating: number;
  source: "manual" | "AI";
  recipe: Json;
  created_at: string;
  updated_at?: string;
}
```

### `RecipeModificationCommand` (Request DTO dla `POST /api/recipes/modify`)
```typescript
export interface RecipeModificationCommand {
  recipe_text: string; // Walidacja długości: 100-10000
}
```

### `RecipeModificationResponseDTO` (Response DTO z `POST /api/recipes/modify`)
```typescript
export interface RecipeModificationResponseDTO {
  modified_recipe: string;
}
```

### `AddRecipeFormState` (Stan wewnętrzny komponentu `RecipeForm.tsx`)
```typescript
interface AddRecipeFormState {
  name: string;                   // Nazwa przepisu
  rating: string;                 // Ocena jako string (do walidacji i parsowania)
  recipeContent: string;          // Główna treść przepisu (mapowana do recipe.instructions)
  
  isAIFlowActive: boolean;        // Czy aktywny jest przepływ modyfikacji AI (po kliknięciu "Modyfikuj z AI" i przejściu walidacji preferencji)
  originalContentForAI: string | null; // Przechowuje oryginalną treść przepisu podczas modyfikacji AI
  aiModifiedContent: string | null;    // Przechowuje treść zmodyfikowaną przez AI
}
```

### `FieldErrors` (Typ dla błędów walidacji formularza)
```typescript
type FieldErrors = Partial<Record<'name' | 'rating' | 'recipeContent', string>>;
```

## 6. Zarządzanie stanem

Stan będzie zarządzany głównie wewnątrz komponentu React `RecipeForm.tsx` przy użyciu hooka `useState`.
- `formState: AddRecipeFormState`: Przechowuje aktualne wartości pól formularza oraz stan związany z modem AI.
- `isLoading: boolean`: Wskazuje, czy trwa operacja API (zapis, modyfikacja AI).
- `errors: FieldErrors`: Przechowuje błędy walidacji dla poszczególnych pól.
- `showPreferencesModal: boolean`: Kontroluje widoczność modala `ConfirmAIModificationModal`.

**Niestandardowe Hooki (Custom Hooks):**

1.  **`useUserPreferences` (np. `/src/lib/hooks/useUserPreferences.ts`)**
    - **Cel:** Pobiera preferencje żywieniowe zalogowanego użytkownika. Sprawdza, czy preferencje są wystarczająco skonfigurowane do modyfikacji AI.
    - **Logika:** Wywołuje `GET /api/preferences`. Zwraca obiekt `{ preferences: PreferencesDTO | null, isLoading: boolean, arePreferencesSet: boolean }`. `arePreferencesSet` może na początku sprawdzać, czy `preferences` nie jest `null`.
    - **Użycie:** W `RecipeForm.tsx` przed próbą modyfikacji AI.

## 7. Integracja API

Endpointy API zaangażowane w proces dodawania przepisu:

1.  **`POST /api/recipes/create`** (implementacja istnieje w `src/pages/api/recipes/create.ts`)
    - **Cel:** Tworzenie nowego przepisu.
    - **Request Payload:** `CreateRecipeCommand`.
        - `name`: z `formState.name`.
        - `rating`: parsowane z `formState.rating` (jeśli podane).
        - `source`: `"manual"` lub `"AI"` w zależności od akcji użytkownika.
        - `recipe`: `JSON.stringify({ "instructions": formState.recipeContent lub formState.aiModifiedContent })`. Długość tego stringa musi być zgodna z walidacją (100-10000 znaków).
    - **Response:** `RecipeDTO` (sukces 201) lub obiekt błędu (400, 401, 409, 500).

2.  **`POST /api/recipes/modify`** (endpoint do stworzenia, typy zdefiniowane w `src/types/types.ts`)
    - **Cel:** Modyfikacja tekstu przepisu przez AI.
    - **Request Payload:** `RecipeModificationCommand` (`{ recipe_text: formState.recipeContent }`).
    - **Response:** `RecipeModificationResponseDTO` (`{ modified_recipe: string }`) (sukces 200) lub obiekt błędu.

3.  **`GET /api/preferences`** (endpoint do stworzenia)
    - **Cel:** Pobranie preferencji żywieniowych użytkownika.
    - **Request Payload:** Brak (uwierzytelnianie przez sesję/token).
    - **Response:** `PreferencesDTO` lub 404/null jeśli brak preferencji.

## 8. Interakcje użytkownika

1.  **Wypełnianie formularza:**
    - Użytkownik wprowadza nazwę, opcjonalnie ocenę i treść przepisu.
    - Stan `formState` jest aktualizowany.
    - Walidacja inline może wyświetlać komunikaty o błędach (np. zbyt krótka nazwa).
2.  **Kliknięcie "Zapisz":**
    - Walidacja całego formularza.
    - Jeśli poprawna: `isLoading = true`. Wywołanie `POST /api/recipes/create` z `source: "manual"` i `recipe.instructions` z `formState.recipeContent`.
    - Po odpowiedzi: `isLoading = false`. Reset formularza i powiadomienie o sukcesie / wyświetlenie błędów.
3.  **Kliknięcie "Zapisz i modyfikuj z AI":**
    - Walidacja całego formularza.
    - Jeśli poprawna:
        - Sprawdzenie preferencji użytkownika (`useUserPreferences`).
        - Jeśli brak preferencji: `showPreferencesModal = true`.
        - Jeśli preferencje są: `isLoading = true`, `formState.isAIFlowActive = true`, `formState.originalContentForAI = formState.recipeContent`. Wywołanie `POST /api/recipes/modify` z `recipe_text: formState.recipeContent`.
        - Po odpowiedzi AI: `isLoading = false`. `formState.aiModifiedContent = response.modified_recipe`. Wyświetlenie `AIPreviewSection`.
        - W przypadku błędu AI: `isLoading = false`, `formState.isAIFlowActive = false`, komunikat błędu.
4.  **W `ConfirmAIModificationModal`:**
    - Kliknięcie "Przejdź do preferencji": Nawigacja do strony `/preferences`. Modal się zamyka.
    - Kliknięcie "Anuluj": Modal się zamyka.
5.  **W `AIPreviewSection`:**
    - Kliknięcie "Zatwierdź zmiany AI": `isLoading = true`. Wywołanie `POST /api/recipes/create` z `source: "AI"` i `recipe.instructions` z `formState.aiModifiedContent`. Po odpowiedzi: `isLoading = false`, reset formularza i stanów AI, powiadomienie.
    - Kliknięcie "Odrzuć zmiany AI": `formState.isAIFlowActive = false`, `formState.aiModifiedContent = null`. Powrót do standardowego widoku formularza z oryginalną treścią.

## 9. Warunki i walidacja

Warunki walidacyjne będą egzekwowane zarówno po stronie klienta (dla szybkiego feedbacku) jak i serwera (jako ostateczne źródło prawdy).

- **Nazwa przepisu (`name`):**
    - Komponent: Wymagane, min. 1 znak. Komunikat: "Nazwa przepisu jest wymagana."
    - API: `z.string().min(1)`, `checkNameExists`. Komunikat API (409): "Przepis o tej nazwie już istnieje."
- **Ocena (`rating`):**
    - Komponent: Jeśli wprowadzona, musi być liczbą 1-10. Komunikat: "Ocena musi być liczbą od 1 do 10."
    - API: `z.number().min(1).max(10).optional()`.
- **Treść przepisu (`recipeContent` -> `recipe.instructions`):**
    - Komponent: Wymagane. Długość `JSON.stringify({ "instructions": recipeContent })` musi być między 100 a 10000 znaków. Komunikat: "Treść przepisu musi mieć od X do Y znaków (po konwersji do formatu zapisu)." (X i Y należy obliczyć tak, aby po opakowaniu w JSON zgadzało się z limitem 100-10000).
    - API: `recipe` (jako obiekt JSON) po stringifikacji musi mieć długość 100-10000 znaków.
- **Ogólne:** Pola wymagane nie mogą być puste. Komunikaty walidacyjne powinny pojawiać się obok pól (np. używając `FormMessage` z Shadcn/ui). Przycisk zapisu może być nieaktywny, dopóki podstawowe warunki walidacji nie są spełnione.

## 10. Obsługa błędów

- **Błędy walidacji (400 Bad Request z API):** Odpowiedź serwera będzie zawierać szczegóły błędów. Należy je sparsować i wyświetlić odpowiednie komunikaty przy polach formularza w `RecipeForm.tsx`.
- **Błąd unikalności nazwy (409 Conflict z API):** Wyświetlić komunikat przy polu nazwy: "Przepis o tej nazwie już istnieje."
- **Brak autoryzacji (401 Unauthorized):** Przekierować użytkownika na stronę logowania lub wyświetlić globalny komunikat o błędzie sesji.
- **Błędy serwera (500 Internal Server Error):** Wyświetlić ogólny komunikat błędu, np. "Wystąpił błąd serwera. Spróbuj ponownie później." (np. używając komponentu Toast).
- **Błędy sieciowe:** Wyświetlić ogólny komunikat, np. "Błąd połączenia. Sprawdź swoje połączenie internetowe."
- **Błędy podczas modyfikacji AI (`POST /api/recipes/modify`):**
    - Wyświetlić komunikat użytkownikowi, np. "Modyfikacja AI nie powiodła się. Spróbuj ponownie lub zapisz przepis manualnie."
    - Zresetować stan związany z AI (`isAIFlowActive = false`).
    - FR9: Logowanie krytycznych błędów integracji AI (po stronie backendu).
- **Błąd pobierania preferencji (`GET /api/preferences`):**
    - Jeśli krytyczny dla modyfikacji AI, uniemożliwić tę opcję, informując użytkownika.

## 11. Kroki implementacji

1.  **Stworzenie strony Astro (`AddRecipePage.astro`):**
    - Zdefiniować ścieżkę `/add-recipe`.
    - Dodać podstawowy layout i osadzić miejsce na komponent React.
2.  **Implementacja komponentu `RecipeForm.tsx`:**
    - Zdefiniować stan `AddRecipeFormState`, `isLoading`, `errors`, `showPreferencesModal`.
    - Zbudować UI formularza używając komponentów Shadcn/ui (`Form`, `FormField`, `Input`, `Textarea`, `Button`).
    - Zaimplementować logikę zmiany wartości w formularzu i aktualizacji stanu.
3.  **Implementacja walidacji po stronie klienta:**
    - Dodać funkcje walidujące dla każdego pola zgodnie z wymaganiami.
    - Wyświetlać komunikaty błędów przy użyciu `FormMessage`.
4.  **Implementacja hooka `useUserPreferences`:**
    - Stworzyć hook do pobierania preferencji użytkownika z `GET /api/preferences`.
    - Zintegrować go w `RecipeForm.tsx`.
5.  **Implementacja logiki przycisku "Zapisz":**
    - Po kliknięciu, walidacja formularza.
    - Jeśli poprawny, przygotowanie `CreateRecipeCommand` (`source: "manual"`).
    - Wywołanie `POST /api/recipes/create`.
    - Obsługa odpowiedzi (sukces, błędy).
6.  **Implementacja logiki przycisku "Zapisz i modyfikuj z AI":**
    - Po kliknięciu, walidacja formularza.
    - Sprawdzenie preferencji (`useUserPreferences`).
    - Jeśli brak preferencji: wyświetlenie `ConfirmAIModificationModal.tsx`.
    - Jeśli są preferencje:
        - Przygotowanie `RecipeModificationCommand`.
        - Wywołanie `POST /api/recipes/modify`.
        - Obsługa odpowiedzi: jeśli sukces, aktualizacja stanu `aiModifiedContent` i wyświetlenie `AIPreviewSection.tsx`.
7.  **Implementacja komponentu `AIPreviewSection.tsx`:**
    - Wyświetlenie treści oryginalnej i zmodyfikowanej.
    - Przyciski "Zatwierdź zmiany AI" i "Odrzuć zmiany AI".
    - Logika zatwierdzenia: przygotowanie `CreateRecipeCommand` (`source: "AI"`, używając `aiModifiedContent`) i wywołanie `POST /api/recipes/create`.
    - Logika odrzucenia: reset stanu AI.
8.  **Implementacja komponentu `ConfirmAIModificationModal.tsx`:**
    - Wyświetlenie informacji i przycisków nawigacji/anulowania.
