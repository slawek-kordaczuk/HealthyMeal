# RecipeService Tests

This directory contains organized unit tests for the `RecipeService` class, split by method for better maintainability and clarity.

## 📁 File Structure

```
src/lib/services/__tests__/recipeService/
├── README.md                 # This documentation
├── shared-mocks.ts          # Common mocks and utilities
├── getRecipes.test.ts       # Tests for getRecipes() method
├── createRecipe.test.ts     # Tests for createRecipe() method
├── updateRecipe.test.ts     # Tests for updateRecipe() method
└── index.test.ts           # Entry point to run all tests
```

## 🎯 Test Organization

### `shared-mocks.ts`
Contains reusable mock data and utility functions:
- `mockUserId` - Common user ID for tests
- `mockRecipes[]` - Sample recipe data
- `mockExistingRecipe` - Sample existing recipe for update tests
- `createMockSupabase()` - Factory for Supabase client mocks
- `createMockQueryBuilder()` - Helper for query builder mocks
- Error mocks and response helpers

### `getRecipes.test.ts`
Comprehensive tests for the `getRecipes()` method:
- ✅ **Happy Path**: Default pagination, custom pagination, sorting
- 🔍 **Search Functionality**: Search terms, whitespace handling
- 🔄 **Edge Cases**: Empty results, null counts, extreme pagination
- 📋 **Business Rules**: User isolation, default values, search + pagination
- ❌ **Error Handling**: Database failures, count query failures
- 🔗 **Integration Tests**: Complex queries, special characters

### `createRecipe.test.ts`
Tests for the `createRecipe()` method:
- ✅ **Happy Path**: All fields, optional fields, different sources
- 📋 **Business Rules**: User assignment, rating handling, complex JSON
- 🔄 **Edge Cases**: Empty recipe objects, special characters
- ❌ **Error Handling**: Database failures, constraint violations
- 🔗 **Integration Tests**: Method call order, minimal responses

### `updateRecipe.test.ts`
Basic structure for `updateRecipe()` method tests:
- ✅ **Implemented**: Basic update functionality, authorization
- 🚧 **TODO**: Complete remaining test cases
- 📝 **Note**: This file needs completion of remaining test scenarios

## 🚀 Running Tests

### Run All RecipeService Tests
```bash
npm test src/lib/services/__tests__/recipeService/index.test.ts
```

### Run Specific Method Tests
```bash
# Test only getRecipes method
npm test src/lib/services/__tests__/recipeService/getRecipes.test.ts

# Test only createRecipe method
npm test src/lib/services/__tests__/recipeService/createRecipe.test.ts

# Test only updateRecipe method
npm test src/lib/services/__tests__/recipeService/updateRecipe.test.ts
```

### Run Tests with Pattern Matching
```bash
# Run specific test case
npm test -- -t "should return recipes with default pagination"

# Run tests for specific describe block
npm test -- -t "Happy Path - Basic Functionality"
```

## 🔧 Development Guidelines

### Adding New Tests
1. Use appropriate mock data from `shared-mocks.ts`
2. Follow the existing test structure pattern
3. Include proper test categorization (Happy Path, Edge Cases, etc.)
4. Add comprehensive assertions for both success and failure scenarios

### Mock Structure
The `updateRecipe` method requires complex mocking due to its multi-step process:
```javascript
mockSupabase.from = vi.fn()
  .mockReturnValueOnce(mockSelectQuery)     // 1. Fetch existing recipe
  .mockReturnValueOnce(mockModHistoryQuery) // 2. Create modification history
  .mockReturnValueOnce(mockStatsSelectQuery) // 3. Get current stats
  .mockReturnValueOnce(mockStatsUpsertQuery) // 4. Update stats
  .mockReturnValueOnce(mockUpdateQuery);     // 5. Update recipe
```

### Test Categories
- **Happy Path**: Normal operation scenarios
- **Business Rules**: Domain-specific logic validation
- **Edge Cases**: Boundary conditions and unusual inputs
- **Error Handling**: Failure scenarios and error propagation
- **Integration Tests**: Complex interactions and method call verification

## 📊 Test Coverage Status

| Method | Status | Test Count | Coverage |
|--------|--------|------------|----------|
| `getRecipes` | ✅ Complete | 17 tests | 100% |
| `createRecipe` | ✅ Complete | 12 tests | 100% |
| `updateRecipe` | 🚧 Partial | 4 tests | ~30% |

## 🔄 Next Steps

1. **Complete `updateRecipe.test.ts`** - Implement remaining test cases marked with TODO
2. **Add missing methods** - If there are other RecipeService methods, add their test files
3. **Performance tests** - Consider adding performance/load tests for critical methods
4. **Integration tests** - Add end-to-end tests that use real database connections

## 🤝 Contributing

When adding new tests:
1. Follow the established file naming convention
2. Use shared mocks when possible
3. Maintain consistent test structure and documentation
4. Update this README if you add new test files or change the structure 