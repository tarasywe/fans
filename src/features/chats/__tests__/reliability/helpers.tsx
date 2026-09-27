import { installTestMocks, resetNetwork } from '@test/test-utils';
import { fireEvent, screen } from '@testing-library/react-native';
import { useMockFaults } from '@/lib/mock';
import { clearPersistedQueries } from '@/lib/query-persister';

import { chatsDb } from '../../mocks/chats-store';
import { useOutboxStore } from '../../outbox/outbox-store';

/** Fresh install: empty outbox, seeded mock server, no cached queries, no faults. */
export function freshInstall(): void {
  installTestMocks();
  resetNetwork();
  useMockFaults.getState().reset();
  chatsDb.reset();
  useOutboxStore.getState().clear();
  clearPersistedQueries();
}

export async function typeAndSend(text: string): Promise<void> {
  await fireEvent.changeText(screen.getByTestId('message-input'), text);
  await fireEvent.press(screen.getByTestId('send-button'));
}

const NON_BUBBLE = /^message-(status|avatar|list|input|composer|counter)/;

/** Test IDs of the rendered bubbles, top to bottom (`message-<id or client id>`). */
export function renderedBubbleIds(): string[] {
  return screen
    .getAllByTestId(/^message-/)
    .map((node) => String(node.props.testID))
    .filter((id) => !NON_BUBBLE.test(id))
    .map((id) => id.replace(/^message-/, ''));
}

export function statusOf(clientIdOrId: string): string {
  const node = screen.getByTestId(`message-status-${clientIdOrId}`);
  const children = node.props.children as unknown;
  return Array.isArray(children) ? children.join('') : String(children);
}

export function serverTexts(chatId: string): string[] {
  return chatsDb.find(chatId)?.messages.flatMap((m) => (m.type === 'text' ? [m.text] : [])) ?? [];
}
