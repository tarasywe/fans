import { useMutation, useQueryClient } from '@tanstack/react-query';

import { http } from '@/lib/http/http-client';
import { ChatSchema, type CreateChatInput, CreateChatInputSchema } from '../types/chat';
import { MessageSchema, type SendMessageInput, SendMessageInputSchema } from '../types/message';
import { chatsEndpoints } from './endpoints';
import { chatsKeys } from './queries';

export async function createChat(input: CreateChatInput) {
  const body = CreateChatInputSchema.parse(input);
  const { data } = await http.post(chatsEndpoints.create, body);
  return ChatSchema.parse(data);
}

export async function sendMessage(chatId: string, input: SendMessageInput) {
  const body = SendMessageInputSchema.parse(input);
  const { data } = await http.post(chatsEndpoints.messages(chatId), body);
  return MessageSchema.parse(data);
}

export function useCreateChatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChat,
    onSuccess: (chat) => {
      queryClient.setQueryData(chatsKeys.detail(chat.id), chat);
      return queryClient.invalidateQueries({ queryKey: chatsKeys.list() });
    },
  });
}
