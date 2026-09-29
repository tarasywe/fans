import { installTestMocks, resetNetwork } from '@test/test-utils';
import { clearPersistedQueries } from '@/lib/query-persister';

import { resetColdStartPaywall } from '../cold-start-paywall';
import { billingServer } from '../mocks/billing-server';
import { simulatedStoreAccount, useSimulatedStoreFaults } from '../providers/simulated-store';
import { useBillingSession } from '../store/billing-session';
import { usePurchaseFlow } from '../store/purchase-flow-store';
import { useReceiptQueue } from '../store/receipt-queue';

/** Fresh install for billing: no purchases anywhere, instant store sheet, given backend delay. */
export function freshBilling({ confirmDelayMs = 0 }: { confirmDelayMs?: number } = {}) {
  installTestMocks();
  resetNetwork();
  clearPersistedQueries();
  billingServer.reset();
  billingServer.setConfig({ confirmDelayMs, neverConfirm: false });
  simulatedStoreAccount.reset();
  useSimulatedStoreFaults.getState().set({ nextOutcome: 'succeed', sheetDelayMs: 0 });
  useReceiptQueue.getState().clear();
  usePurchaseFlow.setState({ busy: null, notice: null });
  useBillingSession.setState({ appUserId: null, initError: null });
  resetColdStartPaywall();
}

export const serverAccess = () => {
  const { appUserId } = useBillingSession.getState();
  if (!appUserId) throw new Error('billing not initialised');
  return billingServer.access(appUserId);
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
