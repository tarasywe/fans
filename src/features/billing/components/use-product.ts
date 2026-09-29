import { useQuery } from '@tanstack/react-query';

import { billingProvider } from '../providers';
import { useBillingSession } from '../store/billing-session';

/** Product + price from the store (RevenueCat offering or the simulated catalogue). */
export function useProduct() {
  const ready = useBillingSession((state) => state.appUserId !== null);
  return useQuery({
    queryKey: ['billing', 'product', billingProvider.kind],
    queryFn: () => billingProvider.getProduct(),
    enabled: ready,
    staleTime: 5 * 60_000,
  });
}
