import { installTestMocks, renderWithQuery } from '@test/test-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { links } from '@/config/links';

import { MESSAGES_PAGE_SIZE } from '../constants/limits';
import { chatsDb } from '../mocks/chats-store';
import { ChatScreen } from '../screens/chat-screen';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(),
}));

beforeAll(installTestMocks);
beforeEach(() => {
  chatsDb.reset();
  jest.clearAllMocks();
});

const renderedMessageIds = () =>
  screen
    .queryAllByTestId(/^message-c_/)
    .map((node) => String(node.props.testID).replace('message-', ''));

async function openChat(chatId: string) {
  jest.mocked(useLocalSearchParams).mockReturnValue({ chatId });
  const result = await renderWithQuery(<ChatScreen />);
  await screen.findByTestId('message-list');
  return result;
}

describe('ChatScreen', () => {
  it('shows the receiver in the header', async () => {
    await openChat('c_1');
    expect(screen.getByTestId('chat-header')).toBeTruthy();
    expect(screen.getByText('Ethan Shoots')).toBeTruthy();
    expect(screen.getByText('@ethan_shoots')).toBeTruthy();
  });

  it('loads only the latest 20 messages, newest at the bottom', async () => {
    await openChat('c_1');
    const all = chatsDb.find('c_1')?.messages.map((message) => message.id) ?? [];
    expect(renderedMessageIds()).toEqual(all.slice(-MESSAGES_PAGE_SIZE));
  });

  it('loads the next 20 older messages when scrolled to the top, then stops at the start', async () => {
    await openChat('c_1');
    const all = chatsDb.find('c_1')?.messages.map((message) => message.id) ?? [];

    await fireEvent.press(screen.getByTestId('message-list-start-reached'));
    await waitFor(() => expect(renderedMessageIds()).toHaveLength(MESSAGES_PAGE_SIZE * 2));
    expect(renderedMessageIds()).toEqual(all.slice(-MESSAGES_PAGE_SIZE * 2));

    for (let page = 2; page < all.length / MESSAGES_PAGE_SIZE; page += 1) {
      await fireEvent.press(screen.getByTestId('message-list-start-reached'));
      await waitFor(() =>
        expect(renderedMessageIds()).toHaveLength(MESSAGES_PAGE_SIZE * (page + 1)),
      );
    }
    expect(renderedMessageIds()).toEqual(all);
    expect(screen.getByTestId('conversation-start')).toBeTruthy();

    // Reaching the top again must not request anything more.
    await fireEvent.press(screen.getByTestId('message-list-start-reached'));
    expect(screen.queryByTestId('loading-older-messages')).toBeNull();
  });

  it('sends a message optimistically and shows it last', async () => {
    await openChat('c_1');
    await fireEvent.changeText(screen.getByTestId('message-input'), 'Brand new message');
    await fireEvent.press(screen.getByTestId('send-button'));
    await act(async () => undefined);
    expect(screen.getAllByText('Brand new message')).toHaveLength(1);
    const last = chatsDb.find('c_1')?.messages.at(-1);
    expect(last?.type === 'text' && last.text).toBe('Brand new message');
  });

  it('opens the profile from the header', async () => {
    await openChat('c_1');
    await fireEvent.press(screen.getByTestId('full-details-button'));
    expect(router.push).toHaveBeenCalledWith(links.user('u_1'));
  });

  it('shows recipient chips for group chats', async () => {
    await openChat('c_group_1');
    expect(screen.getByText('Separate Message to (4) users')).toBeTruthy();
    expect(screen.getByTestId('recipient-u_20')).toBeTruthy();
  });

  it('shows an error state for unknown chats', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ chatId: 'nope' });
    await renderWithQuery(<ChatScreen />);
    expect(await screen.findByTestId('error-state')).toBeTruthy();
  });
});
