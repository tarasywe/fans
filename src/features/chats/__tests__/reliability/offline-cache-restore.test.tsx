import { resetEverything } from '@features/dev-tools';
import { simulateAppRestart } from '@test/app-restart';
import { renderPersistedApp, startOffline } from '@test/test-utils';
import { act, screen } from '@testing-library/react-native';
import { useMockFaults } from '@/lib/mock';

import { ChatsScreen } from '../../screens/chats-screen';
import { freshInstall } from './helpers';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

beforeEach(freshInstall);

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20)); // throttled persister write
  });

async function restartOffline(unmount: () => void | Promise<void>) {
  await act(async () => useMockFaults.getState().set({ offline: true }));
  await unmount();
  simulateAppRestart();
  await renderPersistedApp(<ChatsScreen />);
}

it('reopens the chat list from the on-disk cache after a restart while offline', async () => {
  const { unmount } = await renderPersistedApp(<ChatsScreen />);
  await screen.findByTestId('chat-item-c_1');
  await settle();

  await restartOffline(unmount);

  expect(await screen.findByTestId('chat-item-c_1', {}, { timeout: 3000 })).toBeTruthy();
  expect(screen.queryByText('Loading conversations…')).toBeNull();
});

it('still persists the list after a Network lab reset while the list is mounted (regression)', async () => {
  const { client, unmount } = await renderPersistedApp(<ChatsScreen />);
  await screen.findByTestId('chat-item-c_1');

  // What the lab's Reset button does. queryClient.clear() here used to drop the mounted list
  // from the cache, so it was never persisted again and the next offline start spun forever.
  resetEverything();
  await act(async () => {
    await client.resetQueries();
  });
  await screen.findByTestId('chat-item-c_1');
  await settle();

  await restartOffline(unmount);
  expect(await screen.findByTestId('chat-item-c_1', {}, { timeout: 3000 })).toBeTruthy();
});

it('explains that the list will load later when offline with nothing cached', async () => {
  startOffline();
  await renderPersistedApp(<ChatsScreen />);
  expect(await screen.findByTestId('chats-offline')).toHaveTextContent(/You're offline/);
  expect(screen.queryByText('Loading conversations…')).toBeNull();
});
