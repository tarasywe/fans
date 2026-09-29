import { useEffect, useRef } from 'react';

import { useAccessQuery } from './api/queries';
import { useBillingSession } from './store/billing-session';
import { usePurchaseFlow } from './store/purchase-flow-store';
import { useReceiptQueue } from './store/receipt-queue';
import { derivePremiumState, type PremiumState } from './utils/premium-state';

const LOST_ACCESS = new Set<PremiumState['kind']>(['none', 'expired', 'refunded']);

export function usePremiumState(): PremiumState {
  const access = useAccessQuery();
  const receipts = useReceiptQueue((state) => state.entries);
  const appUserId = useBillingSession((state) => state.appUserId);
  const state = derivePremiumState(access.data, receipts, {
    isLoading: appUserId === null || (access.isPending && access.fetchStatus !== 'paused'),
    isError: access.isError || (access.isPending && access.fetchStatus === 'paused'),
  });

  const kind = state.kind;
  const previousKind = useRef(kind);
  useEffect(() => {
    const lostAccess = previousKind.current === 'active' && LOST_ACCESS.has(kind);
    previousKind.current = kind;
    const { notice, setNotice } = usePurchaseFlow.getState();
    if (kind === 'active' && notice?.awaitingConfirmation) {
      setNotice({ tone: 'success', text: 'Confirmed by the server — Premium is unlocked.' });
    } else if (lostAccess) {
      // Access ended outside any flow (refund, expiry, reinstall): the last
      // flow's message ("Auto-renew is back on") would now contradict the status card.
      setNotice(null);
    }
  }, [kind]);
  return state;
}
