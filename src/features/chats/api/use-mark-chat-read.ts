import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { Chat } from '../types/chat';
import { chatsKeys } from './queries';

/**
 * Loading a chat's first page marks it read on the server; mirror that in the cached list
 * right away and refetch it so the unread badge disappears when going back.
 */
export function useMarkChatRead(chatId: string, loaded: boolean): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loaded) return;
    queryClient.setQueryData<Chat[]>(chatsKeys.list(), (chats) =>
      chats?.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat)),
    );
    queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
  }, [chatId, loaded, queryClient]);
}
