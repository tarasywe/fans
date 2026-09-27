import { z } from 'zod';

import { MESSAGE_MAX_LENGTH } from '../constants/limits';

const MessageBaseSchema = z.object({
  id: z.string().min(1),
  chatId: z.string().min(1),
  senderId: z.string().min(1),
  createdAt: z.iso.datetime(),
  status: z.enum(['queued', 'sending', 'sent', 'read', 'failed']),
  /** Idempotency key chosen by the sending client; present on messages sent through the API. */
  clientId: z.string().min(1).max(64).nullish(),
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

/** Client-generated idempotency key: stable across retries and app restarts. */
export const ClientIdSchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, 'Invalid client id');

export const SendMessageInputSchema = z.object({
  clientId: ClientIdSchema,
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
