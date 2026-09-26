import { useMutation, useQueryClient } from '@tanstack/react-query';

import { CURRENT_USER_ID } from '@/config/session';
import { http } from '@/lib/http/http-client';

import { ChatSchema, type CreateChatInput, CreateChatInputSchema } from '../types/chat';
import {
  MessageSchema,
  type SendMessageInput,
  SendMessageInputSchema,
  type TextMessage,
} from '../types/message';
import { appendMessage, replaceMessage } from '../utils/messages-cache';
import { chatsEndpoints } from './endpoints';
import { chatsKeys, type MessagesData } from './queries';

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

type SendContext = { tempId: string; previous: MessagesData | undefined };

/** Sends a text message with an optimistic bubble that is swapped for the server copy. */
export function useSendMessageMutation(chatId: string) {
  const queryClient = useQueryClient();
  const key = chatsKeys.messages(chatId);

  return useMutation<Awaited<ReturnType<typeof sendMessage>>, Error, SendMessageInput, SendContext>(
    {
      mutationFn: (input) => sendMessage(chatId, input),
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: key });
        const previous = queryClient.getQueryData<MessagesData>(key);
        const tempId = `temp_${Date.now()}`;
        const optimistic: TextMessage = {
          id: tempId,
          chatId,
          senderId: CURRENT_USER_ID,
          createdAt: new Date().toISOString(),
          status: 'sending',
          type: 'text',
          text: input.text.trim(),
        };
        queryClient.setQueryData<MessagesData>(key, (data) => appendMessage(data, optimistic));
        return { tempId, previous };
      },
      onError: (_error, _input, context) => {
        if (context) queryClient.setQueryData(key, context.previous);
      },
      onSuccess: (message, _input, context) => {
        queryClient.setQueryData<MessagesData>(key, (data) =>
          replaceMessage(data, context.tempId, message),
        );
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: chatsKeys.list() }),
    },
  );
}
