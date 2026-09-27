import { type OutboxEntry, outboxToMessage, sortByLocalOrder } from '../outbox/outbox-store';
import type { Message } from '../types/message';

export type Thread = {
  /** Confirmed messages in server order, then still-pending ones in local order. */
  messages: Message[];
  /** Outbox entries the server already has (e.g. seen after a lost response) — safe to drop. */
  confirmedClientIds: string[];
};

/**
 * Merges server messages with the local outbox. The server owns the final order; pending
 * messages stay at the end in the order they were written. A pending entry whose client ID is
 * already on the server is not shown twice.
 */
export function buildThread(server: readonly Message[], outbox: readonly OutboxEntry[]): Thread {
  const onServer = new Set(
    server.flatMap((message) => (message.clientId ? [message.clientId] : [])),
  );
  const pending: Message[] = [];
  const confirmedClientIds: string[] = [];
  for (const entry of sortByLocalOrder(outbox)) {
    if (onServer.has(entry.clientId)) {
      if (entry.status !== 'sending') confirmedClientIds.push(entry.clientId);
    } else {
      pending.push(outboxToMessage(entry));
    }
  }
  return { messages: [...server, ...pending], confirmedClientIds };
}

/** Stable identity of a bubble: the client ID survives the pending → confirmed transition. */
export function messageKey(message: Message): string {
  return message.clientId ?? message.id;
}
