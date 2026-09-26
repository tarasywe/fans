import { create } from 'zustand';

import { CURRENT_USER_ID } from '@/config/session';

import type { TextMessage } from './types/message';

export type OutboxStatus = 'sending' | 'failed';

export type OutboxEntry = {
  localId: string;
  chatId: string;
  text: string;
  createdAt: string;
  status: OutboxStatus;
};

type OutboxState = {
  entries: OutboxEntry[];
  enqueue: (chatId: string, text: string) => OutboxEntry;
  markSending: (localId: string) => void;
  markFailed: (localId: string) => void;
  remove: (localId: string) => void;
  clear: () => void;
};

let sequence = 0;

/**
 * Client-only state for messages the server has not accepted yet. Server messages stay in
 * React Query; a message leaves the outbox only when its POST succeeds (or the user deletes it).
 */
export const useOutboxStore = create<OutboxState>()((set) => ({
  entries: [],
  enqueue: (chatId, text) => {
    sequence += 1;
    const entry: OutboxEntry = {
      localId: `local_${Date.now().toString(36)}_${sequence}`,
      chatId,
      text,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };
    set((state) => ({ entries: [...state.entries, entry] }));
    return entry;
  },
  markSending: (localId) =>
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.localId === localId ? { ...entry, status: 'sending' } : entry,
      ),
    })),
  markFailed: (localId) =>
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.localId === localId ? { ...entry, status: 'failed' } : entry,
      ),
    })),
  remove: (localId) =>
    set((state) => ({ entries: state.entries.filter((entry) => entry.localId !== localId) })),
  clear: () => set({ entries: [] }),
}));

/** Outbox entries rendered as messages (status `sending` / `failed`). */
export function outboxToMessage(entry: OutboxEntry): TextMessage {
  return {
    id: entry.localId,
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
  return entries.filter((entry) => entry.chatId === chatId);
}
