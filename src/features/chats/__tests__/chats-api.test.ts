import { failureStatus, installTestMocks } from '@test/test-utils';
import { CURRENT_USER_ID } from '@/config/session';

import { http } from '@/lib/http/http-client';

import { chatsEndpoints } from '../api/endpoints';
import { createChat, sendMessage } from '../api/mutations';
import { fetchChat, fetchChats, fetchMessages } from '../api/queries';
import {
  MESSAGE_MAX_LENGTH,
  MESSAGES_PAGE_SIZE,
  MOCK_MESSAGES_PER_CHAT,
} from '../constants/limits';
import { buildMockChats } from '../mocks/chats-data';
import { chatsDb } from '../mocks/chats-store';
import { ChatSchema } from '../types/chat';
import { MessageSchema } from '../types/message';

beforeAll(installTestMocks);
beforeEach(() => chatsDb.reset());

describe('chats mock data', () => {
  const chats = buildMockChats();

  it('generates 100 schema-valid messages per chat in chronological order', () => {
    for (const chat of chats) {
      expect(chat.messages).toHaveLength(MOCK_MESSAGES_PER_CHAT);
      for (const message of chat.messages)
        expect(MessageSchema.safeParse(message).success).toBe(true);
      const times = chat.messages.map((message) => message.createdAt);
      expect([...times].sort()).toEqual(times);
    }
  });

  it('includes one-to-one and group chats with both senders', () => {
    expect(chats.some((chat) => chat.participantIds.length === 1)).toBe(true);
    expect(chats.some((chat) => chat.participantIds.length > 1)).toBe(true);
    const senders = new Set(
      chats.flatMap((chat) => chat.messages.map((message) => message.senderId)),
    );
    expect(senders.has(CURRENT_USER_ID)).toBe(true);
    expect(senders.size).toBeGreaterThan(2);
  });

  it('is deterministic', () => {
    const again = buildMockChats(0);
    const first = buildMockChats(0);
    expect(again[0]?.messages[5]).toEqual(first[0]?.messages[5]);
  });
});

describe('GET /chats', () => {
  it('returns schema-valid chats, newest activity first', async () => {
    const chats = await fetchChats();
    expect(chats.length).toBeGreaterThan(10);
    const times = chats.map((chat) => chat.updatedAt);
    expect([...times].sort().reverse()).toEqual(times);
    for (const chat of chats)
      expect(chat.participants.every((user) => user.id !== CURRENT_USER_ID)).toBe(true);
  });

  it('returns a single chat and 404 for unknown ids', async () => {
    expect((await fetchChat('c_1')).id).toBe('c_1');
    expect(await failureStatus(fetchChat('nope'))).toBe(404);
  });
});

describe('GET /chats/:chatId/messages (pagination)', () => {
  it('returns the latest 20 messages first, oldest → newest', async () => {
    const page = await fetchMessages('c_1', null);
    const all = chatsDb.find('c_1')?.messages ?? [];
    expect(page.items).toHaveLength(MESSAGES_PAGE_SIZE);
    expect(page.items).toEqual(all.slice(-MESSAGES_PAGE_SIZE));
    expect(page.nextCursor).toBe(page.items[0]?.id);
  });

  it('pages back through all 100 messages without gaps or duplicates', async () => {
    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page = await fetchMessages('c_1', cursor);
      seen.unshift(...page.items.map((message) => message.id));
      cursor = page.nextCursor;
      pages += 1;
    } while (cursor);

    expect(pages).toBe(MOCK_MESSAGES_PER_CHAT / MESSAGES_PAGE_SIZE);
    expect(seen).toEqual(chatsDb.find('c_1')?.messages.map((message) => message.id));
  });

  it('returns an empty page for a chat without messages', async () => {
    const chat = await createChat({ participantIds: ['u_29', 'u_30'] });
    expect(await fetchMessages(chat.id, null)).toEqual({ items: [], nextCursor: null });
  });

  it('rejects unknown cursors, bad limits and unknown chats', async () => {
    expect(await failureStatus(fetchMessages('c_1', 'missing'))).toBe(400);
    expect(
      await failureStatus(http.get(chatsEndpoints.messages('c_1'), { params: { limit: 0 } })),
    ).toBe(400);
    expect(
      await failureStatus(http.get(chatsEndpoints.messages('c_1'), { params: { limit: 'x' } })),
    ).toBe(400);
    expect(
      await failureStatus(http.get(chatsEndpoints.messages('c_1'), { params: { limit: 51 } })),
    ).toBe(400);
    expect(await failureStatus(fetchMessages('nope', null))).toBe(404);
  });
});

