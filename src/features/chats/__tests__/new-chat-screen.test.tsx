import { installTestMocks, renderWithQuery } from '@test/test-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { chatsDb } from '../mocks/chats-store';
import { NewChatScreen } from '../screens/new-chat-screen';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), back: jest.fn() } }));

beforeAll(installTestMocks);
beforeEach(() => {
  chatsDb.reset();
  jest.clearAllMocks();
});

const button = () => screen.getByTestId('start-chat-button');

describe('NewChatScreen', () => {
  it('disables the submit button until a user is selected', async () => {
    await renderWithQuery(<NewChatScreen />);
    await screen.findByTestId('user-row-u_1');
    expect(button().props.accessibilityState?.disabled).toBe(true);
    expect(screen.getByText('Start Chat')).toBeTruthy();
  });

  it('switches to "Message to (N) Users" for several users', async () => {
    await renderWithQuery(<NewChatScreen />);
    await fireEvent.press(await screen.findByTestId('user-row-u_1'));
    expect(screen.getByText('Start Chat')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('user-row-u_2'));
    expect(screen.getByText('Message to (2) Users')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('user-row-u_2'));
    expect(screen.getByText('Start Chat')).toBeTruthy();
  });

  it('selects every member of a fan list', async () => {
    await renderWithQuery(<NewChatScreen />);
    await fireEvent.press(await screen.findByTestId('fan-list-fl_1'));
    expect(screen.getByText('Message to (4) Users')).toBeTruthy();
    expect(screen.getByTestId('user-row-u_3').props.accessibilityState.checked).toBe(true);
  });

  it('searches users (debounced) and hides fan lists while searching', async () => {
    jest.useFakeTimers();
    await renderWithQuery(<NewChatScreen />);
    await screen.findByTestId('user-row-u_1');
    await fireEvent.changeText(screen.getByTestId('users-search'), 'olivia');
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
    await waitFor(() => expect(screen.queryByTestId('user-row-u_1')).toBeNull());
    expect(screen.getByTestId('user-row-u_2')).toBeTruthy();
    expect(screen.queryByTestId('fan-list-fl_1')).toBeNull();

    await fireEvent.changeText(screen.getByTestId('users-search'), 'nobody-here');
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
    expect(await screen.findByTestId('users-empty')).toBeTruthy();
    jest.useRealTimers();
  });

  it('opens the existing one-to-one chat', async () => {
    await renderWithQuery(<NewChatScreen />);
    await fireEvent.press(await screen.findByTestId('user-row-u_1'));
    await fireEvent.press(button());
    await act(async () => undefined);
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/chats/[chatId]',
      params: { chatId: 'c_1' },
    });
  });

  it('creates a new group chat', async () => {
    await renderWithQuery(<NewChatScreen />);
    await fireEvent.press(await screen.findByTestId('user-row-u_5'));
    await fireEvent.press(screen.getByTestId('user-row-u_6'));
    await fireEvent.press(button());
    await act(async () => undefined);
    const created = chatsDb.all()[0];
    expect(created?.participantIds).toEqual(['u_5', 'u_6']);
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/chats/[chatId]',
      params: { chatId: created?.id },
    });
  });

  it('closes the modal', async () => {
    await renderWithQuery(<NewChatScreen />);
    await screen.findByTestId('user-row-u_1');
    await fireEvent.press(screen.getByTestId('close-new-chat'));
    expect(router.back).toHaveBeenCalled();
  });
});
