# 📖 Dokumentacja testów dla `RecipePagination.tsx`

## 🎯 Cel komponentu

`RecipePagination` to komponent odpowiedzialny za renderowanie interfejsu paginacji dla listy przepisów. Komponent implementuje inteligentny system wyświetlania numerów stron z ellipsis, nawigację previous/next oraz wyświetlanie informacji o zakresie elementów.

## 🏗️ Struktura testów (48 testów)

### 1. **Visibility Rules** (3 testy)
Testuje zasady widoczności komponentu paginacji:
- **Ukrycie dla jednej strony**: Komponent nie renderuje się gdy `totalPages <= 1`
- **Ukrycie dla braku danych**: Komponent nie renderuje się gdy `total = 0`
- **Wyświetlanie dla wielu stron**: Komponent renderuje się gdy `totalPages > 1`

```typescript
// Test: Komponent nie pojawia się dla pojedynczej strony
const paginationData = { page: 1, totalPages: 1, total: 5, limit: 10 };
expect(container.firstChild).toBeNull();
```

### 2. **Items Display Information** (5 testów)
Testuje logikę obliczania i wyświetlania zakresu elementów:
- **Pierwsza strona**: "Wyświetlanie 1-10 z 50 przepisów"
- **Środkowa strona**: "Wyświetlanie 21-30 z 50 przepisów"
- **Ostatnia strona z częściowymi elementami**: "Wyświetlanie 41-47 z 47 przepisów"
- **Różne rozmiary limit**: Testuje różne wartości `limit` (10, 25, 100)

```typescript
// Reguła: startItem = (page - 1) * limit + 1
// Reguła: endItem = Math.min(page * limit, total)
```

### 3. **Page Number Generation - Small Total Pages** (3 testy)
Testuje logikę generowania numerów stron dla małych zbiorów:
- **Wszystkie strony (≤5)**: Wyświetla wszystkie numery 1, 2, 3, 4
- **Dokładnie 5 stron**: Wyświetla 1, 2, 3, 4, 5
- **Aktywna strona**: Sprawdza `aria-current="page"`

### 4. **Page Number Generation - Large Total Pages** (4 testy)
Testuje inteligentny system ellipsis dla dużych zbiorów:
- **Początkowe strony**: [1] [2] [3] […] [10]
- **Środkowe strony**: [1] […] [4] [5] [6] […] [10]
- **Końcowe strony**: [1] […] [8] [9] [10]
- **Bardzo duże zbiory**: Testuje 100+ stron

```typescript
// Algorytm generowania stron:
// 1. Zawsze pokazuj pierwszą stronę
// 2. Dodaj ellipsis jeśli page > 3
// 3. Pokazuj strony wokół aktualnej (page-1, page, page+1)
// 4. Dodaj ellipsis jeśli page < totalPages - 2
// 5. Zawsze pokazuj ostatnią stronę
```

### 5. **Previous Button Functionality** (4 testy)
Testuje funkcjonalność przycisku "Previous":
- **Wyłączenie na pierwszej stronie**: `pointer-events-none opacity-50`
- **Włączenie na innych stronach**: `cursor-pointer`
- **Prawidłowe wywołanie**: `onPageChange(page - 1)`
- **Brak wywołania gdy wyłączony**: Sprawdza guard clauses

### 6. **Next Button Functionality** (4 testy)
Testuje funkcjonalność przycisku "Next":
- **Wyłączenie na ostatniej stronie**: `pointer-events-none opacity-50`
- **Włączenie na innych stronach**: `cursor-pointer`
- **Prawidłowe wywołanie**: `onPageChange(page + 1)`
- **Brak wywołania gdy wyłączony**: Sprawdza guard clauses

### 7. **Page Number Link Functionality** (4 testy)
Testuje interakcje z numerami stron:
- **Kliknięcie konkretnej strony**: `onPageChange(3)`
- **Kliknięcie aktualnej strony**: Powinno być dozwolone
- **Kliknięcie ellipsis**: Nie powinno wywoływać callback
- **Szybkie kliknięcia**: Testuje rapid clicking bez debouncing

### 8. **Layout and Styling** (3 testy)
Testuje strukturę i style UI:
- **Główny layout**: `flex items-center justify-between`
- **Styling tekstu info**: `text-sm text-gray-700`
- **Kolejność elementów**: Previous → Numbers → Next

### 9. **Edge Cases and Error Handling** (6 testów)
Testuje przypadki brzegowe:
- **Zero elementów**: Graceful degradation
- **Bardzo duże liczby**: 100,000+ elementów
- **page > totalPages**: Obsługa błędnych stanów
- **Ujemne numery stron**: Error resilience
- **Undefined callback**: Component stability
- **Ułamkowe numery stron**: JavaScript type coercion

### 10. **Accessibility Features** (4 testy)
Testuje zgodność z WCAG 2.1 AA:
- **ARIA labels**: "Go to previous page", "Go to next page"
- **aria-current**: Oznaczenie aktualnej strony
- **Navigation structure**: `role="navigation" aria-label="pagination"`
- **Screen reader support**: "More pages" dla ellipsis

### 11. **Component Re-rendering** (2 testy)
Testuje zachowanie podczas re-renderów:
- **Aktualizacja danych**: Zmiana props → aktualizacja UI
- **Stabilność callback**: Funkcje powinny działać po re-render

### 12. **Performance and Memory** (2 testy)
Testuje wydajność komponentu:
- **Brak nowych obiektów**: Memory efficiency
- **Wiele re-renderów**: Stability podczas 100+ re-renderów

### 13. **TypeScript Type Safety** (2 testy)
Testuje bezpieczeństwo typów:
- **Walidacja PaginationMetadata**: Interface compliance
- **Callback types**: `(page: number) => void`

