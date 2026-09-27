import { installTestMocks, renderWithQuery, resetNetwork } from '@test/test-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMockFaults } from '@/lib/mock';

import { chatsDb } from '../../mocks/chats-store';
import { useOutboxStore } from '../../outbox/outbox-store';
import { ChatScreen } from '../../screens/chat-screen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(),
}));

const TEXT = 'Only once please';

const serverCopies = () =>
  chatsDb
    .find('c_1')
    ?.messages.filter((message) => message.type === 'text' && message.text === TEXT).length ?? 0;

beforeEach(() => {
  installTestMocks();
  resetNetwork();
  chatsDb.reset();
  useOutboxStore.getState().clear();
  useMockFaults.getState().reset();
});

/**
 * Case: the server accepts a send but the response is lost (network drops after the write).
 * The user retries. The thread must contain exactly one copy of the message.
 */
it('keeps a single copy when an accepted send loses its response and is retried', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ chatId: 'c_1' });
  const { client } = await renderWithQuery(<ChatScreen />);
  await screen.findByTestId('message-list');

  useMockFaults.getState().set({ loseResponses: 1 });
  await fireEvent.changeText(screen.getByTestId('message-input'), TEXT);
  await fireEvent.press(screen.getByTestId('send-button'));

  // The server stored the message even though the client saw a network error.
  await waitFor(() => expect(serverCopies()).toBe(1));

  // Retry (manually if offered, otherwise the app retries on its own).
  const retry = screen.queryByLabelText('Retry sending');
  if (retry) await fireEvent.press(retry);

  await waitFor(() => expect(useOutboxStore.getState().entries).toEqual([]), { timeout: 5000 });
  await act(async () => {
    await client.refetchQueries({ queryKey: ['chats', 'messages', 'c_1'] });
  });

  expect(serverCopies()).toBe(1);
  expect(screen.getAllByText(TEXT)).toHaveLength(1);
});
