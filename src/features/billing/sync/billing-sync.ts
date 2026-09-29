import type { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { isOnline, useConnectivity } from '@/lib/network/connectivity';

import { confirmPurchase } from '../api/mutations';
import { billingKeys } from '../api/queries';
import { useBillingSession } from '../store/billing-session';
import { useReceiptQueue } from '../store/receipt-queue';

/** Test hook: backoff multiplier (0 in tests). */
export const billingSyncTiming = { backoffScale: 1 };

const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Delivers store receipts to the backend, one at a time, idempotently (same transaction id →
 * same result). A receipt leaves the queue when the backend *records* it; access is granted only
 * later, when the backend reports it confirmed (the access query polls meanwhile).
 */
export function createBillingSync() {
  let client: QueryClient | null = null;
  let running = false;
  let rerun = false;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cleanups: Array<() => void> = [];
  const queue = () => useReceiptQueue.getState();

  const schedule = () => {
    if (timer) clearTimeout(timer);
    const delay =
      Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt) * billingSyncTiming.backoffScale;
    attempt += 1;
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, delay);
  };

  async function flush(): Promise<void> {
    const appUserId = useBillingSession.getState().appUserId;
    if (!client || !appUserId) return;
    if (running) {
      rerun = true;
      return;
    }
    if (timer) return;
    running = true;
    try {
      while (isOnline()) {
        const next = queue().entries.find((entry) => entry.status === 'queued');
        if (!next) break;
        queue().markSending(next.transactionId);
        try {
          const access = await confirmPurchase(appUserId, {
            transactionId: next.transactionId,
            productId: next.productId,
            store: next.store,
            purchasedAt: next.purchasedAt,
            restored: next.restored,
          });
          attempt = 0;
          client.setQueryData(billingKeys.access(appUserId), access);
          queue().remove(next.transactionId);
        } catch (error) {
          const status = isAxiosError(error) ? error.response?.status : undefined;
          if (status === undefined || status >= 500 || status === 429) {
            // No answer / temporary: keep it and try again later with the same transaction id.
            queue().requeue(next.transactionId);
            if (isOnline()) schedule();
            break;
          }
          const reason =
            isAxiosError(error) && typeof error.response?.data?.message === 'string'
              ? error.response.data.message
              : 'The server rejected this purchase.';
          queue().markFailed(next.transactionId, reason);
        }
      }
    } finally {
      running = false;
      if (rerun) {
        rerun = false;
        void flush();
      }
    }
  }

  return {
    flush,
    kick() {
      if (timer) clearTimeout(timer);
      timer = null;
      attempt = 0;
      void flush();
    },
    start(queryClient: QueryClient) {
      client = queryClient;
      cleanups.push(
        useReceiptQueue.subscribe((state, previous) => {
          if (
            state.entries.some(
              (e) =>
                e.status === 'queued' &&
                !previous.entries.some(
                  (p) => p.transactionId === e.transactionId && p.status === 'queued',
                ),
            )
          ) {
            void flush();
          }
        }),
        useBillingSession.subscribe((state, previous) => {
          if (state.appUserId && state.appUserId !== previous.appUserId) void flush();
        }),
        useConnectivity.subscribe((state, previous) => {
          if (isOnline(state) && !isOnline(previous)) this.kick();
        }),
      );
      void flush();
    },
    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      while (cleanups.length > 0) cleanups.pop()?.();
      client = null;
      running = false;
      rerun = false;
      attempt = 0;
    },
  };
}

export const billingSync = createBillingSync();
