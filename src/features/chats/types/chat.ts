import { UserSummarySchema } from '@features/users';
import { z } from 'zod';

import { MessageSchema } from './message';

export const ChatSchema = z.object({
  id: z.string().min(1),
  /** Other participants (never includes the current user). */
  participants: z.array(UserSummarySchema).min(1),
  lastMessage: MessageSchema.nullable(),
  unreadCount: z.number().int().nonnegative(),
  updatedAt: z.iso.datetime(),
});

export const ChatListSchema = z.array(ChatSchema);

export const CreateChatInputSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1, 'Select at least one user'),
});

export type Chat = z.infer<typeof ChatSchema>;
export type CreateChatInput = z.infer<typeof CreateChatInputSchema>;
export type ChatSortOrder = 'newest' | 'oldest';
