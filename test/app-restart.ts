import { mockChatServer, useOutboxStore } from '@features/chats';

/**
 * Simulates a force-stop + relaunch without touching disk:
 * - the outbox drops its in-memory state (a plain setState does not write) and reloads from MMKV;
 * - the mock server rebuilds from its own MMKV storage.
 * The caller unmounts the old tree and renders a fresh one, whose query cache restores from MMKV.
 */
export function simulateAppRestart(): void {
  useOutboxStore.setState({ entries: [], nextSeq: 1 });
  useOutboxStore.getState().rehydrate();
  mockChatServer.reload();
}
