import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { create } from 'zustand';

import { USE_MOCK_API } from '@/config/api';
import { useMockFaults } from '@/lib/mock/mock-faults';

type ConnectivityState = {
  /** Device network (NetInfo). `null` until the first report — treated as online. */
  deviceOnline: boolean | null;
  /** Simulated airplane mode (mock API only, Dev Tools). */
  simulatedOffline: boolean;
};

export const useConnectivity = create<ConnectivityState>()(() => ({
  deviceOnline: null,
  simulatedOffline: USE_MOCK_API && useMockFaults.getState().offline,
}));

export function isOnline(state: ConnectivityState = useConnectivity.getState()): boolean {
  return state.deviceOnline !== false && !state.simulatedOffline;
}

export function useIsOnline(): boolean {
  return useConnectivity(isOnline);
}

/**
 * React Query's onlineManager follows connectivity from module load — not from an effect — so
 * queries created during the first render already see "offline" and pause instead of failing.
 */
onlineManager.setEventListener((setOnline) => {
  setOnline(isOnline());
  return useConnectivity.subscribe((state) => setOnline(isOnline(state)));
});

let started = false;

/**
 * Starts listening to NetInfo and the mock "offline" fault (which drive onlineManager above, so
 * queries pause while offline and refetch on reconnect). Idempotent.
 */
export function startConnectivity(): () => void {
  if (started) return () => undefined;
  started = true;
  useConnectivity.setState({ simulatedOffline: USE_MOCK_API && useMockFaults.getState().offline });

  const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    useConnectivity.setState({ deviceOnline: state.isConnected !== false });
  });
  const unsubscribeFaults = useMockFaults.subscribe((faults) => {
    if (USE_MOCK_API) useConnectivity.setState({ simulatedOffline: faults.offline });
  });

  return () => {
    unsubscribeNetInfo();
    unsubscribeFaults();
    started = false;
  };
}
