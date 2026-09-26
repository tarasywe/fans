import { LegendList } from '@legendapp/list/react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

import { EmptyState, ErrorState, LoadingState } from '@/components/shared/query-state';
import { SearchField } from '@/components/shared/search-field';
import { links } from '@/config/links';

import { useChatsQuery } from '../api/queries';
import { ChatListItem } from '../components/chat-list-item';
import { ChatsHeader } from '../components/chats-header';
import { SortToggle } from '../components/sort-toggle';
import type { Chat, ChatSortOrder } from '../types/chat';
import { filterChats, sortChats, toggleSortOrder } from '../utils/chat-list';

export function ChatsScreen() {
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<ChatSortOrder>('newest');
  const { data, isPending, isError, refetch } = useChatsQuery();
  // Only a user pull shows the spinner; background refetches stay silent.
  const [isPullRefreshing, setPullRefreshing] = useState(false);
  const contentStyle = useResolveClassNames('pb-4');

  const chats = sortChats(filterChats(data ?? [], search), order);
  const openChat = (chat: Chat) => router.push(links.chat(chat.id));
  const pullToRefresh = async () => {
    setPullRefreshing(true);
    await refetch();
    setPullRefreshing(false);
  };
  const openProfile = (userId: string) => router.push(links.user(userId));

  return (
    <View className="flex-1 bg-background pt-safe" testID="chats-screen">
      <ChatsHeader onNewChat={() => router.push(links.newChat)} />
      <View className="flex-row items-center gap-2 border-b border-border px-4 pb-3">
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Search for conversations"
          testID="chats-search"
          className="flex-1"
        />
        <SortToggle order={order} onToggle={() => setOrder(toggleSortOrder)} />
      </View>

      {isPending ? <LoadingState label="Loading conversations…" /> : null}
      {isError ? (
        <ErrorState message="Couldn't load conversations." onRetry={() => refetch()} />
      ) : null}
      {data ? (
        <LegendList
          data={chats}
          keyExtractor={(chat) => chat.id}
          renderItem={({ item }) => (
            <ChatListItem chat={item} onPress={openChat} onAvatarPress={openProfile} />
          )}
          estimatedItemSize={68}
          recycleItems
          extraData={order}
          refreshing={isPullRefreshing}
          onRefresh={pullToRefresh}
          contentContainerStyle={contentStyle}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              testID="chats-empty"
              message={
                search ? `No conversations match “${search.trim()}”.` : 'No conversations yet.'
              }
            />
          }
          testID="chats-list"
        />
      ) : null}
    </View>
  );
}
