import { useMutation, useQueryClient } from '@tanstack/react-query';

import { http } from '@/lib/http/http-client';
import { useOutboxStore } from '../store';
import { ChatSchema, type CreateChatInput, CreateChatInputSchema } from '../types/chat';
import {
  type Message,
  MessageSchema,
  type SendMessageInput,
  SendMessageInputSchema,
} from '../types/message';
import { appendMessage } from '../utils/messages-cache';
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

type SendVariables = SendMessageInput & { localId: string };

/**
 * Sends outbox messages. A message is marked sent only when the request succeeds: the server
 * copy (status `sent`) is added to the messages cache and the outbox entry is removed. On any
 * failure (HTTP error, timeout, offline) the entry stays in the outbox as `failed`.
 * Callbacks live on the mutation (not on `mutate`) so they also run for concurrent sends and
 * after the chat screen is closed.
 */
export function useSendMessageMutation(chatId: string) {
  const queryClient = useQueryClient();
  const { markFailed, remove } = useOutboxStore.getState();

  return useMutation<Message, Error, SendVariables>({
    mutationFn: ({ text }) => sendMessage(chatId, { text }),
    onSuccess: (message, { localId }) => {
      queryClient.setQueryData<MessagesData>(chatsKeys.messages(chatId), (data) =>
        appendMessage(data, message),
      );
      remove(localId);
    },
    onError: (_error, { localId }) => markFailed(localId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: chatsKeys.list() }),
  });
}
