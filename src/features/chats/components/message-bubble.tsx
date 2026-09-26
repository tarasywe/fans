import type { UserSummary } from '@features/users';
import { Icon } from '@ui/icon';
import { Pressable } from '@ui/pressable';
import { Text } from '@ui/text';
import { View } from 'react-native';
import { GiftIcon } from '@/components/shared/icons';
import { UserAvatar } from '@/components/shared/user-avatar';
import { formatClockTime } from '@/utils/format-time';

import type { Message } from '../types/message';
import { formatAmount, isOwnMessage } from '../utils/message-format';

type MessageBubbleProps = {
  message: Message;
  sender?: UserSummary;
  showAvatar: boolean;
  showSenderName: boolean;
  onAvatarPress: (userId: string) => void;
};

const STATUS_LABEL: Record<Message['status'], string> = {
  sending: 'Sending…',
  sent: 'Sent',
  read: 'Read',
  failed: 'Failed',
};

function GiftBody({ message }: { message: Extract<Message, { type: 'gift' }> }) {
  const own = isOwnMessage(message);
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-xl border border-primary bg-background">
        <Icon as={GiftIcon} className="h-5 w-5 text-primary" />
      </View>
      <Text className="text-base text-foreground">
        {own ? 'You sent' : 'Sent you'} a {formatAmount(message.amountCents)} gift!
      </Text>
    </View>
  );
}

export function MessageBubble({
  message,
  sender,
  showAvatar,
  showSenderName,
  onAvatarPress,
}: MessageBubbleProps) {
  const own = isOwnMessage(message);
  const time = formatClockTime(new Date(message.createdAt));

  return (
    <View
      className={`flex-row items-end gap-2 px-4 py-1 ${own ? 'justify-end pl-14' : 'pr-10'}`}
      testID={`message-${message.id}`}
    >
      {own ? null : (
        <View className="w-8">
          {showAvatar && sender ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${sender.displayName}'s profile`}
              onPress={() => onAvatarPress(sender.id)}
              testID={`message-avatar-${message.id}`}
            >
              <UserAvatar name={sender.displayName} size="sm" />
            </Pressable>
          ) : null}
        </View>
      )}

      <View
        className={`flex-shrink gap-1 rounded-2xl px-3.5 py-2.5 ${
          own ? 'rounded-br-md bg-secondary' : 'rounded-bl-md bg-bubble'
        } ${message.status === 'sending' ? 'opacity-60' : ''}`}
      >
        {showSenderName && sender && !own ? (
          <Text className="text-xs font-semibold text-primary">{sender.displayName}</Text>
        ) : null}
        {message.type === 'gift' ? (
          <GiftBody message={message} />
        ) : (
          <Text className="text-base leading-6 text-foreground">{message.text}</Text>
        )}
        <Text className={`text-xs text-muted-foreground ${own ? 'self-end' : ''}`}>
          {time}
          {own ? ` · ${STATUS_LABEL[message.status]}` : ''}
        </Text>
      </View>
    </View>
  );
}
