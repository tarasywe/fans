import type { UserSummary } from '@features/users';
import { CURRENT_USER_ID } from '@/config/session';

import type { Chat } from '../types/chat';
import type { Message } from '../types/message';

export function user(id: string, displayName: string, username: string): UserSummary {
  return { id, displayName, username, avatarUrl: null, isVerified: false, isOnline: false };
}

export function textMessage(
  id: string,
  overrides: Partial<Extract<Message, { type: 'text' }>> = {},
): Message {
  return {
    id,
    chatId: 'c',
    senderId: CURRENT_USER_ID,
    createdAt: '2026-09-25T10:00:00.000Z',
    status: 'read',
    type: 'text',
    text: 'hi',
    ...overrides,
  };
}

export function chat(id: string, participants: UserSummary[], updatedAt: string): Chat {
  return { id, participants, lastMessage: null, unreadCount: 0, updatedAt };
}