describe('read state', () => {
  it('marks a chat read when its first page is loaded, not when paging back', async () => {
    const unreadChat = chatsDb.all().find((chat) => chat.unreadCount > 0);
    if (!unreadChat) throw new Error('fixture needs an unread chat');
    const first = await fetchMessages(unreadChat.id, null);
    expect(chatsDb.find(unreadChat.id)?.unreadCount).toBe(0);

    unreadChat.unreadCount = 3;
    await fetchMessages(unreadChat.id, first.nextCursor);
    expect(chatsDb.find(unreadChat.id)?.unreadCount).toBe(3);
  });

  it('clears unread when replying', async () => {
    const unreadChat = chatsDb.all().find((chat) => chat.unreadCount > 0);
    if (!unreadChat) throw new Error('fixture needs an unread chat');
    await sendMessage(unreadChat.id, { text: 'hi' });
    expect(chatsDb.find(unreadChat.id)?.unreadCount).toBe(0);
  });
});

describe('POST /chats/:chatId/messages', () => {
  it('trims and appends the message as the newest item', async () => {
    const message = await sendMessage('c_1', { text: '  hello  ' });
    expect(message).toMatchObject({
      type: 'text',
      text: 'hello',
      senderId: CURRENT_USER_ID,
      status: 'sent',
    });
    const page = await fetchMessages('c_1', null);
    expect(page.items.at(-1)?.id).toBe(message.id);
    expect((await fetchChats())[0]?.id).toBe('c_1');
  });

  it('accepts exactly 400 characters', async () => {
    const text = 'a'.repeat(MESSAGE_MAX_LENGTH);
    expect((await sendMessage('c_1', { text })).type).toBe('text');
  });

  it('validates on the client before sending', async () => {
    await expect(sendMessage('c_1', { text: '   ' })).rejects.toThrow('Message cannot be empty');
    await expect(sendMessage('c_1', { text: 'a'.repeat(MESSAGE_MAX_LENGTH + 1) })).rejects.toThrow(
      '400',
    );
  });

  it('is rejected by the server when invalid or for unknown chats', async () => {
    const url = chatsEndpoints.messages('c_1');
    expect(await failureStatus(http.post(url, { text: '' }))).toBe(400);
    expect(await failureStatus(http.post(url, { text: 'a'.repeat(401) }))).toBe(400);
    expect(await failureStatus(http.post(url, {}))).toBe(400);
    expect(await failureStatus(http.post(chatsEndpoints.messages('nope'), { text: 'hi' }))).toBe(
      404,
    );
  });
});

describe('POST /chats', () => {
  it('reuses an existing one-to-one chat', async () => {
    const chat = await createChat({ participantIds: ['u_1'] });
    expect(chat.id).toBe('c_1');
  });

  it('creates a new group chat with de-duplicated participants', async () => {
    const chat = await createChat({ participantIds: ['u_2', 'u_3', 'u_3', CURRENT_USER_ID] });
    expect(ChatSchema.safeParse(chat).success).toBe(true);
    expect(chat.participants.map((user) => user.id)).toEqual(['u_2', 'u_3']);
    expect(chat.lastMessage).toBeNull();
    expect((await fetchChats()).some((item) => item.id === chat.id)).toBe(true);
  });

  it('validates participants', async () => {
    await expect(createChat({ participantIds: [] })).rejects.toThrow('Select at least one user');
    expect(
      await failureStatus(http.post(chatsEndpoints.create, { participantIds: [CURRENT_USER_ID] })),
    ).toBe(400);
    expect(
      await failureStatus(http.post(chatsEndpoints.create, { participantIds: ['ghost'] })),
    ).toBe(404);
    expect(await failureStatus(http.post(chatsEndpoints.create, { foo: 1 }))).toBe(400);
  });
});
