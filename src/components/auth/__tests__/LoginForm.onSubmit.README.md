# LoginForm onSubmit Tests Documentation

## Overview

The `LoginForm.onSubmit.test.tsx` file contains comprehensive unit tests for the form submission logic in the `LoginForm` component. These tests focus on business-critical functionality including API communication, state management, error handling, and user experience.

## Test Structure

The tests are organized into 6 main categories with **12 total tests**:

### 🚀 Successful Login Flow (3 tests)
Tests that verify the happy path of user authentication.

#### **should handle successful login with custom callback**
- **Purpose**: Validates the complete successful login flow with custom success handling
- **Business Value**: Ensures users can successfully authenticate and be redirected properly
- **Coverage**: API call validation, form data transmission, callback execution
- **Key Assertions**: 
  - Correct API endpoint called with proper data
  - `credentials: "include"` for session handling
  - Success callback invoked exactly once

#### **should show loading state during API call**
- **Purpose**: Verifies proper UX feedback during authentication
- **Business Value**: Prevents user confusion and duplicate submissions
- **Coverage**: Loading state UI, button text changes, disabled state
- **Key Assertions**:
  - Button shows "Logowanie..." text
  - Button is disabled during API call
  - Returns to normal state after completion

#### **should disable form inputs during loading**
- **Purpose**: Ensures form cannot be modified during submission
- **Business Value**: Prevents data corruption and improves UX consistency
- **Coverage**: Input field disabled states, form interaction blocking
- **Key Assertions**:
  - Email and password inputs disabled during loading
  - Inputs re-enabled after API completion

### ❌ API Error Handling (3 tests)
Critical tests for robust error handling and user feedback.

#### **should handle API error response with custom message**
- **Purpose**: Validates server-side error message display
- **Business Value**: Provides specific feedback for authentication failures
- **Coverage**: API error responses, error message extraction, UI updates
- **Key Assertions**:
  - Custom error message displayed to user
  - Form re-enabled after error
  - Proper error state handling

#### **should handle API error response without custom message**
- **Purpose**: Tests fallback error handling for unexpected responses
- **Business Value**: Ensures users always receive feedback, even for edge cases
- **Coverage**: Default error messages, graceful degradation
- **Key Assertions**:
  - Default Polish error message shown
  - Form remains functional after error

#### **should handle network errors gracefully**
- **Purpose**: Validates handling of connection and network issues
- **Business Value**: Maintains application stability during infrastructure problems
- **Coverage**: Network failures, fetch rejections, error logging
- **Key Assertions**:
  - Network errors displayed to user
  - Application doesn't crash
  - Error logged for debugging

### 🔧 State Management (1 test)
Tests for proper component state handling across multiple interactions.

#### **should clear previous error when submitting again**
- **Purpose**: Ensures clean state between submission attempts
- **Business Value**: Prevents user confusion from stale error messages
- **Coverage**: Error state clearing, multi-submission scenarios
- **Key Assertions**:
  - Previous errors removed on new submission
  - State properly reset between attempts

### 🔗 Navigation and Callbacks (1 test)
Tests for proper integration with parent components and navigation.

#### **should call custom navigation callbacks**
- **Purpose**: Validates component integration and navigation handling
- **Business Value**: Ensures proper user flow between authentication screens
- **Coverage**: Callback function execution, navigation link functionality
- **Key Assertions**:
  - Register navigation callback invoked
  - Password recovery callback invoked
  - Proper event handling

### 🎯 Integration Scenarios (2 tests)
Tests for real-world usage patterns and edge cases.

#### **should not call API when form validation fails**
- **Purpose**: Ensures validation prevents unnecessary API calls
- **Business Value**: Reduces server load and improves performance
- **Coverage**: Form validation integration, API call prevention
- **Key Assertions**:
  - Validation errors displayed
  - No API calls made with invalid data
  - Form validation properly integrated

#### **should prevent rapid successive submissions**
- **Purpose**: Prevents duplicate submissions and race conditions
- **Business Value**: Ensures data integrity and prevents multiple charges/actions
- **Coverage**: Button disabled state, API call counting, UI state management
- **Key Assertions**:
  - Only one API call made despite multiple clicks
  - Button disabled during processing
  - Proper state management

### 🔒 Security (2 tests)
Critical security-related functionality tests.

#### **should include credentials in API request**
- **Purpose**: Validates proper session handling and authentication
- **Business Value**: Ensures secure authentication and session management
- **Coverage**: HTTP request configuration, credential handling
- **Key Assertions**:
  - `credentials: "include"` in fetch options
  - Proper cookie/session handling

#### **should log errors for debugging**
- **Purpose**: Ensures proper error logging for development and monitoring
- **Business Value**: Enables debugging and monitoring in production
- **Coverage**: Console logging, error tracking
- **Key Assertions**:
  - Errors logged to console with context
  - Original error details preserved for debugging

## Testing Techniques Used

### **Mocking Strategies**
- **Global fetch**: Mocked to simulate API responses
- **window.location**: Mocked for navigation testing
- **Console methods**: Spied on for error logging verification
- **Component callbacks**: Mocked to verify invocation

### **Async Testing**
- **waitFor()**: Used for async operations and state changes
- **Promise-based mocks**: For testing loading states and timing
- **User interaction simulation**: Via `@testing-library/user-event`

### **State Testing**
- **DOM assertions**: Verifying UI state changes
- **Function call verification**: Ensuring callbacks are invoked
- **Error boundary testing**: Validating error handling

## Business Impact

These tests ensure:

1. **User Trust**: Reliable authentication builds user confidence
2. **Security**: Proper credential handling protects user data
3. **Performance**: Validation prevents unnecessary server requests
4. **UX Quality**: Loading states and error handling improve user experience
5. **Maintainability**: Comprehensive coverage enables safe refactoring
6. **Monitoring**: Error logging enables production issue detection

## Test Execution

```bash
# Run only onSubmit tests
npm run test src/components/auth/__tests__/LoginForm.onSubmit.test.tsx

# Run with watch mode
npm run test src/components/auth/__tests__/LoginForm.onSubmit.test.tsx -- --watch

# Run with coverage (if configured)
npm run test:coverage src/components/auth/__tests__/LoginForm.onSubmit.test.tsx
```

## Maintenance Notes

- **API Changes**: Update mocks if login endpoint changes
- **Error Messages**: Update assertions if Polish error messages change
- **UI Changes**: Update selectors if form structure changes
- **Business Logic**: Add new tests for new authentication features

## Security Considerations Tested

1. **Credential Handling**: Ensures `credentials: "include"` is set
2. **Error Logging**: Verifies errors are logged for monitoring
3. **State Management**: Prevents information leakage between attempts
4. **Input Validation**: Ensures client-side validation works correctly

## Performance Implications

- **Duplicate Submission Prevention**: Saves server resources
- **Validation Before API Calls**: Reduces unnecessary network requests
- **Proper Loading States**: Improves perceived performance
- **Error Recovery**: Maintains application responsiveness

This comprehensive test suite provides confidence that the LoginForm component handles all critical authentication scenarios reliably and securely. 