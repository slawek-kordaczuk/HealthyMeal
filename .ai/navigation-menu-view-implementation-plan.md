# Plan implementacji widoku Menu Nawigacyjnego

## 1. Przegląd
Celem tego widoku jest zapewnienie spójnego i łatwo dostępnego górnego menu nawigacyjnego dla aplikacji HealthyMeal. Menu będzie oparte na komponencie `Navigation Menu` z biblioteki Shadcn/ui i umożliwi użytkownikom szybkie przełączanie się między głównymi sekcjami aplikacji: listą przepisów, dodawaniem nowego przepisu oraz konfiguracją preferencji żywieniowych.

## 2. Routing widoku
Menu nawigacyjne nie jest samodzielnym widokiem (stroną), lecz komponentem globalnym. Zostanie zintegrowane z głównym layoutem aplikacji, prawdopodobnie `src/layouts/Layout.astro`, aby było widoczne na wszystkich stronach korzystających z tego layoutu. Najczęściej umieszcza się je w elemencie `<header>`.

## 3. Struktura komponentów
Hierarchia komponentów będzie wyglądać następująco:

1.  **`src/layouts/Layout.astro`** (Plik layoutu Astro)
    *   Osadza komponent `NavigationMenuContainer`.
2.  **`src/components/NavigationMenuContainer.tsx`** (Komponent React)
    *   Główny kontener menu.
    *   Renderuje komponenty Shadcn/ui.
3.  **Komponenty Shadcn/ui (`@/components/ui/navigation-menu`)**
    *   `NavigationMenu`: Główny wrapper.
    *   `NavigationMenuList`: Lista elementów menu.
    *   `NavigationMenuItem`: Pojedynczy element menu.
    *   `NavigationMenuLink`: Link nawigacyjny (używany z `asChild` i `Link` z `astro:transitions`).

