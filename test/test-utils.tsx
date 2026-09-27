import { chatsMockRoutes, OutboxSync } from '@features/chats';
import { usersMockRoutes } from '@features/users';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { render, screen } from '@testing-library/react-native';
import { isAxiosError } from 'axios';
import type { ReactElement, ReactNode } from 'react';
import { http } from '@/lib/http/http-client';
import { installMockApi, NO_FAULTS, useMockFaults } from '@/lib/mock';
import { useConnectivity } from '@/lib/network/connectivity';
import { createQueryPersister, shouldPersistQuery } from '@/lib/query-persister';

import { syncTiming } from '../src/features/chats/outbox/outbox-sync';

/** Wires the shared Axios client to the feature mocks (zero delay unless `latencyMs` is given). */
export function installTestMocks(latencyMs = 0): void {
  installMockApi(http, [...usersMockRoutes, ...chatsMockRoutes], {
    minMs: latencyMs,
    maxMs: latencyMs,
  });
  syncTiming.backoffScale = 0; // retries after a lost response happen on the next tick
}

export function resetNetwork(): void {
  useMockFaults.setState(NO_FAULTS);
  useConnectivity.setState({ deviceOnline: null, simulatedOffline: false });
}

/** Simulated airplane mode, applied before anything renders (like a device that starts offline). */
export function startOffline(): void {
  useMockFaults.getState().set({ offline: true });
  useConnectivity.setState({ simulatedOffline: true });
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
}

/** Renders with React Query and the app-wide outbox sync (like AppProviders). */
export async function renderWithQuery(ui: ReactElement, client = createTestQueryClient()) {
  const result = await render(
    <QueryClientProvider client={client}>
      <OutboxSync />
      {ui}
    </QueryClientProvider>,
  );
  return { ...result, client };
}

function PersistedProviders({ client, children }: { client: QueryClient; children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: createQueryPersister(0),
        buster: 'test',
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}
    >
      <OutboxSync />
      {children}
    </PersistQueryClientProvider>
  );
}

/**
 * Renders like the real app: the query cache is persisted to (and restored from) MMKV, so a
 * later `simulateAppRestart()` + render starts from what was on disk.
 */
export async function renderPersistedApp(ui: ReactElement) {
  const client = createTestQueryClient();
  const result = await render(<PersistedProviders client={client}>{ui}</PersistedProviders>);
  return { ...result, client };
}

/** Waits until something from the restored cache is on screen. */
export async function waitForRestore(testID: string) {
  return screen.findByTestId(testID, {}, { timeout: 3000 });
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
