import { useOutboxStore } from '@features/chats';
import { useMockFaults } from '@/lib/mock';

import { applyLaunchScenario } from '../launch-scenario';

beforeEach(() => {
  useOutboxStore.getState().clear();
  useMockFaults.getState().reset();
});

describe('launch scenario (EXPO_PUBLIC_MOCK_SCENARIO)', () => {
  it('"clean" wipes once per script run, not on every cold start of that run', () => {
    expect(applyLaunchScenario('clean', 'run-1')).toBe(true);

    // Offline messages queued, then the app is force-quit and reopened with the same bundle.
    useOutboxStore.getState().enqueue('c_1', 'one');
    useOutboxStore.getState().enqueue('c_1', 'two');
    expect(applyLaunchScenario('clean', 'run-1')).toBe(false);
    expect(useOutboxStore.getState().entries).toHaveLength(2);

    // A new `npm run start:mock:clean` wipes again.
    expect(applyLaunchScenario('clean', 'run-2')).toBe(true);
    expect(useOutboxStore.getState().entries).toHaveLength(0);
  });

  it('"offline" is not forced back on after the user turned it off and restarted', () => {
    applyLaunchScenario('offline', 'run-3');
    expect(useMockFaults.getState().offline).toBe(true);
    useMockFaults.getState().set({ offline: false });

    applyLaunchScenario('offline', 'run-3');
    expect(useMockFaults.getState().offline).toBe(false);
  });
});
