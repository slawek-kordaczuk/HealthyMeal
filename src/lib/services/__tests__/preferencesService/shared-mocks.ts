import { vi, expect, type MockedFunction } from "vitest";

// Mock types for better type safety
export interface MockSupabaseClient {
  from: MockedFunction<(table: string) => MockSupabaseQueryBuilder>;
}

export interface MockSupabaseQueryBuilder {
  select: MockedFunction<(columns: string) => MockSupabaseQueryBuilder>;
  insert: MockedFunction<(data: Record<string, unknown>) => MockSupabaseQueryBuilder>;
  update: MockedFunction<(data: Record<string, unknown>) => MockSupabaseQueryBuilder>;
  eq: MockedFunction<(column: string, value: unknown) => MockSupabaseQueryBuilder>;
  single: MockedFunction<() => Promise<{ data: unknown; error: unknown }>>;
}

// Factory for creating mock Supabase client
export function createMockSupabase(): {
  mockSupabase: MockSupabaseClient;
  mockQueryBuilder: MockSupabaseQueryBuilder;
} {
  const mockQueryBuilder: MockSupabaseQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  const mockSupabase: MockSupabaseClient = {
    from: vi.fn().mockReturnValue(mockQueryBuilder),
  };

  return { mockSupabase, mockQueryBuilder };
}

// Helper functions for common assertions
export function expectQueryStructure(
  mockSupabase: MockSupabaseClient,
  mockQueryBuilder: MockSupabaseQueryBuilder,
  table: string
) {
  expect(mockSupabase.from).toHaveBeenCalledWith(table);
}

export function expectUserQuery(mockQueryBuilder: MockSupabaseQueryBuilder, userId: string) {
  expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
}

export function expectInsertCall(mockQueryBuilder: MockSupabaseQueryBuilder, expectedData: Record<string, unknown>) {
  expect(mockQueryBuilder.insert).toHaveBeenCalledWith(expectedData);
}

export function expectUpdateCall(mockQueryBuilder: MockSupabaseQueryBuilder, expectedData: Record<string, unknown>) {
  expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining(expectedData));
}

export function expectTimestampInUpdate(mockQueryBuilder: MockSupabaseQueryBuilder) {
  const updateCall = mockQueryBuilder.update.mock.calls[0]?.[0];
  expect(updateCall?.updated_at).toBeDefined();
  expect(updateCall?.updated_at).toBeTypeOf("string");
  expect(new Date(updateCall?.updated_at as string)).toBeInstanceOf(Date);
}

// Mock response builders
export function mockSuccessResponse(data: unknown) {
  return { data, error: null };
}

export function mockErrorResponse(error: unknown) {
  return { data: null, error };
}

export function mockNoDataResponse() {
  return { data: null, error: null };
}

// Reset all mocks utility
export function resetAllMocks(mockQueryBuilder: MockSupabaseQueryBuilder) {
  Object.values(mockQueryBuilder).forEach((mockFn) => {
    if (vi.isMockFunction(mockFn)) {
      mockFn.mockReset();
    }
  });
}
