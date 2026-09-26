import { installTestMocks, renderWithQuery } from '@test/test-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AxiosError } from 'axios';
import { useLocalSearchParams } from 'expo-router';
import { http } from '@/lib/http/http-client';

import { chatsDb } from '../mocks/chats-store';
import { ChatScreen } from '../screens/chat-screen';
import { useOutboxStore } from '../store';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(),
}));

beforeEach(() => {
  installTestMocks();
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

describe('sending messages', () => {
  it('shows "Sending…" immediately and "Sent" once the request succeeds', async () => {
    await openChat('c_1');
    installTestMocks(80); // network latency for the POST
    await type('Hello there');

    expect(latestStatus()).toHaveTextContent(/Sending…/);
    await waitFor(() => expect(latestStatus()).toHaveTextContent(/· Sent$/), { timeout: 2000 });
    expect(useOutboxStore.getState().entries).toEqual([]);
    expect(chatsDb.find('c_1')?.messages.at(-1)).toMatchObject({ text: 'Hello there' });
  });

  it('marks the message "Not sent" with Retry/Delete when the server answers 500', async () => {
    await openChat('c_test_error');
    await type('This will fail');

    await waitFor(() => expect(latestStatus()).toHaveTextContent(/Not sent/));
    expect(screen.getByTestId('failed-actions')).toBeTruthy();
    expect(useOutboxStore.getState().entries[0]?.status).toBe('failed');
    expect(
      chatsDb
        .find('c_test_error')
        ?.messages.some((m) => m.type === 'text' && m.text === 'This will fail'),
    ).toBe(false);
  });

  it('retrying in the error chat fails again; Delete removes the message', async () => {
    await openChat('c_test_error');
    await type('Retry me');
    await waitFor(() => expect(latestStatus()).toHaveTextContent(/Not sent/));

    await fireEvent.press(screen.getByLabelText('Retry sending'));
    await waitFor(() => expect(latestStatus()).toHaveTextContent(/Not sent/));
    expect(screen.getAllByText('Retry me')).toHaveLength(1);

    await fireEvent.press(screen.getByLabelText('Delete message'));
    expect(screen.queryByText('Retry me')).toBeNull();
    expect(useOutboxStore.getState().entries).toEqual([]);
  });

  it('fails while offline and succeeds on retry once the network is back', async () => {
    await openChat('c_1');
    const online = http.defaults.adapter;
    http.defaults.adapter = async (config) => {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
    };

    await type('Offline message');
    await waitFor(() => expect(latestStatus()).toHaveTextContent(/Not sent/));

    http.defaults.adapter = online;
    await fireEvent.press(screen.getByLabelText('Retry sending'));
    await waitFor(() => expect(latestStatus()).toHaveTextContent(/· Sent$/));
    expect(screen.queryByTestId('failed-actions')).toBeNull();
    expect(screen.getAllByText('Offline message')).toHaveLength(1);
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

  it('keeps each message independent when several are sent at once', async () => {
    await openChat('c_1');
    installTestMocks(50);
    await type('first');
    await type('second');
    await waitFor(() => {
      expect(latestStatus(2)).toHaveTextContent(/· Sent$/);
      expect(latestStatus(1)).toHaveTextContent(/· Sent$/);
    });
    const texts = chatsDb
      .find('c_1')
      ?.messages.slice(-2)
      .map((m) => (m.type === 'text' ? m.text : ''));
    expect(texts).toEqual(['first', 'second']);
  });
});
