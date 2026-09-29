import type { QueryClient } from '@tanstack/react-query';

import { postStoreEvent } from './api/mutations';
import { billingKeys } from './api/queries';
import { billingTiming } from './constants';
import { billingProvider } from './providers';
import type { PurchaseOutcome, RestoreOutcome } from './providers/billing-provider';
import { usePurchaseFlow } from './store/purchase-flow-store';
import { useReceiptQueue } from './store/receipt-queue';
import { billingSync } from './sync/billing-sync';
import type { Receipt } from './types/receipt';

let inFlight: Promise<unknown> | null = null;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), billingTiming.storeTimeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Runs one store flow at a time. A second call while one is running returns the running one
 * instead of opening another store sheet (repeated taps cannot start duplicate purchases).
 */
function exclusive<T>(
  busy: NonNullable<ReturnType<typeof usePurchaseFlow.getState>['busy']>,
  run: () => Promise<T>,
  /** Result when the flow throws (e.g. timed out): the error is shown, callers never see a rejection. */
  fallback: T,
): Promise<T> {
  if (inFlight) return inFlight as Promise<T>;
  const flow = usePurchaseFlow.getState();
  flow.setBusy(busy);
  flow.setNotice(null);
  const promise = run()
    .catch((error: unknown) => {
      usePurchaseFlow.getState().setNotice({
        tone: 'error',
        text:
          error instanceof Error ? error.message : 'The store did not respond. Please try again.',
      });
      return fallback;
    })
    .finally(() => {
      inFlight = null;
      usePurchaseFlow.getState().setBusy(null);
    });
  inFlight = promise;
  return promise;
}

/** Durably queues a store receipt for backend confirmation (idempotent by transaction id). */
export function submitReceipt(receipt: Receipt, restored: boolean): void {
  useReceiptQueue.getState().enqueue(receipt, restored);
  billingSync.kick();
}

export function purchase(productId: string): Promise<PurchaseOutcome> {
  return exclusive(
    'purchase',
    async () => {
      const outcome = await withTimeout(
        billingProvider.purchase(productId),
        'The store did not respond. You were not charged twice — check your subscription status.',
      );
      const { setNotice } = usePurchaseFlow.getState();
      if (outcome.status === 'purchased') {
        submitReceipt(outcome.receipt, false);
        setNotice({
          tone: 'info',
          text: 'Payment received. Waiting for the server to confirm your access…',
          awaitingConfirmation: true,
        });
      } else if (outcome.status === 'cancelled') {
        setNotice({ tone: 'info', text: 'Purchase cancelled. You were not charged.' });
      } else {
        // Existing access is untouched: a failed store attempt never reaches the backend.
        setNotice({ tone: 'error', text: `Purchase failed: ${outcome.message}` });
      }
      return outcome;
    },
    { status: 'failed', message: 'The store did not respond.' } as PurchaseOutcome,
  );
}

export function restore() {
  return exclusive(
    'restore',
    async () => {
      const outcome = await withTimeout(
        billingProvider.restore(),
        'The store did not respond to the restore request.',
      );
      const { setNotice } = usePurchaseFlow.getState();
      if (outcome.status === 'failed') {
        setNotice({ tone: 'error', text: `Restore failed: ${outcome.message}` });
      } else if (outcome.receipts.length === 0) {
        setNotice({ tone: 'info', text: 'No previous purchases found for this store account.' });
      } else {
        for (const receipt of outcome.receipts) submitReceipt(receipt, true);
        setNotice({
          tone: 'info',
          text: 'Purchase found. Asking the server to restore your access…',
          awaitingConfirmation: true,
        });
      }
      return outcome;
    },
    { status: 'failed', message: 'The store did not respond.' } as RestoreOutcome,
  );
}

function eventId(type: string) {
  return `${type.toLowerCase()}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

type SubscriptionTarget = { client: QueryClient; appUserId: string; transactionId: string };

/**
 * Turns auto-renew off. Access stays until the paid period ends. With the simulated store the
 * store's webhook to the backend is simulated here; with RevenueCat the store UI opens and the
 * backend would learn about it from the RevenueCat webhook.
 */
export function cancelSubscription({ client, appUserId, transactionId }: SubscriptionTarget) {
  return exclusive(
    'cancel',
    async () => {
      const result = await withTimeout(
        billingProvider.cancelSubscription(transactionId),
        'Subscription settings did not respond.',
      );
      const { setNotice } = usePurchaseFlow.getState();
      if (result === 'cancelled') {
        const access = await postStoreEvent(appUserId, {
          eventId: eventId('CANCELLATION'),
          type: 'CANCELLATION',
          transactionId,
        });
        client.setQueryData(billingKeys.access(appUserId), access);
        setNotice({
          tone: 'info',
          text: 'Subscription cancelled. You keep access until the end of the paid period.',
        });
      } else {
        await client.invalidateQueries({ queryKey: billingKeys.all });
      }
      return result;
    },
    'opened-store' as const,
  );
}

export function resubscribe({ client, appUserId, transactionId }: SubscriptionTarget) {
  return exclusive(
    'resubscribe',
    async () => {
      const result = await withTimeout(
        billingProvider.resubscribe(transactionId),
        'Subscription settings did not respond.',
      );
      if (result === 'resubscribed') {
        const access = await postStoreEvent(appUserId, {
          eventId: eventId('UNCANCELLATION'),
          type: 'UNCANCELLATION',
          transactionId,
        });
        client.setQueryData(billingKeys.access(appUserId), access);
        usePurchaseFlow.getState().setNotice({ tone: 'success', text: 'Auto-renew is back on.' });
      } else {
        await client.invalidateQueries({ queryKey: billingKeys.all });
      }
      return result;
    },
    'opened-store' as const,
  );
}
