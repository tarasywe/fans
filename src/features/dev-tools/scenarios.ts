import { mockChatServer, useOutboxStore } from '@features/chats';
import { NO_FAULTS, useMockFaults } from '@/lib/mock';
import { clearPersistedQueries } from '@/lib/query-persister';

export type MockScenario = 'offline' | 'lost-response' | 'server-error' | 'clean';

/** Applies a named fault preset (EXPO_PUBLIC_MOCK_SCENARIO at launch, or the Dev Tools screen). */
export function applyMockScenario(scenario: MockScenario): void {
  const faults = useMockFaults.getState();
  switch (scenario) {
    case 'offline':
      faults.set({ ...NO_FAULTS, offline: true });
      break;
    case 'lost-response':
      faults.set({ ...NO_FAULTS, loseResponses: 1 });
      break;
    case 'server-error':
      faults.set({ ...NO_FAULTS, failWith500: 1 });
      break;
    case 'clean':
      resetEverything();
      break;
  }
}

/** Fresh install: mock server data, pending outbox, cached queries and faults. */
export function resetEverything(): void {
  useMockFaults.getState().reset();
  mockChatServer.reset();
  useOutboxStore.getState().clear();
  clearPersistedQueries();
}