## 🔧 Kluczowe reguły biznesowe

### 1. **Visibility Logic**
```typescript
// Komponent renderuje się tylko gdy jest więcej niż 1 strona
if (totalPages <= 1) return null;
```

### 2. **Items Range Calculation**
```typescript
const startItem = (page - 1) * limit + 1;
const endItem = Math.min(page * limit, total);
// Wynik: "Wyświetlanie {startItem}-{endItem} z {total} przepisów"
```

### 3. **Page Generation Algorithm**
```typescript
const maxVisiblePages = 5;
if (totalPages <= maxVisiblePages) {
  // Pokaż wszystkie strony
} else {
  // Używaj ellipsis pattern
}
```

### 4. **Navigation Guards**
```typescript
// Previous: tylko jeśli page > 1
onClick={() => page > 1 && onPageChange(page - 1)}

// Next: tylko jeśli page < totalPages  
onClick={() => page < totalPages && onPageChange(page + 1)}
```

## 🎨 UI/UX Features

### **Visual States**
- **Disabled state**: `pointer-events-none opacity-50`
- **Active page**: `aria-current="page"` + outline variant
- **Hover states**: Cursor pointer dla aktywnych elementów
- **Ellipsis styling**: `size-9 items-center justify-center`

### **Responsive Design**
- **Mobile**: Ukrywa text "Previous"/"Next", pokazuje tylko ikony
- **Desktop**: Pełne labels + ikony
- **Gap spacing**: `gap-1` między elementami paginacji

### **Information Hierarchy**
- **Items range**: Na lewej stronie z wyraźnym formatowaniem
- **Navigation**: Na prawej stronie z logiczną kolejnością
- **Visual separation**: Clear spacing między sekcjami

## 🧪 Przykłady użycia testów

### **Test podstawowej funkcjonalności**
```typescript
const paginationData = createMockPaginationData({
  page: 2,
  limit: 10,
  total: 50,
  totalPages: 5
});

render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

// Sprawdź wyświetlanie zakresu
expect(screen.getByText("Wyświetlanie 11-20 z 50 przepisów")).toBeInTheDocument();

// Sprawdź nawigację
const nextLink = screen.getByLabelText("Go to next page");
await user.click(nextLink);
expect(mockOnPageChange).toHaveBeenCalledWith(3);
```

### **Test edge case**
```typescript
const edgeCaseData = createMockPaginationData({
  page: 999,
  limit: 100,
  total: 100000,
  totalPages: 1000
});

render(<RecipePagination paginationData={edgeCaseData} onPageChange={mockOnPageChange} />);

// Powinno obsłużyć duże liczby gracefully
expect(screen.getByText("Wyświetlanie 99801-99900 z 100000 przepisów")).toBeInTheDocument();
```

### **Test accessibility**
```typescript
render(<RecipePagination paginationData={paginationData} onPageChange={mockOnPageChange} />);

// Navigation structure
const nav = screen.getByRole("navigation");
expect(nav).toHaveAttribute("aria-label", "pagination");

// Current page marking
const currentPage = screen.getByRole("link", { current: "page" });
expect(currentPage).toHaveAttribute("aria-current", "page");
```

## 🔍 Patterns testowe

### **Mock Factory Pattern**
```typescript
const createMockPaginationData = (overrides?: Partial<PaginationMetadata>): PaginationMetadata => ({
  page: 1,
  limit: 10,
  total: 50,
  totalPages: 5,
  ...overrides,
});
```

### **User Event Pattern**
```typescript
const user = userEvent.setup();
const nextLink = screen.getByLabelText("Go to next page");
await user.click(nextLink);
```

### **Accessibility Testing Pattern**
```typescript
// Role-based selectors
const currentPage = screen.getByRole("link", { current: "page" });
const navigation = screen.getByRole("navigation");

// ARIA attribute checking
expect(element).toHaveAttribute("aria-label", "expected-label");
```

## 📊 Coverage metryki

- **Business Logic**: 100% pokrycie algorytmu paginacji
- **UI Interactions**: Wszystkie kliknięcia, stany disabled/enabled
- **Edge Cases**: Obsługa błędnych/granicznych danych
- **Accessibility**: Pełna zgodność WCAG 2.1 AA
- **TypeScript**: Type safety dla wszystkich props i callbacks
- **Performance**: Memory leaks, re-render stability

## 🚀 Production readiness

### **Error Handling**
- Graceful degradation dla błędnych danych
- Guard clauses dla edge cases
- Type safety na poziomie TypeScript

### **Performance**
- Brak memory leaks podczas re-renderów
- Efficient DOM updates
- Minimal render cycles

### **Accessibility**
- Screen reader support
- Keyboard navigation
- ARIA labels i structure
- Focus management

### **Maintainability**
- Clear test descriptions
- Comprehensive edge case coverage
- Business rules documentation
- Mock factory patterns

## 🔧 Troubleshooting

### **Problemy z testami**
1. **Brak elementów**: Sprawdź czy `totalPages > 1`
2. **Błędne selektory**: Używaj `getByRole("link")` zamiast `getByRole("button")`
3. **Callback nie wywołany**: Sprawdź czy element nie jest disabled
4. **ARIA errors**: Sprawdź czy element ma odpowiednie aria-* attributes

### **Mock setup**
```typescript
const mockOnPageChange = vi.fn();

beforeEach(() => {
  vi.clearAllMocks(); // Wyczyść mocki przed każdym testem
});
```

### **Debugging tips**
```typescript
// Sprawdź czy element istnieje
screen.debug(); // Wyświetl obecny DOM

// Sprawdź wszystkie linki
const links = screen.getAllByRole("link");
console.log(links.map(link => link.textContent));
``` 