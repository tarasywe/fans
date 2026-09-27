import { mockUsers } from '@features/users';
import { createKvStorage, readJson, writeJson } from '@/lib/storage/kv-storage';

import type { Message, TextMessage } from '../types/message';
import { buildMockChats, type MockChatRecord } from './chats-data';

/**
 * The mock *server's* own database. It is persisted in its own MMKV instance, separate from the
 * client's pending queue (the outbox), so accepted messages and accepted client IDs survive an
 * app restart exactly like a real backend would.
 */
const storage = createKvStorage('fans-mock-server');
const STORAGE_KEY = 'db-v1';

type PersistedServer = {
  /** Anchor for the seeded history, so seeded timestamps are stable across restarts. */
  seededAt: number;
  sequence: number;
  /** Messages accepted or received after seeding, per chat, in server order. */
  extra: Record<string, Message[]>;
  created: MockChatRecord[];
  unread: Record<string, number>;
  removed: string[];
};

const INCOMING_TEXTS = [
  'Are you there?',
  'Just checking in 👋',
  'Sent you a few photos',
  'Let me know when you are back online!',
  'Also, happy Friday 🎉',
];

let state: PersistedServer;
let chats: MockChatRecord[] = [];

function emptyState(now = Date.now()): PersistedServer {
  return { seededAt: now, sequence: 0, extra: {}, created: [], unread: {}, removed: [] };
}

function save(): void {
  writeJson(storage, STORAGE_KEY, state);
}

/** Rebuilds the in-memory view: deterministic seed + everything the server accepted since. */
function materialize(): void {
  const seeded = buildMockChats(state.seededAt).map((chat) => ({
    ...chat,
    messages: [...chat.messages, ...(state.extra[chat.id] ?? [])],
    unreadCount: state.unread[chat.id] ?? chat.unreadCount,
  }));
  const created = state.created.map((chat) => ({
    ...chat,
    messages: [...(state.extra[chat.id] ?? [])],
    unreadCount: state.unread[chat.id] ?? 0,
  }));
  chats = [...created, ...seeded].filter((chat) => !state.removed.includes(chat.id));
}

function load(): void {
  state = readJson<PersistedServer>(storage, STORAGE_KEY) ?? emptyState();
  materialize();
}

load();

export const chatsDb = {
  all: (): MockChatRecord[] => chats,
  find: (chatId: string): MockChatRecord | undefined => chats.find((chat) => chat.id === chatId),

  insert: (chat: MockChatRecord): void => {
    state.created = [{ ...chat, messages: [] }, ...state.created];
    save();
    materialize();
  },

  /** Removes a chat server-side (e.g. the other user deleted it). */
  remove: (chatId: string): void => {
    state.removed = [...state.removed, chatId];
    save();
    materialize();
  },

  nextId: (prefix: string): string => {
    state.sequence += 1;
    save();
    return `${prefix}_${Date.now().toString(36)}_${state.sequence}`;
  },

  /** The server assigns the final order: accepted messages are appended in arrival order. */
  append: (chatId: string, message: Message): void => {
    state.extra[chatId] = [...(state.extra[chatId] ?? []), message];
    save();
    materialize();
  },

  /** Idempotency lookup: an already-accepted send with this client ID. */
  findByClientId: (chatId: string, clientId: string): Message | undefined =>
    chatsDb.find(chatId)?.messages.find((message) => message.clientId === clientId),

  setUnread: (chatId: string, count: number): void => {
    state.unread[chatId] = count;
    save();
    materialize();
  },

  /** Simulates messages from the other participant arriving at the server (e.g. while offline). */
  injectIncoming: (chatId: string, count: number): Message[] => {
    const chat = chatsDb.find(chatId);
    if (!chat) throw new Error(`Unknown chat ${chatId}`);
    const senderId = chat.participantIds[0] ?? mockUsers[0]?.id ?? 'u_1';
    const received = Array.from(
      { length: count },
      (_, index): TextMessage => ({
        id: chatsDb.nextId(`${chatId}_in`),
        chatId,
        senderId,
        createdAt: new Date(Date.now() + index).toISOString(),
        status: 'sent',
        type: 'text',
        text: INCOMING_TEXTS[index % INCOMING_TEXTS.length] ?? 'Hello',
      }),
    );
    for (const message of received) chatsDb.append(chatId, message);
    chatsDb.setUnread(chatId, (chat.unreadCount ?? 0) + count);
    return received;
  },

  /** Simulates an app restart: drops memory and rebuilds from the server's own storage. */
  reload: (): void => load(),

  /** Wipes the server's storage and restores the seeded data set. */
  reset: (now?: number): void => {
    state = emptyState(now);
    save();
    materialize();
  },
};
