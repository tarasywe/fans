import { Pressable } from '@ui/pressable';
import { Text } from '@ui/text';
import { View } from 'react-native';
import { UserAvatar } from '@/components/shared/user-avatar';
import { formatRelativeTime } from '@/utils/format-time';

import type { Chat } from '../types/chat';
import { chatTitle } from '../utils/chat-list';
import { isOwnMessage, messagePreview } from '../utils/message-format';

type ChatListItemProps = {
  chat: Chat;
  onPress: (chat: Chat) => void;
  onAvatarPress: (userId: string) => void;
  now?: Date;
};

export function ChatListItem({ chat, onPress, onAvatarPress, now }: ChatListItemProps) {
  const [primary] = chat.participants;
  if (!primary) return null;

  const isGroup = chat.participants.length > 1;
  const last = chat.lastMessage;
  const seen = last !== null && isOwnMessage(last) && last.status === 'read';
  const unread = chat.unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${chatTitle(chat)}`}
      onPress={() => onPress(chat)}
      testID={`chat-item-${chat.id}`}
      className="flex-row items-center gap-3 px-4 py-2.5 active:bg-accent"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${primary.displayName}'s profile`}
        onPress={() => onAvatarPress(primary.id)}
        hitSlop={4}
        testID={`chat-avatar-${chat.id}`}
      >
        <UserAvatar name={primary.displayName} isOnline={isGroup ? undefined : primary.isOnline} />
        {isGroup ? (
          <View className="absolute -bottom-1 -right-1 h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-primary px-1">
            <Text className="text-[10px] font-semibold text-primary-foreground">
              {chat.participants.length}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-base text-foreground">
          <Text className={`text-base ${unread ? 'font-semibold' : 'font-medium'} text-foreground`}>
            {chatTitle(chat)}
          </Text>
          {isGroup ? null : <Text className="text-base text-primary"> @{primary.username}</Text>}
        </Text>
        <View className="flex-row items-center">
          <Text
            numberOfLines={1}
            className={`flex-shrink text-sm ${unread ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {messagePreview(last)}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {' · '}
            {formatRelativeTime(new Date(chat.updatedAt), now)}
          </Text>
        </View>
      </View>

      <View className="w-6 items-center">
        {unread ? (
          <View
            className="h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1"
            testID={`unread-${chat.id}`}
          >
            <Text className="text-[11px] font-semibold text-primary-foreground">
              {chat.unreadCount}
            </Text>
          </View>
        ) : seen ? (
          <UserAvatar name={primary.displayName} size="xs" />
        ) : null}
      </View>
    </Pressable>
  );
}