Przykład struktury w JSX (wewnątrz `NavigationMenuContainer.tsx`):
```jsx
<NavigationMenu>
  <NavigationMenuList>
    {/* Link do strony głównej/logo */}
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <AstroLink href="/">HealthyMeal</AstroLink>
      </NavigationMenuLink>
    </NavigationMenuItem>

    {/* Główne linki aplikacji */}
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <AstroLink href="/recipes">Moje Przepisy</AstroLink>
      </NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <AstroLink href="/add-recipe">Dodaj Przepis</AstroLink>
      </NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <AstroLink href="/preferences">Preferencje</AstroLink>
      </NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

## 4. Szczegóły komponentów

### `NavigationMenuContainer.tsx`

*   **Opis komponentu**:
    *   Jest to komponent React odpowiedzialny za renderowanie całego menu nawigacyjnego.
    *   Wykorzystuje komponenty `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuLink` z Shadcn/ui.
*   **Główne elementy HTML i komponenty dzieci**:
    *   `<nav>` (niejawnie przez `NavigationMenu` z Shadcn/ui).
    *   `<ul>` (niejawnie przez `NavigationMenuList`).
    *   `<li>` (niejawnie przez `NavigationMenuItem`).
    *   `<a>` (renderowane przez `NavigationMenuLink` z `astro:transitions` `Link` jako dziecko).
*   **Obsługiwane interakcje**:
    *   Kliknięcie na link nawigacyjny: Przekierowuje na odpowiednią stronę przy użyciu Astro View Transitions.
*   **Warunki walidacji**: Brak specyficznych warunków walidacji dla tej uproszczonej wersji.
*   **Typy**:
    *   `NavigationLinkItem` (zdefiniowany poniżej).
*   **Propsy**: Brak, komponent jest samowystarczalny.

## 5. Typy

*   **`NavigationLinkItem`**:
    *   `label: string`: Tekst wyświetlany na linku.
    *   `href: string`: Ścieżka URL.
    *   `icon?: React.ReactNode`: Opcjonalna ikona.

Przykład definicji linków:
```typescript
const navLinks: NavigationLinkItem[] = [
  { label: "HealthyMeal", href: "/" }, // Logo/Strona główna
  { label: "Moje Przepisy", href: "/recipes" },
  { label: "Dodaj Przepis", href: "/add-recipe" },
  { label: "Preferencje", href: "/preferences" },
];
```

## 6. Zarządzanie stanem
Dla tej uproszczonej wersji menu nawigacyjnego, która nie obejmuje logiki logowania/wylogowania, zarządzanie stanem w komponencie `NavigationMenuContainer.tsx` jest minimalne lub nie jest wymagane. Komponent będzie głównie renderował statyczną listę linków.

Jeśli w przyszłości menu miałoby np. dynamicznie podświetlać aktywny link na podstawie aktualnej ścieżki, można by wprowadzić stan zarządzany przez `useState` i `useEffect` do śledzenia `window.location.pathname`. Jednak w obecnym zakresie, bez dynamicznych zmian opartych na stanie użytkownika, zarządzanie stanem jest trywialne.

## 7. Integracja API
W tej uproszczonej wersji menu, która nie obsługuje autentykacji użytkownika, nie ma bezpośredniej integracji z API backendu (np. Supabase Auth).

## 8. Interakcje użytkownika

*   **Nawigacja**:
    *   Użytkownik klika na link (np. "Moje Przepisy").
    *   Aplikacja przechodzi do odpowiedniej ścieżki (np. `/recipes`) z wykorzystaniem Astro View Transitions.

## 9. Warunki i walidacja
W tej uproszczonej wersji, bez logiki autentykacji, nie ma skomplikowanych warunków wyświetlania ani walidacji na poziomie komponentu menu. Menu wyświetla predefiniowany zestaw linków.

*   **Dostęp do stron**: Samo menu kontroluje tylko widoczność linków. Rzeczywista ochrona stron (np. `/recipes`, `/preferences`, jeśli miałyby być chronione) powinna być realizowana na poziomie routingu Astro (np. w middleware) lub na poziomie każdej strony/komponentu ładującego dane, co jest poza zakresem implementacji samego menu.

## 10. Obsługa błędów
Ponieważ ta wersja menu jest głównie statyczna i nie wykonuje operacji API ani skomplikowanej logiki stanu, potencjalne błędy są ograniczone do problemów z renderowaniem lub konfiguracją komponentów Shadcn/ui. Ewentualne błędy powinny być widoczne w konsoli deweloperskiej przeglądarki.

## 11. Kroki implementacji

1.  **Instalacja/Weryfikacja Shadcn/ui**:
    *   Upewnij się, że `navigation-menu` z Shadcn/ui jest zainstalowane i poprawnie skonfigurowane w projekcie:
        ```bash
        npx shadcn-ui@latest add navigation-menu
        ```
    *   Sprawdź, czy globalne style i konfiguracja Tailwind CSS są odpowiednie.
2.  **Utworzenie typu `NavigationLinkItem`**:
    *   Zdefiniuj interfejs `NavigationLinkItem` w odpowiednim pliku (np. `src/types/types.ts` lub lokalnie w komponencie).
3.  **Utworzenie komponentu `NavigationMenuContainer.tsx`**:
    *   Stwórz plik `src/components/NavigationMenuContainer.tsx`.
    *   Przygotuj listę linków (np. tablica obiektów `NavigationLinkItem`).
4.  **Implementacja widoku menu**:
    *   W `NavigationMenuContainer.tsx` użyj komponentów `<NavigationMenu>`, `<NavigationMenuList>`, `<NavigationMenuItem>`, `<NavigationMenuLink>` (z `asChild` i `AstroLink`) do renderowania menu na podstawie listy linków.
    *   Użyj `import { Link as AstroLink } from "astro:transitions";` dla linków, aby zapewnić integrację z Astro View Transitions.
5.  **Integracja z `Layout.astro`**:
    *   Zaimportuj i umieść `<NavigationMenuContainer client:load />` w `src/layouts/Layout.astro`, w odpowiednim miejscu (np. wewnątrz elementu `<header>`).
6.  **Stylowanie**:
    *   Dostosuj wygląd menu za pomocą klas Tailwind CSS, aby pasowało do ogólnego designu aplikacji. Komponenty Shadcn/ui są już stylowane, ale można je dalej dostosowywać.
    *   Upewnij się, że menu jest responsywne.

