import { create } from 'zustand';

import { createKvStorage, readJson, writeJson } from '@/lib/storage/kv-storage';

import type { Receipt } from '../types/receipt';

export type ReceiptEntry = Receipt & {
  restored: boolean;
  status: 'queued' | 'sending' | 'failed';
  attempts: number;
  error: string | null;
};

type Persisted = { version: 1; entries: ReceiptEntry[] };

type ReceiptQueueState = {
  entries: ReceiptEntry[];
  /** Idempotent: a receipt already queued (same transaction id) is not added again. */
  enqueue: (receipt: Receipt, restored: boolean) => boolean;
  markSending: (transactionId: string) => void;
  requeue: (transactionId: string) => void;
  markFailed: (transactionId: string, error: string) => void;
  remove: (transactionId: string) => void;
  clear: () => void;
  rehydrate: () => void;
};

export const receiptStorage = createKvStorage('fans-billing-receipts');
const KEY = 'receipts-v1';

function readFromDisk(): ReceiptEntry[] {
  const saved = readJson<Persisted>(receiptStorage, KEY);
  if (saved?.version !== 1) return [];
  // A confirmation in flight when the app died has an unknown outcome: send it again (idempotent).
  return saved.entries.map((entry) =>
    entry.status === 'sending' ? { ...entry, status: 'queued' } : entry,
  );
}

/**
 * Receipts the store accepted but the backend has not acknowledged yet. Written to disk *before*
 * memory (like the message outbox), so a purchase is never lost if the app dies between the store
 * sheet closing and the backend call.
 */
export const useReceiptQueue = create<ReceiptQueueState>()((set, get) => {
  const commit = (entries: ReceiptEntry[]) => {
    writeJson(receiptStorage, KEY, { version: 1, entries } satisfies Persisted);
    set({ entries });
  };
  const patch = (transactionId: string, change: Partial<ReceiptEntry>) =>
    commit(
      get().entries.map((entry) =>
        entry.transactionId === transactionId ? { ...entry, ...change } : entry,
      ),
    );

  return {
    entries: readFromDisk(),
    enqueue: (receipt, restored) => {
      if (get().entries.some((entry) => entry.transactionId === receipt.transactionId))
        return false;
      commit([
        ...get().entries,
        { ...receipt, restored, status: 'queued', attempts: 0, error: null },
      ]);
      return true;
    },
    markSending: (transactionId) => {
      const entry = get().entries.find((item) => item.transactionId === transactionId);
      if (entry)
        patch(transactionId, { status: 'sending', attempts: entry.attempts + 1, error: null });
    },
    requeue: (transactionId) => patch(transactionId, { status: 'queued', error: null }),
    markFailed: (transactionId, error) => patch(transactionId, { status: 'failed', error }),
    remove: (transactionId) =>
      commit(get().entries.filter((entry) => entry.transactionId !== transactionId)),
    clear: () => commit([]),
    rehydrate: () => set({ entries: readFromDisk() }),
  };
});
