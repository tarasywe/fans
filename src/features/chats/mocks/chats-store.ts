import { buildMockChats, type MockChatRecord } from './chats-data';

/** Mutable in-memory store behind the mock chat API. */
let chats: MockChatRecord[] = buildMockChats();
let sequence = 0;

export const chatsDb = {
  all: (): MockChatRecord[] => chats,
  find: (chatId: string): MockChatRecord | undefined => chats.find((chat) => chat.id === chatId),
  insert: (chat: MockChatRecord): void => {
    chats = [chat, ...chats];
  },
  nextId: (prefix: string): string => {
    sequence += 1;
    return `${prefix}_${Date.now().toString(36)}_${sequence}`;
  },
  /** Restores the seeded data set (used by tests). */
  reset: (now?: number): void => {
    chats = buildMockChats(now);
    sequence = 0;
  },
};
