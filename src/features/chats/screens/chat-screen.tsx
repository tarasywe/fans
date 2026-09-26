import type { LegendListRef } from '@legendapp/list/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { withUniwind } from 'uniwind';
import { ErrorState, LoadingState } from '@/components/shared/query-state';
import { links } from '@/config/links';

import { useChatQuery, useMessagesInfiniteQuery } from '../api/queries';
import { useMarkChatRead } from '../api/use-mark-chat-read';
import { useSendMessage } from '../api/use-send-message';
import { ChatHeader } from '../components/chat-header';
import { MessageComposer } from '../components/message-composer';
import { MessageList } from '../components/message-list';
import { RecipientsHeader } from '../components/recipients-header';
import { outboxToMessage, useChatOutbox } from '../store';
import { flattenMessages } from '../utils/messages-cache';

const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView);

export function ChatScreen() {
  const { chatId = '' } = useLocalSearchParams<{ chatId: string }>();
  const chat = useChatQuery(chatId);
  const messages = useMessagesInfiniteQuery(chatId);
  const { send: sendMessage, retry, discard } = useSendMessage(chatId);
  const outbox = useChatOutbox(chatId);
  const listRef = useRef<LegendListRef>(null);
  useMarkChatRead(chatId, messages.isSuccess);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(links.chats));
  const openProfile = (userId: string) => router.push(links.user(userId));
  const send = (text: string) => {
    sendMessage(text);
    // Jump to the newest message even if the user had scrolled up through history.
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  if (chat.isPending) {
    return (
      <View className="flex-1 bg-background pt-safe">
        <LoadingState label="Opening chat…" />
      </View>
    );
  }
  if (chat.isError || !chat.data) {
    return (
      <View className="flex-1 bg-background pt-safe">
        <ErrorState message="This chat is not available." onRetry={() => chat.refetch()} />
      </View>
    );
  }

  const { participants } = chat.data;
  const [firstUser] = participants;

  return (
    <View className="flex-1 bg-background pt-safe" testID="chat-screen">
      {participants.length === 1 && firstUser ? (
        <ChatHeader user={firstUser} onBack={goBack} onOpenProfile={openProfile} />
      ) : (
        <RecipientsHeader users={participants} onBack={goBack} onOpenProfile={openProfile} />
      )}

      <StyledKeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex-1">
          {messages.isPending ? (
            <LoadingState label="Loading messages…" testID="messages-loading" />
          ) : null}
          {messages.isError ? (
            <ErrorState message="Couldn't load messages." onRetry={() => messages.refetch()} />
          ) : null}
          {messages.data ? (
            <MessageList
              messages={[...flattenMessages(messages.data), ...outbox.map(outboxToMessage)]}
              participants={participants}
              hasOlder={messages.hasNextPage}
              isLoadingOlder={messages.isFetchingNextPage}
              onLoadOlder={() => messages.fetchNextPage()}
              onAvatarPress={openProfile}
              onRetry={retry}
              onDiscard={discard}
              listRef={listRef}
            />
          ) : null}
        </View>

        <MessageComposer onSend={send} />
      </StyledKeyboardAvoidingView>
    </View>
  );
}
