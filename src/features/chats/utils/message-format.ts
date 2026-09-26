import { CURRENT_USER_ID } from '@/config/session';

import type { Message } from '../types/message';

export function formatAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function isOwnMessage(message: Message): boolean {
  return message.senderId === CURRENT_USER_ID;
}

/** Text used in the chat list preview. */
export function messagePreview(message: Message | null): string {
  if (!message) return 'No messages yet';
  const prefix = isOwnMessage(message) ? 'You: ' : '';
  const body =
    message.type === 'gift'
      ? `${isOwnMessage(message) ? 'Sent' : 'Sent you'} a ${formatAmount(message.amountCents)} gift`
      : message.text;
  return `${prefix}${body}`;
}

/**
 * Appends `insert` (e.g. an emoji) only if the result stays within `maxLength`
 * UTF-16 units — the same unit TextInput's `maxLength` counts.
 */
export function appendWithLimit(text: string, insert: string, maxLength: number): string {
  return text.length + insert.length > maxLength ? text : text + insert;
}
