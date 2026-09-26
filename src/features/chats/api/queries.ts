import { type InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { http } from '@/lib/http/http-client';

import { MESSAGES_PAGE_SIZE } from '../constants/limits';
import { ChatListSchema, ChatSchema } from '../types/chat';
import { type MessagesPage, MessagesPageSchema } from '../types/message';
import { chatsEndpoints } from './endpoints';

export const chatsKeys = {
  all: ['chats'] as const,
  list: () => ['chats', 'list'] as const,
  detail: (chatId: string) => ['chats', 'detail', chatId] as const,
  messages: (chatId: string) => ['chats', 'messages', chatId] as const,
};

export type MessagesData = InfiniteData<MessagesPage, string | null>;

export async function fetchChats() {
  const { data } = await http.get(chatsEndpoints.list);
  return ChatListSchema.parse(data);
}

export async function fetchChat(chatId: string) {
  const { data } = await http.get(chatsEndpoints.detail(chatId));
  return ChatSchema.parse(data);
}

export async function fetchMessages(chatId: string, before: string | null) {
  const { data } = await http.get(chatsEndpoints.messages(chatId), {
    params: { limit: MESSAGES_PAGE_SIZE, ...(before ? { before } : {}) },
  });
  return MessagesPageSchema.parse(data);
}

export function useChatsQuery() {
  return useQuery({ queryKey: chatsKeys.list(), queryFn: fetchChats });
}

export function useChatQuery(chatId: string) {
  return useQuery({
    queryKey: chatsKeys.detail(chatId),
    queryFn: () => fetchChat(chatId),
    enabled: chatId.length > 0,
  });
}

/** Pages are newest-first: page 0 holds the latest 20 messages, each next page is 20 older. */
export function useMessagesInfiniteQuery(chatId: string) {
  return useInfiniteQuery({
    queryKey: chatsKeys.messages(chatId),
    queryFn: ({ pageParam }) => fetchMessages(chatId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: chatId.length > 0,
  });
}
