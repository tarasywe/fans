import { http } from '@/lib/http/http-client';

import { AccessSchema } from '../types/access';
import { type ConfirmPurchaseInput, ConfirmPurchaseInputSchema } from '../types/receipt';
import { type StoreEventInput, StoreEventInputSchema } from '../types/store-event';
import { billingEndpoints } from './endpoints';
import { appUserHeaders } from './queries';

/** Sends a store receipt for server-side confirmation. Idempotent by transaction id. */
export async function confirmPurchase(appUserId: string, input: ConfirmPurchaseInput) {
  const body = ConfirmPurchaseInputSchema.parse(input);
  const { data } = await http.post(billingEndpoints.purchases, body, {
    headers: appUserHeaders(appUserId),
  });
  return AccessSchema.parse(data);
}

/** Simulates a store → backend webhook (cancellation, refund, …). Idempotent by event id. */
export async function postStoreEvent(appUserId: string, input: StoreEventInput) {
  const body = StoreEventInputSchema.parse(input);
  const { data } = await http.post(billingEndpoints.storeEvents, body, {
    headers: appUserHeaders(appUserId),
  });
  return AccessSchema.parse(data);
}
