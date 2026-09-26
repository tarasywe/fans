import { z } from 'zod';

import { MESSAGE_MAX_LENGTH } from '../constants/limits';

const MessageBaseSchema = z.object({
  id: z.string().min(1),
  chatId: z.string().min(1),
  senderId: z.string().min(1),
  createdAt: z.iso.datetime(),
  status: z.enum(['sending', 'sent', 'read', 'failed']),
});

export const TextMessageSchema = MessageBaseSchema.extend({
  type: z.literal('text'),
  text: z.string().min(1).max(MESSAGE_MAX_LENGTH),
});

export const GiftMessageSchema = MessageBaseSchema.extend({
  type: z.literal('gift'),
  amountCents: z.number().int().positive(),
});

export const MessageSchema = z.discriminatedUnion('type', [TextMessageSchema, GiftMessageSchema]);

export const MessagesPageSchema = z.object({
  /** Chronological (oldest → newest) slice of the conversation. */
  items: z.array(MessageSchema),
  /** Cursor for the next *older* page, `null` when the start of the chat is reached. */
  nextCursor: z.string().nullable(),
});

export const SendMessageInputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(MESSAGE_MAX_LENGTH, `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters`),
});

export type Message = z.infer<typeof MessageSchema>;
export type TextMessage = z.infer<typeof TextMessageSchema>;
export type GiftMessage = z.infer<typeof GiftMessageSchema>;
export type MessagesPage = z.infer<typeof MessagesPageSchema>;
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;
