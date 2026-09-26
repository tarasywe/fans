import { chatsMockRoutes } from '@features/chats';
import { usersMockRoutes } from '@features/users';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { isAxiosError } from 'axios';
import type { ReactElement } from 'react';
import { http } from '@/lib/http/http-client';
import { installMockApi } from '@/lib/mock';

/** Wires the shared Axios client to the feature mocks (zero delay unless `latencyMs` is given). */
export function installTestMocks(latencyMs = 0): void {
  installMockApi(http, [...usersMockRoutes, ...chatsMockRoutes], {
    minMs: latencyMs,
    maxMs: latencyMs,
  });
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
}

export async function renderWithQuery(ui: ReactElement, client = createTestQueryClient()) {
  const result = await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return { ...result, client };
}

/** Resolves with the HTTP status an Axios call failed with (throws if it succeeded). */
export async function failureStatus(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
  } catch (error) {
    return isAxiosError(error) ? error.response?.status : undefined;
  }
  throw new Error('Expected the request to fail');
}
