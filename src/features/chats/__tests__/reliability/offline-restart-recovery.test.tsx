import { simulateAppRestart } from '@test/app-restart';
import { renderPersistedApp, waitForRestore } from '@test/test-utils';
import { act, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMockFaults } from '@/lib/mock';

import { chatsDb } from '../../mocks/chats-store';
import { useOutboxStore } from '../../outbox/outbox-store';
import { ChatScreen } from '../../screens/chat-screen';
import { freshInstall, renderedBubbleIds, serverTexts, statusOf, typeAndSend } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: jest.fn(),
}));

const CHAT = 'c_1';
const OUTGOING = ['first while offline', 'second while offline', 'third while offline'];

const goOffline = () => act(async () => useMockFaults.getState().set({ offline: true }));
const goOnline = () => act(async () => useMockFaults.getState().set({ offline: false }));

beforeEach(() => {
  freshInstall();
  jest.mocked(useLocalSearchParams).mockReturnValue({ chatId: CHAT });
});

/**
 * Requirement: go offline, send three messages (each shown immediately as waiting), force-stop
 * and reopen (still waiting), four messages arrive at the server meanwhile; on reconnect the
 * client recovers them and delivers the three pending ones — no duplicates, server order.
 */
it('queues offline sends durably, survives a restart, recovers incoming messages and delivers once', async () => {
  // 1. Open the chat online so it is cached, then lose the network.
  const firstLaunch = await renderPersistedApp(<ChatScreen />);
  await screen.findByTestId('message-list');
  const lastServerMessage = chatsDb.find(CHAT)?.messages.at(-1);
  if (!lastServerMessage) throw new Error('seed has messages');
  await screen.findByTestId(`message-${lastServerMessage.id}`);
  await goOffline();

  // 2. Send three messages: each shows up immediately with a clear waiting status.
  for (const text of OUTGOING) await typeAndSend(text);
  const pending = useOutboxStore.getState().entries;
  expect(pending.map((entry) => entry.text)).toEqual(OUTGOING);
  for (const entry of pending) expect(statusOf(entry.clientId)).toMatch(/Waiting for network/);
  expect(screen.getByTestId('offline-banner')).toHaveTextContent(/3 messages will be sent/);
  expect(serverTexts(CHAT)).not.toContain(OUTGOING[0]);

  // 3. Force-stop and reopen (still offline): everything comes back from disk.
  await firstLaunch.unmount();
  simulateAppRestart();
  await renderPersistedApp(<ChatScreen />);
  await waitForRestore('message-list');
  // The server part of the thread came back from the on-disk cache, not only the outbox.
  expect(await screen.findByTestId(`message-${lastServerMessage.id}`)).toBeTruthy();
  const restored = useOutboxStore.getState().entries;
  expect(restored.map((entry) => [entry.clientId, entry.status])).toEqual(
    pending.map((entry) => [entry.clientId, 'queued']),
  );
  for (const entry of restored) expect(statusOf(entry.clientId)).toMatch(/Waiting for network/);
  // Pending messages keep their local order at the end of the thread.
  expect(renderedBubbleIds().slice(-3)).toEqual(pending.map((entry) => entry.clientId));

  // 4. Four messages reach the server while this client is offline.
  const incoming = chatsDb.injectIncoming(CHAT, 4);

  // 5. Reconnect: recover the incoming messages and deliver the queue.
  await goOnline();
  await waitFor(() => expect(useOutboxStore.getState().entries).toEqual([]), { timeout: 5000 });
  await waitFor(() =>
    expect(screen.getByText(incoming[3]?.type === 'text' ? incoming[3].text : '')).toBeTruthy(),
  );

  // Server: each message exactly once, in the order the server accepted them.
  const serverTail = chatsDb.find(CHAT)?.messages.slice(-7) ?? [];
  expect(serverTail.map((m) => (m.type === 'text' ? m.text : ''))).toEqual([
    ...incoming.map((m) => (m.type === 'text' ? m.text : '')),
    ...OUTGOING,
  ]);
  for (const text of OUTGOING) expect(serverTexts(CHAT).filter((t) => t === text)).toHaveLength(1);
  expect(serverTail.slice(-3).map((m) => m.clientId)).toEqual(
    pending.map((entry) => entry.clientId),
  );

  // Client: the thread matches the server order, one bubble per message, all confirmed.
  await waitFor(() => expect(renderedBubbleIds().slice(-7)).toEqual(serverTail.map((m) => m.id)));
  for (const text of OUTGOING) expect(screen.getAllByText(text)).toHaveLength(1);
  for (const message of serverTail.slice(-3))
    expect(statusOf(message.clientId ?? message.id)).toMatch(/Sent$/);
  expect(screen.queryByTestId('offline-banner')).toBeNull();
});
