import type { UserSummary } from '@features/users';
import { Icon } from '@ui/icon';
import { Pressable } from '@ui/pressable';
import { Text } from '@ui/text';
import { View } from 'react-native';
import { GiftIcon } from '@/components/shared/icons';
import { UserAvatar } from '@/components/shared/user-avatar';
import { formatClockTime } from '@/utils/format-time';

import type { OutboxEntry } from '../outbox/outbox-store';
import type { Message } from '../types/message';
import { formatAmount, isOwnMessage } from '../utils/message-format';

export type PendingActions = {
  onRetry: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
  onEdit: (clientId: string) => void;
};

type MessageBubbleProps = {
  message: Message;
  sender?: UserSummary;
  showAvatar: boolean;
  showSenderName: boolean;
  onAvatarPress: (userId: string) => void;
  /** Present while the message is still in the local outbox (queued / sending / failed). */
  pending?: OutboxEntry;
  isOnline: boolean;
  actions?: PendingActions;
};

const CONFIRMED_LABEL = { sent: 'Sent', read: 'Read' } as const;

/** Delivery status line for own messages. */
export function deliveryLabel(
  message: Message,
  pending: OutboxEntry | undefined,
  isOnline: boolean,
) {
  if (!pending) return message.status === 'read' ? CONFIRMED_LABEL.read : CONFIRMED_LABEL.sent;
  if (pending.status === 'sending') return 'Sending…';
  if (pending.status === 'failed') return 'Not sent';
  if (!isOnline) return 'Waiting for network';
  return pending.attempts > 0 ? 'Retrying…' : 'Queued';
}

function PendingFooter({ entry, actions }: { entry: OutboxEntry; actions: PendingActions }) {
  const { error } = entry;
  if (entry.status !== 'failed' || !error) return null;
  return (
    <View className="gap-1 pt-1" testID="failed-actions">
      <Text className="text-xs text-destructive" testID={`send-error-${entry.clientId}`}>
        {error.message}
      </Text>
      <View className="flex-row items-center justify-end gap-4">
        {error.recoverable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry sending"
            onPress={() => actions.onRetry(entry.clientId)}
            hitSlop={8}
          >
            <Text className="text-sm font-semibold text-primary">Retry</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit message"
            onPress={() => actions.onEdit(entry.clientId)}
            hitSlop={8}
          >
            <Text className="text-sm font-semibold text-primary">Edit</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete message"
          onPress={() => actions.onDiscard(entry.clientId)}
          hitSlop={8}
        >
          <Text className="text-sm font-semibold text-destructive">Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

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
  pending,
  isOnline,
  actions,
}: MessageBubbleProps) {
  const own = isOwnMessage(message);
  const time = formatClockTime(new Date(message.createdAt));
  const failed = pending?.status === 'failed';
  const waiting = pending !== undefined && !failed;

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
        } ${waiting ? 'opacity-60' : ''} ${failed ? 'border border-destructive' : ''}`}
      >
        {showSenderName && sender && !own ? (
          <Text className="text-xs font-semibold text-primary">{sender.displayName}</Text>
        ) : null}
        {message.type === 'gift' ? (
          <GiftBody message={message} />
        ) : (
          <Text className="text-base leading-6 text-foreground">{message.text}</Text>
        )}
        <Text
          className={`text-xs ${failed ? 'text-destructive' : 'text-muted-foreground'} ${own ? 'self-end' : ''}`}
          testID={own ? `message-status-${message.clientId ?? message.id}` : undefined}
        >
          {time}
          {own ? ` · ${deliveryLabel(message, pending, isOnline)}` : ''}
        </Text>
        {pending && actions ? <PendingFooter entry={pending} actions={actions} /> : null}
      </View>
    </View>
  );
}
