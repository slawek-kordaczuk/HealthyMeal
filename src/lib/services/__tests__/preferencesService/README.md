# PreferencesService Tests

Comprehensive test suite for the `PreferencesService` class, organized by functionality for better maintainability and clarity.

## 📁 File Structure

```
src/lib/services/__tests__/preferencesService/
├── README.md                           # This documentation
├── fixtures.ts                         # Test data, mock objects, and factory functions
├── shared-mocks.ts                     # Mock utilities and helper functions
├── createOrUpdatePreferences.test.ts   # Tests for create/update operations
├── getUserPreferences.test.ts          # Tests for retrieving preferences
├── edgeCases.test.ts                   # Edge cases and real-world scenarios
└── index.test.ts                       # Test entry point
```

## 🎯 Test Organization

### `fixtures.ts`
Contains all test data and factory functions:
- **Mock Data**: `mockUserId`, `mockPreferenceRow`, `mockPreferencesDTO`, etc.
- **Factory Functions**: `createMockPreferenceRow()`, `createMockPreferencesCommand()`
- **Scenario Data**: Real-world test scenarios and edge cases
- **Error Scenarios**: Common database errors and edge cases

### `shared-mocks.ts`
Mock utilities and helper functions:
- **Mock Factories**: `createMockSupabase()` for consistent mock setup
- **Assertion Helpers**: `expectQueryStructure()`, `expectUserQuery()`, etc.
- **Response Builders**: `mockSuccessResponse()`, `mockErrorResponse()`
- **Type Definitions**: TypeScript interfaces for better mock type safety

### `createOrUpdatePreferences.test.ts`
Comprehensive tests for the main CRUD method:
- ✅ **Creating New Preferences**: Insert operations, data filtering, validation
- 🔄 **Updating Existing Preferences**: Update operations, partial updates, timestamps
- 📝 **Input Validation**: Field filtering, empty commands, undefined values
- ❌ **Error Handling**: Insert/update failures, database errors

### `getUserPreferences.test.ts`
Tests for preference retrieval:
- ✅ **Successful Retrieval**: Normal cases, complete data mapping
- 🔍 **Data Mapping**: Database row to DTO conversion, null value handling
- 🚫 **No Data Scenarios**: Missing preferences, empty results
- ❌ **Error Handling**: Database errors, connection issues
- 👥 **Multi-User**: Different user scenarios

### `edgeCases.test.ts`
Edge cases and complex scenarios:
- 🌍 **Real-World Scenarios**: Complete user onboarding, preference updates
- 🔤 **Edge Cases**: Long text, special characters, extreme values
- ⚡ **Performance**: Maximum field lengths, rapid successive calls
- 🔄 **Complex Operations**: Mixed null/value updates, preference clearing

## 🏃‍♂️ Running Tests

```bash
# Run all preferences service tests
npm test preferencesService

# Run specific test file
npm test createOrUpdatePreferences.test.ts
npm test getUserPreferences.test.ts
npm test edgeCases.test.ts

# Run with coverage
npm test preferencesService -- --coverage

# Run in watch mode
npm test preferencesService -- --watch
```

## 📊 Test Coverage

### Methods Tested
- ✅ `createOrUpdatePreferences()` - Complete coverage
- ✅ `getUserPreferences()` - Complete coverage
- ✅ `mapToDTO()` - Tested indirectly through public methods

### Scenarios Covered
- ✅ **Happy Path**: All normal operations
- ❌ **Error Handling**: Database errors, validation failures
- 🔄 **Edge Cases**: Boundary conditions, special values
- 🔍 **Data Integrity**: Proper mapping, field filtering
- 👥 **User Isolation**: Multi-user scenarios
- ⚡ **Performance**: Large data, rapid operations

### Test Categories
- **Unit Tests**: Individual method testing
- **Integration Tests**: Database interaction scenarios  
- **Edge Case Tests**: Boundary conditions and stress tests
- **Real-World Tests**: Complete user workflows

## 🛠️ Mock Strategy

### Database Mocking
- **Supabase Client**: Fully mocked with proper TypeScript types
- **Query Builder**: Method chaining support with return value control
- **Response Simulation**: Success, error, and no-data scenarios

### Test Data Management
- **Fixtures**: Centralized test data with factory functions
- **Scenarios**: Pre-built real-world test cases
- **Edge Cases**: Boundary value testing data

### Assertion Helpers
- **Query Validation**: Automatic verification of database calls
- **Data Integrity**: DTO mapping and field filtering checks
- **Error Handling**: Proper error propagation testing

## 🔧 Maintenance Guidelines

### Adding New Tests
1. **Method Tests**: Add to appropriate method test file
2. **Edge Cases**: Add to `edgeCases.test.ts`
3. **Test Data**: Add to `fixtures.ts` with factory functions
4. **Mock Utilities**: Add helpers to `shared-mocks.ts`

### Test Data Updates
- Update fixtures when service interface changes
- Maintain backward compatibility in factory functions
- Document breaking changes in test data

### Mock Updates
- Keep mock interfaces in sync with real implementations
- Update assertion helpers when adding new validations
- Maintain type safety across all mocks

## 📈 Benefits of This Structure

### Maintainability
- **Focused Files**: Each file has a single responsibility
- **Shared Utilities**: Reusable mocks and helpers
- **Clear Organization**: Easy to find relevant tests

### Readability
- **Logical Grouping**: Tests grouped by functionality
- **Consistent Patterns**: Standardized test structure
- **Good Documentation**: Clear naming and comments

### Scalability
- **Easy Extension**: Simple to add new test cases
- **Modular Design**: Independent test modules
- **Reusable Components**: Fixtures and mocks can be reused

### Developer Experience
- **Fast Feedback**: Run specific test suites
- **Clear Failures**: Focused error messages
- **Easy Debugging**: Isolated test scenarios 