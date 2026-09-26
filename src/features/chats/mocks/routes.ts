import { mockUsers } from '@features/users';
import { CURRENT_USER_ID } from '@/config/session';
import { MockHttpError, type MockRequest, type MockRoute } from '@/lib/mock';

import { chatsEndpoints, chatsRoutePatterns } from '../api/endpoints';
import { MESSAGES_PAGE_SIZE } from '../constants/limits';
import { type Chat, CreateChatInputSchema } from '../types/chat';
import { type MessagesPage, SendMessageInputSchema, type TextMessage } from '../types/message';
import { toChat } from './chats-data';
import { chatsDb } from './chats-store';

const MAX_PAGE_SIZE = 50;

function requireChat(request: MockRequest) {
  const chat = chatsDb.find(request.params.chatId ?? '');
  if (!chat) throw new MockHttpError(404, 'Chat not found');
  return chat;
}

function parseLimit(raw: string | undefined): number {
  if (raw === undefined) return MESSAGES_PAGE_SIZE;
  const limit = Number(raw);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw new MockHttpError(400, `limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
  }
  return limit;
}

export function listChats(): Chat[] {
  return chatsDb
    .all()
    .map(toChat)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const chatsMockRoutes: MockRoute[] = [
  { method: 'get', path: chatsEndpoints.list, handler: listChats },
  {
    method: 'get',
    path: chatsRoutePatterns.detail,
    handler: (request) => toChat(requireChat(request)),
  },
  {
    method: 'post',
    path: chatsEndpoints.create,
    handler: ({ body }) => {
      const parsed = CreateChatInputSchema.safeParse(body);
      if (!parsed.success)
        throw new MockHttpError(400, parsed.error.issues[0]?.message ?? 'Invalid body');

      const participantIds = [...new Set(parsed.data.participantIds)].filter(
        (id) => id !== CURRENT_USER_ID,
      );
      if (participantIds.length === 0) throw new MockHttpError(400, 'Select at least one user');
      const unknown = participantIds.find((id) => !mockUsers.some((user) => user.id === id));
      if (unknown) throw new MockHttpError(404, `User ${unknown} not found`);

      if (participantIds.length === 1) {
        const existing = chatsDb
          .all()
          .find(
            (chat) =>
              chat.participantIds.length === 1 && chat.participantIds[0] === participantIds[0],
          );
        if (existing) return toChat(existing);
      }

      const record = {
        id: chatsDb.nextId('c'),
        participantIds,
        messages: [],
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        sendBehavior: 'normal' as const,
      };
      chatsDb.insert(record);
      return toChat(record);
    },
  },
  {
    method: 'get',
    path: chatsRoutePatterns.messages,
    handler: (request): MessagesPage => {
      const chat = requireChat(request);
      const { messages } = chat;
      const limit = parseLimit(request.query.limit);
      const before = request.query.before;
      // Opening a chat (first page) marks it as read.
      if (!before) chat.unreadCount = 0;

      let end = messages.length;
      if (before) {
        end = messages.findIndex((message) => message.id === before);
        if (end === -1) throw new MockHttpError(400, 'Unknown cursor');
      }
      const start = Math.max(0, end - limit);
      const items = messages.slice(start, end);
      return { items, nextCursor: start > 0 ? (items[0]?.id ?? null) : null };
    },
  },
  {
    method: 'post',
    path: chatsRoutePatterns.messages,
    handler: (request): TextMessage => {
      const chat = requireChat(request);
      if (chat.sendBehavior === 'error') {
        throw new MockHttpError(500, 'Simulated server error: this chat always fails');
      }

      const parsed = SendMessageInputSchema.safeParse(request.body);
      if (!parsed.success)
        throw new MockHttpError(400, parsed.error.issues[0]?.message ?? 'Invalid body');

      const message: TextMessage = {
        id: chatsDb.nextId(`${chat.id}_m`),
        chatId: chat.id,
        senderId: CURRENT_USER_ID,
        createdAt: new Date().toISOString(),
        status: 'sent',
        type: 'text',
        text: parsed.data.text,
      };
      chat.messages.push(message);
      chat.unreadCount = 0;
      return message;
    },
  },
];
