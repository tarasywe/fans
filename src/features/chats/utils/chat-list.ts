import type { Chat, ChatSortOrder } from '../types/chat';

export function normalizeQuery(query: string): string {
  return query.trim().replace(/^@/, '').toLowerCase();
}

/** Case-insensitive search by username (with or without a leading @) or display name. */
export function filterChats(chats: readonly Chat[], query: string): Chat[] {
  const needle = normalizeQuery(query);
  if (!needle) return [...chats];
  return chats.filter((chat) =>
    chat.participants.some(
      (user) =>
        user.username.toLowerCase().includes(needle) ||
        user.displayName.toLowerCase().includes(needle),
    ),
  );
}

export function sortChats(chats: readonly Chat[], order: ChatSortOrder): Chat[] {
  const direction = order === 'newest' ? -1 : 1;
  return [...chats].sort((a, b) => direction * a.updatedAt.localeCompare(b.updatedAt));
}

export function toggleSortOrder(order: ChatSortOrder): ChatSortOrder {
  return order === 'newest' ? 'oldest' : 'newest';
}

export function chatTitle(chat: Chat): string {
  const [first, ...rest] = chat.participants;
  if (!first) return 'Unknown';
  if (rest.length === 0) return first.displayName;
  return rest.length === 1
    ? `${first.displayName}, ${rest[0]?.displayName ?? ''}`
    : `${first.displayName} +${rest.length}`;
}
