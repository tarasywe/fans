import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createKvStorage, zustandStorage } from '@/lib/storage/kv-storage';

/**
 * Faults the mock network injects on demand (Dev Tools screen, EXPO_PUBLIC_MOCK_SCENARIO, tests).
 * Persisted so a simulated offline state survives a force-quit, like real airplane mode.
 */
export type MockFaults = {
  /** Every request fails before reaching the mock server (like airplane mode). */
  offline: boolean;
  /** The next N POSTs are accepted by the server, then the response is lost (network error). */
  loseResponses: number;
  /** The next N POSTs are rejected with HTTP 500 without reaching the server. */
  failWith500: number;
};

type MockFaultsState = MockFaults & {
  set: (faults: Partial<MockFaults>) => void;
  reset: () => void;
  /** Decrements a counter; returns true if the fault applies to this request. */
  consume: (key: 'loseResponses' | 'failWith500') => boolean;
};

export const NO_FAULTS: MockFaults = { offline: false, loseResponses: 0, failWith500: 0 };

export const useMockFaults = create<MockFaultsState>()(
  persist(
    (set, get) => ({
      ...NO_FAULTS,
      set: (faults) => set(faults),
      reset: () => set(NO_FAULTS),
      consume: (key) => {
        const remaining = get()[key];
        if (remaining <= 0) return false;
        set({ [key]: remaining - 1 } as Pick<MockFaults, typeof key>);
        return true;
      },
    }),
    {
      name: 'mock-faults',
      storage: zustandStorage(createKvStorage('fans-dev-tools')),
      partialize: ({ offline, loseResponses, failWith500 }) => ({
        offline,
        loseResponses,
        failWith500,
      }),
    },
  ),
);
