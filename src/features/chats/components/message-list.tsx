import type { UserSummary } from '@features/users';
import { LegendList, type LegendListRef } from '@legendapp/list/react-native';
import type { Ref } from 'react';
import { useResolveClassNames } from 'uniwind';

import type { Message } from '../types/message';
import { buildMessageRows, type MessageRow } from '../utils/message-rows';
import { DaySeparator } from './day-separator';
import { MessageBubble } from './message-bubble';
import { OlderMessagesIndicator } from './older-messages-indicator';

type MessageListProps = {
  messages: readonly Message[];
  participants: readonly UserSummary[];
  hasOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  onAvatarPress: (userId: string) => void;
  onRetry: (messageId: string) => void;
  onDiscard: (messageId: string) => void;
  listRef?: Ref<LegendListRef>;
};

/**
 * Chronological list anchored to the bottom (newest message last), without `inverted`.
 * Reaching the top loads the next 20 older messages while keeping the scroll position.
 */
export function MessageList({
  messages,
  participants,
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  onAvatarPress,
  onRetry,
  onDiscard,
  listRef,
}: MessageListProps) {
  const contentStyle = useResolveClassNames('pb-2');
  const rows = buildMessageRows(messages);
  const isGroup = participants.length > 1;
  const findSender = (id: string) => participants.find((user) => user.id === id);

  const renderRow = (row: MessageRow) =>
    row.kind === 'day' ? (
      <DaySeparator label={row.label} />
    ) : (
      <MessageBubble
        message={row.message}
        sender={findSender(row.message.senderId)}
        showAvatar={row.isLastInGroup}
        showSenderName={isGroup && row.isFirstInGroup}
        onAvatarPress={onAvatarPress}
        onRetry={onRetry}
        onDiscard={onDiscard}
      />
    );

  return (
    <LegendList
      ref={listRef}
      data={rows}
      keyExtractor={(row) => row.key}
      getItemType={(row) => row.kind}
      renderItem={({ item }) => renderRow(item)}
      estimatedItemSize={72}
      recycleItems
      alignItemsAtEnd
      initialScrollAtEnd
      maintainScrollAtEnd
      maintainVisibleContentPosition
      onStartReached={() => {
        if (hasOlder && !isLoadingOlder) onLoadOlder();
      }}
      onStartReachedThreshold={0.2}
      ListHeaderComponent={<OlderMessagesIndicator isLoading={isLoadingOlder} hasMore={hasOlder} />}
      contentContainerStyle={contentStyle}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      testID="message-list"
    />
  );
}
