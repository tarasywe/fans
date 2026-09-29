import { MockHttpError, type MockRequest, type MockRoute } from '@/lib/mock';

import { APP_USER_ID_HEADER, billingEndpoints } from '../api/endpoints';
import { ConfirmPurchaseInputSchema } from '../types/receipt';
import { StoreEventInputSchema } from '../types/store-event';
import { BillingServerError, billingServer } from './billing-server';

function appUserId(request: MockRequest): string {
  const id = request.headers[APP_USER_ID_HEADER];
  if (!id) throw new MockHttpError(401, 'Missing app user id');
  return id;
}

function run<T>(action: () => T): T {
  try {
    return action();
  } catch (error) {
    if (error instanceof BillingServerError) throw new MockHttpError(error.status, error.message);
    throw error;
  }
}

export const billingMockRoutes: MockRoute[] = [
  {
    method: 'get',
    path: billingEndpoints.access,
    handler: (request) => billingServer.access(appUserId(request)),
  },
  {
    method: 'post',
    path: billingEndpoints.purchases,
    handler: (request) => {
      const parsed = ConfirmPurchaseInputSchema.safeParse(request.body);
      if (!parsed.success)
        throw new MockHttpError(400, parsed.error.issues[0]?.message ?? 'Invalid body');
      return run(() => billingServer.confirmPurchase(appUserId(request), parsed.data));
    },
  },
  {
    method: 'post',
    path: billingEndpoints.storeEvents,
    handler: (request) => {
      const parsed = StoreEventInputSchema.safeParse(request.body);
      if (!parsed.success)
        throw new MockHttpError(400, parsed.error.issues[0]?.message ?? 'Invalid body');
      return run(() => billingServer.applyStoreEvent(appUserId(request), parsed.data));
    },
  },
];
