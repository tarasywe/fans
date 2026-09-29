import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { billingProvider } from '../providers';
import { useBillingSession } from '../store/billing-session';
import { billingSync } from './billing-sync';

/** Mount once near the root: initialises the store SDK and delivers receipts to the backend. */
export function BillingSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    billingProvider
      .init()
      .then(() => billingProvider.getAppUserId())
      .then((appUserId) => {
        if (!cancelled) useBillingSession.setState({ appUserId, initError: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          useBillingSession.setState({
            initError: error instanceof Error ? error.message : 'Billing unavailable',
          });
        }
      });
    billingSync.start(queryClient);
    return () => {
      cancelled = true;
      billingSync.stop();
    };
  }, [queryClient]);

  return null;
}
