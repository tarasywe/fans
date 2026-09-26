import { mockUsers, toUserSummary } from '@features/users';
import { CURRENT_USER_ID } from '@/config/session';
import { createRandom, sentence } from '@/lib/mock';

import { MOCK_MESSAGES_PER_CHAT } from '../constants/limits';
import type { Chat } from '../types/chat';
import type { Message } from '../types/message';

export type MockChatRecord = {
  id: string;
  participantIds: string[];
  messages: Message[];
  unreadCount: number;
  createdAt: string;
};

const ONE_ON_ONE_CHATS = 18;
const GIFT_AMOUNTS_CENTS = [500, 1000, 2500, 5000, 10_000];

function buildMessages(
  random: ReturnType<typeof createRandom>,
  chat: Pick<MockChatRecord, 'id' | 'participantIds'>,
  endAt: number,
) {
  const messages: Message[] = [];
  let createdAt = endAt;

  for (let index = MOCK_MESSAGES_PER_CHAT - 1; index >= 0; index -= 1) {
    const fromMe = random.chance(0.45);
    const senderId = fromMe ? CURRENT_USER_ID : random.pick(chat.participantIds);
    const base = {
      id: `${chat.id}_m${index + 1}`,
      chatId: chat.id,
      senderId,
      createdAt: new Date(createdAt).toISOString(),
      status: 'read' as const,
    };
    messages.unshift(
      !fromMe && random.chance(0.06)
        ? { ...base, type: 'gift', amountCents: random.pick(GIFT_AMOUNTS_CENTS) }
        : { ...base, type: 'text', text: sentence(random) },
    );
    // Gaps from seconds to ~a day so the list spans several "day" separators.
    createdAt -= random.chance(0.1) ? random.int(3, 20) * 3_600_000 : random.int(20, 900) * 1000;
  }

  // Latest messages from me that the recipient hasn't read yet.
  const last = messages.at(-1);
  if (last && last.senderId === CURRENT_USER_ID && random.chance(0.4)) last.status = 'sent';
  return messages;
}

export function buildMockChats(now = Date.now()): MockChatRecord[] {
  const random = createRandom(7);
  const records: Omit<MockChatRecord, 'messages' | 'createdAt'>[] = [
    ...Array.from({ length: ONE_ON_ONE_CHATS }, (_, index) => ({
      id: `c_${index + 1}`,
      participantIds: [mockUsers[index]?.id ?? 'u_1'],
      unreadCount: random.chance(0.3) ? random.int(1, 9) : 0,
    })),
    { id: 'c_group_1', participantIds: ['u_20', 'u_21', 'u_22', 'u_23'], unreadCount: 0 },
    { id: 'c_group_2', participantIds: ['u_24', 'u_25'], unreadCount: 2 },
  ];

  return records.map((record, index) => {
    // Stagger chats so the most recent activity ranges from seconds to days ago.
    const messages = buildMessages(random, record, now - (index * index * 97 + 30) * 1000);
    return {
      ...record,
      messages,
      createdAt: messages[0]?.createdAt ?? new Date(now).toISOString(),
    };
  });
}

export function toChat(record: MockChatRecord): Chat {
  const lastMessage = record.messages.at(-1) ?? null;
  return {
    id: record.id,
    participants: record.participantIds.flatMap((id) => {
      const user = mockUsers.find((candidate) => candidate.id === id);
      return user ? [toUserSummary(user)] : [];
    }),
    lastMessage,
    unreadCount: record.unreadCount,
    updatedAt: lastMessage?.createdAt ?? record.createdAt,
  };
}
