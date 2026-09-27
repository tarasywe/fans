import { simulateAppRestart } from '@test/app-restart';
import { renderPersistedApp, waitForRestore } from '@test/test-utils';
import { screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMockFaults } from '@/lib/mock';

import { sendMessage } from '../../api/mutations';
import { chatsDb } from '../../mocks/chats-store';
import { useOutboxStore } from '../../outbox/outbox-store';
import { ChatScreen } from '../../screens/chat-screen';
import { freshInstall, serverTexts, statusOf } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(),
}));

beforeEach(() => {
  freshInstall();
  jest.mocked(useLocalSearchParams).mockReturnValue({ chatId: 'c_1' });
});

/**
 * Focused: the app is killed while a send is in flight *after* the server accepted it
 * (the response never arrived). On restart the entry is re-queued with the same client ID and
 * the server answers with the message it already has — exactly one copy.
 */
it('recovers an in-flight send after an app restart without duplicating it', async () => {
  const { enqueue, markSending } = useOutboxStore.getState();
  const entry = enqueue('c_1', 'sent right before the crash');
  markSending(entry.clientId);
  // The request reached the server…
  await sendMessage('c_1', { clientId: entry.clientId, text: entry.text });
  expect(serverTexts('c_1').filter((t) => t === entry.text)).toHaveLength(1);
  // …and the app died before handling the response.

  simulateAppRestart();
  expect(useOutboxStore.getState().entries).toEqual([
    expect.objectContaining({ clientId: entry.clientId, status: 'queued' }),
  ]);

  await renderPersistedApp(<ChatScreen />);
  await waitForRestore('message-list');
  await waitFor(() => expect(useOutboxStore.getState().entries).toEqual([]));

  expect(serverTexts('c_1').filter((t) => t === entry.text)).toHaveLength(1);
  await waitFor(() => expect(screen.getAllByText(entry.text)).toHaveLength(1));
  expect(statusOf(entry.clientId)).toMatch(/Sent$/);
});

it('delivers messages queued before a restart in their local order once back online', async () => {
  useMockFaults.getState().set({ offline: true });
  const { enqueue } = useOutboxStore.getState();
  const texts = ['a', 'b', 'c'];
  for (const text of texts) enqueue('c_1', text);

  simulateAppRestart();
  useMockFaults.getState().set({ offline: false });
  await renderPersistedApp(<ChatScreen />);

  await waitFor(() => expect(useOutboxStore.getState().entries).toEqual([]), { timeout: 5000 });
  expect(serverTexts('c_1').slice(-3)).toEqual(texts);
  expect(
    chatsDb
      .find('c_1')
      ?.messages.slice(-3)
      .every((m) => m.clientId),
  ).toBe(true);
});
