import type { QueryClient } from '@tanstack/react-query';

import { isOnline, useConnectivity } from '@/lib/network/connectivity';

import { sendMessage } from '../api/mutations';
import { chatsKeys, type MessagesData } from '../api/queries';
import { appendMessage, flattenMessages } from '../utils/messages-cache';
import { type OutboxEntry, sortByLocalOrder, useOutboxStore } from './outbox-store';
import { classifySendError } from './send-error';

const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

/** Test hook: backoff delays are multiplied by this (0 in tests → retry on the next tick). */
export const syncTiming = { backoffScale: 1 };

/**
 * App-wide sender for the outbox. One instance runs for the whole app (mounted by <OutboxSync/>),
 * so queued messages are delivered even if their chat is not open and after an app restart.
 *
 * - Sends strictly one at a time in local order, so queued messages keep their order until confirmed.
 * - Every attempt carries the entry's client ID: a retry of an accepted send returns the same message.
 * - No response (offline, timeout, lost response) → back to the queue, retried with backoff / on reconnect.
 * - HTTP error → failed, with `recoverable` deciding between Retry and "edit / delete".
 */
export function createOutboxSync() {
  let queryClient: QueryClient | null = null;
  let running = false;
  let rerun = false;
  let backoffAttempt = 0;
  let backoffTimer: ReturnType<typeof setTimeout> | null = null;
  const cleanups: Array<() => void> = [];

  const store = () => useOutboxStore.getState();

  const clearBackoff = () => {
    if (backoffTimer) clearTimeout(backoffTimer);
    backoffTimer = null;
  };

  const scheduleBackoff = () => {
    clearBackoff();
    const delay =
      Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** backoffAttempt) * syncTiming.backoffScale;
    backoffAttempt += 1;
    backoffTimer = setTimeout(() => {
      backoffTimer = null;
      void flush();
    }, delay);
  };

  /** True if the server already has this send (e.g. seen in a refetch after a lost response). */
  const alreadyOnServer = (entry: OutboxEntry): boolean => {
    const data = queryClient?.getQueryData<MessagesData>(chatsKeys.messages(entry.chatId));
    return flattenMessages(data).some((message) => message.clientId === entry.clientId);
  };

  const confirm = (entry: OutboxEntry, message: Awaited<ReturnType<typeof sendMessage>>) => {
    const key = chatsKeys.messages(entry.chatId);
    // Only patch a conversation that is loaded; otherwise it is fetched fresh when opened.
    if (queryClient?.getQueryData(key)) {
      queryClient.setQueryData<MessagesData>(key, (data) => appendMessage(data, message));
    }
    store().remove(entry.clientId);
    void queryClient?.invalidateQueries({ queryKey: chatsKeys.list() });
  };

  async function flush(): Promise<void> {
    if (!queryClient) return;
    if (running) {
      rerun = true;
      return;
    }
    if (backoffTimer) return; // waiting for the backoff; kick() cancels it
    running = true;
    try {
      while (isOnline()) {
        const next = sortByLocalOrder(store().entries).find((entry) => entry.status === 'queued');
        if (!next) break;

        if (alreadyOnServer(next)) {
          store().remove(next.clientId);
          continue;
        }

        store().markSending(next.clientId);
        try {
          const message = await sendMessage(next.chatId, {
            clientId: next.clientId,
            text: next.text,
          });
          backoffAttempt = 0;
          confirm(next, message);
        } catch (error) {
          const failure = classifySendError(error);
          if (failure.kind === 'network') {
            store().requeue(next.clientId);
            if (isOnline()) scheduleBackoff(); // lost response / flaky network: retry later
            break; // keep local order: nothing after it goes first
          }
          store().markFailed(next.clientId, failure);
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
    /** User action (send / retry) or reconnect: skip any pending backoff and try now. */
    kick: () => {
      clearBackoff();
      backoffAttempt = 0;
      void flush();
    },
    start(client: QueryClient) {
      queryClient = client;
      // New or re-queued entries.
      cleanups.push(
        useOutboxStore.subscribe((state, previous) => {
          const hasNewQueued = state.entries.some(
            (entry) =>
              entry.status === 'queued' &&
              previous.entries.find((old) => old.clientId === entry.clientId)?.status !== 'queued',
          );
          if (hasNewQueued) void flush();
        }),
      );
      // Reconnect: recover what arrived while offline, then deliver the queue.
      cleanups.push(
        useConnectivity.subscribe((state, previous) => {
          if (isOnline(state) && !isOnline(previous)) {
            void client.invalidateQueries({ queryKey: chatsKeys.all }).finally(() => {
              clearBackoff();
              backoffAttempt = 0;
              void flush();
            });
          }
        }),
      );
      void flush();
    },
    stop() {
      clearBackoff();
      while (cleanups.length > 0) cleanups.pop()?.();
      queryClient = null;
      running = false;
      rerun = false;
      backoffAttempt = 0;
    },
  };
}

/** The single app-wide instance. */
export const outboxSync = createOutboxSync();
