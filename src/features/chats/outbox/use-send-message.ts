import { useOutboxStore } from './outbox-store';
import { outboxSync } from './outbox-sync';

/** Send / retry / discard for the chat screen. Sending itself is done by the app-wide outbox sync. */
export function useSendMessage(chatId: string) {
  const { enqueue, retry, remove } = useOutboxStore.getState();

  return {
    /** Persists the message first (durable), then asks the sync to deliver it. */
    send: (text: string) => {
      enqueue(chatId, text.trim());
      outboxSync.kick();
    },
    retry: (clientId: string) => {
      retry(clientId);
      outboxSync.kick();
    },
    discard: (clientId: string) => remove(clientId),
  };
}
