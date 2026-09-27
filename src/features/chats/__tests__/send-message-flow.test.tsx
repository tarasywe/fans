import { installTestMocks, renderWithQuery, resetNetwork } from '@test/test-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMockFaults } from '@/lib/mock';

import { chatsDb } from '../mocks/chats-store';
import { useOutboxStore } from '../outbox/outbox-store';
import { ChatScreen } from '../screens/chat-screen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(),
}));

beforeEach(() => {
  installTestMocks();
  resetNetwork();
  chatsDb.reset();
  useOutboxStore.getState().clear();
});

async function openChat(chatId: string) {
  jest.mocked(useLocalSearchParams).mockReturnValue({ chatId });
  const result = await renderWithQuery(<ChatScreen />);
  await screen.findByTestId('message-list');
  return result;
}

async function type(text: string) {
  await fireEvent.changeText(screen.getByTestId('message-input'), text);
  await fireEvent.press(screen.getByTestId('send-button'));
}

/** Status line ("5:40 pm · Sent") of the newest own message, or of the n-th newest. */
function latestStatus(fromEnd = 1) {
  const statuses = screen.getAllByTestId(/^message-status-/);
  return statuses[statuses.length - fromEnd];
}

const serverTexts = (chatId: string) =>
  chatsDb.find(chatId)?.messages.flatMap((m) => (m.type === 'text' ? [m.text] : [])) ?? [];

describe('sending messages', () => {
  it('shows the message immediately, then "Sent" once the server confirms', async () => {
    await openChat('c_1');
    installTestMocks(80); // network latency for the POST
    await type('Hello there');

    expect(latestStatus()).toHaveTextContent(/Queued|Sending…/);
    await waitFor(() => expect(latestStatus()).toHaveTextContent(/· Sent$/), { timeout: 2000 });
    expect(useOutboxStore.getState().entries).toEqual([]);
    expect(serverTexts('c_1').at(-1)).toBe('Hello there');
  });

  it('marks a 500 as "Not sent", explains it and offers Retry; Delete removes it', async () => {
    await openChat('c_test_error');
    await type('This will fail');

    await waitFor(() => expect(latestStatus()).toHaveTextContent(/Not sent/));
    expect(screen.getByText('Server error. Your message was not sent.')).toBeTruthy();
    expect(screen.getByLabelText('Retry sending')).toBeTruthy();
    expect(screen.queryByLabelText('Edit message')).toBeNull();

    await fireEvent.press(screen.getByLabelText('Retry sending'));
    await waitFor(() => expect(latestStatus()).toHaveTextContent(/Not sent/));
    expect(screen.getAllByText('This will fail')).toHaveLength(1);

    await fireEvent.press(screen.getByLabelText('Delete message'));
    expect(screen.queryByText('This will fail')).toBeNull();
    expect(useOutboxStore.getState().entries).toEqual([]);
  });

  it('a Retry after a one-off server error delivers the message', async () => {
    await openChat('c_1');
    useMockFaults.getState().set({ failWith500: 1 });
    await type('Second try');
    await waitFor(() => expect(latestStatus()).toHaveTextContent(/Not sent/));

    await fireEvent.press(screen.getByLabelText('Retry sending'));
    await waitFor(() => expect(latestStatus()).toHaveTextContent(/· Sent$/));
    expect(serverTexts('c_1').filter((text) => text === 'Second try')).toHaveLength(1);
  });

  it('explains non-recoverable errors, keeps the text and offers Edit instead of Retry', async () => {
    await openChat('c_2');
    chatsDb.remove('c_2'); // the chat disappears on the server
    await type('Keep my words');

    await waitFor(() => expect(latestStatus()).toHaveTextContent(/Not sent/));
    expect(screen.getByText(/This chat is no longer available/)).toBeTruthy();
    expect(screen.queryByLabelText('Retry sending')).toBeNull();
    expect(screen.getByText('Keep my words')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Edit message'));
    expect(screen.getByTestId('message-input').props.value).toBe('Keep my words');
    expect(useOutboxStore.getState().entries).toEqual([]);
  });

  it('waits while offline and delivers automatically on reconnect', async () => {
    await openChat('c_1');
    await act(async () => useMockFaults.getState().set({ offline: true }));
    await type('Offline message');

    expect(latestStatus()).toHaveTextContent(/Waiting for network/);
    expect(screen.getByTestId('offline-banner')).toHaveTextContent(/1 message will be sent/);
    expect(serverTexts('c_1')).not.toContain('Offline message');

    await act(async () => useMockFaults.getState().set({ offline: false }));
    await waitFor(() => expect(latestStatus()).toHaveTextContent(/· Sent$/));
    expect(screen.queryByTestId('offline-banner')).toBeNull();
    expect(serverTexts('c_1').filter((text) => text === 'Offline message')).toHaveLength(1);
  });

  it('keeps failed messages when the conversation is refetched', async () => {
    const { client } = await openChat('c_test_error');
    await type('Still here');
    await waitFor(() => expect(latestStatus()).toHaveTextContent(/Not sent/));

    await act(async () => {
      await client.refetchQueries({ queryKey: ['chats', 'messages', 'c_test_error'] });
    });
    expect(latestStatus()).toHaveTextContent(/Not sent/);
  });

  it('sends several messages one at a time, in the order they were written', async () => {
    await openChat('c_1');
    installTestMocks(30);
    await type('first');
    await type('second');
    await type('third');
    await waitFor(() => expect(useOutboxStore.getState().entries).toEqual([]), { timeout: 3000 });
    expect(serverTexts('c_1').slice(-3)).toEqual(['first', 'second', 'third']);
  });
});
