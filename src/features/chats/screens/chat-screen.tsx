import type { LegendListRef } from '@legendapp/list/react-native';
import { ArrowLeftIcon } from '@ui/icon';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { withUniwind } from 'uniwind';
import { IconButton } from '@/components/shared/icon-button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/query-state';
import { links } from '@/config/links';
import { useIsOnline } from '@/lib/network/connectivity';

import { useChatQuery, useMessagesInfiniteQuery } from '../api/queries';
import { useMarkChatRead } from '../api/use-mark-chat-read';
import { ChatHeader } from '../components/chat-header';
import { MessageComposer } from '../components/message-composer';
import { MessageList } from '../components/message-list';
import { OfflineBanner } from '../components/offline-banner';
import { RecipientsHeader } from '../components/recipients-header';
import { useChatOutbox, useOutboxStore } from '../outbox/outbox-store';
import { useSendMessage } from '../outbox/use-send-message';
import { flattenMessages } from '../utils/messages-cache';
import { buildThread } from '../utils/thread';

const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView);

export function ChatScreen() {
  const { chatId = '' } = useLocalSearchParams<{ chatId: string }>();
  const chat = useChatQuery(chatId);
  const messages = useMessagesInfiniteQuery(chatId);
  const { send: sendMessage, retry, discard } = useSendMessage(chatId);
  const outbox = useChatOutbox(chatId);
  const isOnline = useIsOnline();
  const [prefill, setPrefill] = useState<{ text: string; token: number }>();
  const listRef = useRef<LegendListRef>(null);
  useMarkChatRead(chatId, messages.isSuccess);

  const thread = buildThread(flattenMessages(messages.data), outbox);
  const confirmedKey = thread.confirmedClientIds.join(',');

  // The server already has these sends (e.g. seen in a refetch after a lost response).
  useEffect(() => {
    if (!confirmedKey) return;
    const { remove } = useOutboxStore.getState();
    for (const clientId of confirmedKey.split(',')) remove(clientId);
  }, [confirmedKey]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(links.chats));
  const openProfile = (userId: string) => router.push(links.user(userId));
  const send = (text: string) => {
    sendMessage(text);
    // Jump to the newest message even if the user had scrolled up through history.
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };
  const edit = (clientId: string) => {
    const entry = outbox.find((item) => item.clientId === clientId);
    if (!entry) return;
    discard(clientId);
    setPrefill({ text: entry.text, token: Date.now() });
  };

  const backOnly = (
    <View className="px-4 pb-2">
      <IconButton
        icon={ArrowLeftIcon}
        accessibilityLabel="Back"
        onPress={goBack}
        testID="chat-back"
      />
    </View>
  );

  if (chat.isPending) {
    return (
      <View className="flex-1 bg-background pt-safe">
        {backOnly}
        {chat.fetchStatus === 'paused' ? (
          <EmptyState message="You're offline. This chat will load when you reconnect." />
        ) : (
          <LoadingState label="Opening chat…" />
        )}
      </View>
    );
  }
  if (chat.isError || !chat.data) {
    return (
      <View className="flex-1 bg-background pt-safe">
        {backOnly}
        <ErrorState message="This chat is not available." onRetry={() => chat.refetch()} />
      </View>
    );
  }

  const { participants } = chat.data;
  const [firstUser] = participants;
  const pendingCount = outbox.filter((entry) => entry.status !== 'failed').length;
  const showList = messages.data !== undefined || outbox.length > 0;

  return (
    <View className="flex-1 bg-background pt-safe" testID="chat-screen">
      {participants.length === 1 && firstUser ? (
        <ChatHeader user={firstUser} onBack={goBack} onOpenProfile={openProfile} />
      ) : (
        <RecipientsHeader users={participants} onBack={goBack} onOpenProfile={openProfile} />
      )}
      {isOnline ? null : <OfflineBanner pendingCount={pendingCount} />}

      <StyledKeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex-1">
          {messages.isPending && messages.fetchStatus === 'fetching' && outbox.length === 0 ? (
            <LoadingState label="Loading messages…" testID="messages-loading" />
          ) : null}
          {messages.isError ? (
            <ErrorState message="Couldn't load messages." onRetry={() => messages.refetch()} />
          ) : null}
          {showList ? (
            <MessageList
              messages={thread.messages}
              participants={participants}
              hasOlder={messages.hasNextPage}
              isLoadingOlder={messages.isFetchingNextPage}
              onLoadOlder={() => messages.fetchNextPage()}
              onAvatarPress={openProfile}
              pending={outbox}
              isOnline={isOnline}
              actions={{ onRetry: retry, onDiscard: discard, onEdit: edit }}
              listRef={listRef}
            />
          ) : null}
        </View>

        <MessageComposer onSend={send} prefill={prefill} />
      </StyledKeyboardAvoidingView>
    </View>
  );
}
