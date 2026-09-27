import { formatDayLabel, isSameDay } from '@/utils/format-time';

import type { Message } from '../types/message';
import { messageKey } from './thread';

export type MessageRow =
  | { kind: 'day'; key: string; label: string }
  | {
      kind: 'message';
      key: string;
      message: Message;
      /** Last message of a run from the same sender — shows the avatar. */
      isLastInGroup: boolean;
      /** First message of a run — shows the sender name in group chats. */
      isFirstInGroup: boolean;
    };

/** Interleaves chronological messages with day separators and marks sender groups. */
export function buildMessageRows(
  messages: readonly Message[],
  now: Date = new Date(),
): MessageRow[] {
  const rows: MessageRow[] = [];

  messages.forEach((message, index) => {
    const date = new Date(message.createdAt);
    const previous = messages[index - 1];
    const next = messages[index + 1];
    const newDay = !previous || !isSameDay(new Date(previous.createdAt), date);

    if (newDay)
      rows.push({
        kind: 'day',
        key: `day_${messageKey(message)}`,
        label: formatDayLabel(date, now),
      });

    const nextSameGroup =
      next !== undefined &&
      next.senderId === message.senderId &&
      isSameDay(new Date(next.createdAt), date);
    rows.push({
      kind: 'message',
      key: messageKey(message),
      message,
      isLastInGroup: !nextSameGroup,
      isFirstInGroup: newDay || previous?.senderId !== message.senderId,
    });
  });

  return rows;
}
