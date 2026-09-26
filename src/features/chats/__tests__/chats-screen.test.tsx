import { installTestMocks, renderWithQuery } from '@test/test-utils';
import { fireEvent, screen, within } from '@testing-library/react-native';
import { router } from 'expo-router';
import { links } from '@/config/links';

import { chatsDb } from '../mocks/chats-store';
import { ChatsScreen } from '../screens/chats-screen';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

beforeAll(installTestMocks);
beforeEach(() => {
  chatsDb.reset();
  jest.clearAllMocks();
});

const chatIds = () =>
  within(screen.getByTestId('chats-list'))
    .queryAllByTestId(/^chat-item-/)
    .map((node) => String(node.props.testID).replace('chat-item-', ''));

describe('ChatsScreen', () => {
  it('shows a loader, then the mocked conversations newest first', async () => {
    await renderWithQuery(<ChatsScreen />);
    expect(screen.getByTestId('loading-state')).toBeTruthy();
    await screen.findByTestId('chats-list');
    expect(chatIds()).toHaveLength(chatsDb.all().length);
    expect(chatIds()[0]).toBe('c_1');
  });

  it('filters by username and shows an empty state when nothing matches', async () => {
    await renderWithQuery(<ChatsScreen />);
    await screen.findByTestId('chats-list');

    await fireEvent.changeText(screen.getByTestId('chats-search'), '@Olivia_Rivera');
    expect(chatIds()).toEqual(['c_2']);

    await fireEvent.changeText(screen.getByTestId('chats-search'), 'no-such-user');
    expect(screen.getByTestId('chats-empty')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('chats-search-clear'));
    expect(chatIds()).toHaveLength(chatsDb.all().length);
  });

  it('toggles the order and the icon', async () => {
    await renderWithQuery(<ChatsScreen />);
    await screen.findByTestId('chats-list');
    const newestFirst = chatIds();
    expect(screen.getByTestId('sort-icon-newest')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('sort-toggle'));
    expect(screen.getByTestId('sort-icon-oldest')).toBeTruthy();
    expect(chatIds()).toEqual([...newestFirst].reverse());
  });

  it('navigates to a chat, a profile and the new chat screen', async () => {
    await renderWithQuery(<ChatsScreen />);
    await screen.findByTestId('chats-list');

    await fireEvent.press(screen.getByTestId('chat-item-c_1'));
    expect(router.push).toHaveBeenCalledWith(links.chat('c_1'));

    await fireEvent.press(screen.getByTestId('chat-avatar-c_1'));
    expect(router.push).toHaveBeenCalledWith(links.user('u_1'));

    await fireEvent.press(screen.getByTestId('new-chat-button'));
    expect(router.push).toHaveBeenCalledWith(links.newChat);
  });
});
