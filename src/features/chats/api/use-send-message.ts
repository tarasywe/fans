import { useOutboxStore } from '../store';
import { useSendMessageMutation } from './mutations';

/** Send / retry / discard for one chat, backed by the outbox store. */
export function useSendMessage(chatId: string) {
  const mutation = useSendMessageMutation(chatId);
  const { enqueue, markSending, remove } = useOutboxStore.getState();

  const send = (text: string) => {
    const entry = enqueue(chatId, text.trim());
    mutation.mutate({ localId: entry.localId, text: entry.text });
  };

  const retry = (localId: string) => {
    const entry = useOutboxStore.getState().entries.find((item) => item.localId === localId);
    if (entry?.status !== 'failed') return;
    markSending(localId);
    mutation.mutate({ localId, text: entry.text });
  };

  return { send, retry, discard: remove };
}
