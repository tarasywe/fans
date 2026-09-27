import { simulateAppRestart } from '@test/app-restart';
import { CURRENT_USER_ID } from '@/config/session';
import { readJson } from '@/lib/storage/kv-storage';

import {
  OUTBOX_STORAGE_KEY,
  type OutboxEntry,
  outboxStorage,
  outboxToMessage,
  useOutboxStore,
} from '../outbox/outbox-store';

const store = () => useOutboxStore.getState();
const onDisk = () =>
  readJson<{ entries: OutboxEntry[] }>(outboxStorage, OUTBOX_STORAGE_KEY)?.entries ?? [];

beforeEach(() => store().clear());

describe('outbox store', () => {
  it('writes a message to disk before it is visible as queued', () => {
    const seenOnDiskWhenQueued: boolean[] = [];
    const unsubscribe = useOutboxStore.subscribe((state) => {
      for (const entry of state.entries) {
        if (entry.status === 'queued') {
          seenOnDiskWhenQueued.push(onDisk().some((saved) => saved.clientId === entry.clientId));
        }
      }
    });
    const entry = store().enqueue('c_1', 'hi');
    unsubscribe();

    expect(seenOnDiskWhenQueued).toEqual([true]);
    expect(onDisk()).toEqual([
      expect.objectContaining({ clientId: entry.clientId, status: 'queued', text: 'hi' }),
    ]);
  });

  it('gives each send a unique, URL-safe client ID and a local order', () => {
    const a = store().enqueue('c_1', 'one');
    const b = store().enqueue('c_1', 'two');
    expect(a.clientId).not.toBe(b.clientId);
    expect(a.clientId).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(b.seq).toBe(a.seq + 1);
  });

  it('keeps the client ID across retries', () => {
    const { clientId } = store().enqueue('c_1', 'hi');
    store().markSending(clientId);
    store().markFailed(clientId, { kind: 'server', recoverable: true, message: 'x' });
    store().retry(clientId);
    store().markSending(clientId);
    expect(store().entries).toEqual([
      expect.objectContaining({ clientId, status: 'sending', attempts: 2, error: null }),
    ]);
  });

  it('restores entries after an app restart and re-queues the one that was in flight', () => {
    const waiting = store().enqueue('c_1', 'waiting');
    const inFlight = store().enqueue('c_1', 'in flight');
    const failed = store().enqueue('c_1', 'failed');
    store().markSending(inFlight.clientId);
    store().markFailed(failed.clientId, { kind: 'server', recoverable: true, message: 'x' });

    simulateAppRestart();

    expect(store().entries.map((entry) => [entry.clientId, entry.status])).toEqual([
      [waiting.clientId, 'queued'],
      [inFlight.clientId, 'queued'],
      [failed.clientId, 'failed'],
    ]);
    expect(store().entries[2]?.text).toBe('failed');
  });

  it('continues the local order after a restart', () => {
    store().enqueue('c_1', 'one');
    simulateAppRestart();
    expect(store().enqueue('c_1', 'two').seq).toBe(2);
  });

  it('renders entries as own text messages keyed by client ID', () => {
    const entry = store().enqueue('c_1', 'hi');
    expect(outboxToMessage(entry)).toMatchObject({
      id: entry.clientId,
      clientId: entry.clientId,
      senderId: CURRENT_USER_ID,
      status: 'queued',
      text: 'hi',
    });
  });
});
