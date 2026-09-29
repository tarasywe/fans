import { useQuery } from '@tanstack/react-query';

import { http } from '@/lib/http/http-client';

import { billingTiming } from '../constants';
import { useBillingSession } from '../store/billing-session';
import { useReceiptQueue } from '../store/receipt-queue';
import { AccessSchema } from '../types/access';
import { APP_USER_ID_HEADER, billingEndpoints } from './endpoints';

export const billingKeys = {
  all: ['billing'] as const,
  access: (appUserId: string) => ['billing', 'access', appUserId] as const,
};

export const appUserHeaders = (appUserId: string) => ({ [APP_USER_ID_HEADER]: appUserId });

export async function fetchAccess(appUserId: string) {
  const { data } = await http.get(billingEndpoints.access, { headers: appUserHeaders(appUserId) });
  return AccessSchema.parse(data);
}

/**
 * Paid access as the backend sees it. Polls while a purchase is waiting for confirmation (either
 * still queued on this device or received-but-unconfirmed on the backend).
 */
export function useAccessQuery() {
  const appUserId = useBillingSession((state) => state.appUserId);
  const queued = useReceiptQueue((state) => state.entries.length > 0);
  return useQuery({
    queryKey: billingKeys.access(appUserId ?? ''),
    queryFn: () => fetchAccess(appUserId ?? ''),
    enabled: appUserId !== null,
    refetchInterval: (query) =>
      queued || (query.state.data?.pendingTransactionIds.length ?? 0) > 0
        ? billingTiming.accessPollMs
        : false,
  });
}
