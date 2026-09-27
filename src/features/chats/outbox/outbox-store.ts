import { create } from 'zustand';

import { CURRENT_USER_ID } from '@/config/session';
import { createKvStorage, readJson, writeJson } from '@/lib/storage/kv-storage';

import type { TextMessage } from '../types/message';
import { createClientId } from './client-id';
import type { SendError } from './send-error';

/**
 * queued  — durably saved, waiting to be sent (offline or waiting for its turn / backoff).
 * sending — a request is in flight.
 * failed  — the server answered with an error; `error` says whether Retry can help.
 */
export type OutboxStatus = 'queued' | 'sending' | 'failed';

export type OutboxEntry = {
  /** Stable idempotency key, also the React key of the bubble before and after confirmation. */
  clientId: string;
  chatId: string;
  text: string;
  createdAt: string;
  /** Local order: queued messages are shown and sent in this order until the server confirms. */
  seq: number;
  status: OutboxStatus;
  attempts: number;
  error: SendError | null;
};

type OutboxState = {
  entries: OutboxEntry[];
  nextSeq: number;
  enqueue: (chatId: string, text: string) => OutboxEntry;
  markSending: (clientId: string) => void;
  /** Back to the queue (network error): it will be re-sent automatically with the same client ID. */
  requeue: (clientId: string) => void;
  markFailed: (clientId: string, error: SendError) => void;
  retry: (clientId: string) => void;
  remove: (clientId: string) => void;
  clear: () => void;
  /** Reloads from disk (app start). In-flight sends have an unknown outcome and are re-queued. */
  rehydrate: () => void;
};

type PersistedOutbox = { version: 1; entries: OutboxEntry[]; nextSeq: number };

export const outboxStorage = createKvStorage('fans-outbox');
export const OUTBOX_STORAGE_KEY = 'outbox-v1';

function readFromDisk(): Pick<OutboxState, 'entries' | 'nextSeq'> {
  const saved = readJson<PersistedOutbox>(outboxStorage, OUTBOX_STORAGE_KEY);
  if (saved?.version !== 1) return { entries: [], nextSeq: 1 };
  return {
    // Re-sending an in-flight message is safe: its client ID makes the server return the
    // message it may already have accepted.
    entries: saved.entries.map((entry) =>
      entry.status === 'sending' ? { ...entry, status: 'queued', error: null } : entry,
    ),
    nextSeq: saved.nextSeq,
  };
}

const patch = (entries: OutboxEntry[], clientId: string, change: Partial<OutboxEntry>) =>
  entries.map((entry) => (entry.clientId === clientId ? { ...entry, ...change } : entry));

/**
 * The client's pending-send queue, with write-ahead persistence: every change is written to MMKV
 * (synchronous, durable when `set` returns) *before* the in-memory state — and therefore the
 * sync engine and the UI — sees it. A crash or force-stop right after tapping Send cannot lose
 * the message, and nothing is ever sent that is not already on disk.
 */
export const useOutboxStore = create<OutboxState>()((set, get) => {
  const commit = (entries: OutboxEntry[], nextSeq = get().nextSeq) => {
    writeJson(outboxStorage, OUTBOX_STORAGE_KEY, {
      version: 1,
      entries,
      nextSeq,
    } satisfies PersistedOutbox);
    set({ entries, nextSeq });
  };

  return {
    ...readFromDisk(),
    enqueue: (chatId, text) => {
      const { entries, nextSeq } = get();
      const entry: OutboxEntry = {
        clientId: createClientId(),
        chatId,
        text,
        createdAt: new Date().toISOString(),
        seq: nextSeq,
        status: 'queued',
        attempts: 0,
        error: null,
      };
      commit([...entries, entry], nextSeq + 1);
      return entry;
    },
    markSending: (clientId) => {
      const entry = get().entries.find((item) => item.clientId === clientId);
      if (!entry) return;
      commit(
        patch(get().entries, clientId, {
          status: 'sending',
          attempts: entry.attempts + 1,
          error: null,
        }),
      );
    },
    requeue: (clientId) =>
      commit(patch(get().entries, clientId, { status: 'queued', error: null })),
    markFailed: (clientId, error) =>
      commit(patch(get().entries, clientId, { status: 'failed', error })),
    retry: (clientId) => commit(patch(get().entries, clientId, { status: 'queued', error: null })),
    remove: (clientId) => commit(get().entries.filter((entry) => entry.clientId !== clientId)),
    clear: () => commit([], 1),
    rehydrate: () => set(readFromDisk()),
  };
});

/** Pending entries in local send order. */
export function sortByLocalOrder(entries: readonly OutboxEntry[]): OutboxEntry[] {
  return [...entries].sort((a, b) => a.seq - b.seq);
}

/** A pending entry rendered as an own text message. */
export function outboxToMessage(entry: OutboxEntry): TextMessage {
  return {
    id: entry.clientId,
    clientId: entry.clientId,
    chatId: entry.chatId,
    senderId: CURRENT_USER_ID,
    createdAt: entry.createdAt,
    status: entry.status,
    type: 'text',
    text: entry.text,
  };
}

export function useChatOutbox(chatId: string): OutboxEntry[] {
  const entries = useOutboxStore((state) => state.entries);
  return sortByLocalOrder(entries.filter((entry) => entry.chatId === chatId));
}
