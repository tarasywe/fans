import {
  billingServer,
  simulatedStoreAccount,
  useReceiptQueue,
  useSimulatedStoreFaults,
} from '@features/billing';
import { mockChatServer, useOutboxStore } from '@features/chats';
import { NO_FAULTS, useMockFaults } from '@/lib/mock';
import { clearPersistedQueries } from '@/lib/query-persister';

export type MockScenario =
  | 'offline'
  | 'lost-response'
  | 'server-error'
  | 'clean'
  | 'billing-slow-confirm'
  | 'billing-no-confirm'
  | 'billing-store-fails';

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
    case 'billing-slow-confirm':
      billingServer.setConfig({ confirmDelayMs: 20_000, neverConfirm: false });
      break;
    case 'billing-no-confirm':
      billingServer.setConfig({ neverConfirm: true });
      break;
    case 'billing-store-fails':
      useSimulatedStoreFaults.getState().set({ nextOutcome: 'fail' });
      break;
  }
}

/** Fresh install: mock server data, pending outbox, cached queries and faults. */
export function resetEverything(): void {
  useMockFaults.getState().reset();
  mockChatServer.reset();
  useOutboxStore.getState().clear();
  clearPersistedQueries();
  billingServer.reset();
  simulatedStoreAccount.reset();
  useReceiptQueue.getState().clear();
  useSimulatedStoreFaults.getState().set({ nextOutcome: 'succeed' });
}
