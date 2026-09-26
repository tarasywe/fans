import { CURRENT_USER_ID } from '@/config/session';

import { outboxToMessage, useOutboxStore } from '../store';

const store = () => useOutboxStore.getState();

beforeEach(() => store().clear());

describe('outbox store', () => {
  it('enqueues messages as sending with unique local ids', () => {
    const a = store().enqueue('c_1', 'hi');
    const b = store().enqueue('c_1', 'there');
    expect(a.status).toBe('sending');
    expect(a.localId).not.toBe(b.localId);
    expect(store().entries).toHaveLength(2);
  });

  it('moves between sending and failed, and removes entries', () => {
    const { localId } = store().enqueue('c_1', 'hi');
    store().markFailed(localId);
    expect(store().entries[0]?.status).toBe('failed');
    store().markSending(localId);
    expect(store().entries[0]?.status).toBe('sending');
    store().remove(localId);
    expect(store().entries).toEqual([]);
  });

  it('ignores unknown ids', () => {
    store().enqueue('c_1', 'hi');
    store().markFailed('nope');
    store().remove('nope');
    expect(store().entries[0]?.status).toBe('sending');
  });

  it('renders entries as own text messages', () => {
    const entry = store().enqueue('c_1', 'hi');
    expect(outboxToMessage(entry)).toMatchObject({
      id: entry.localId,
      chatId: 'c_1',
      senderId: CURRENT_USER_ID,
      type: 'text',
      text: 'hi',
      status: 'sending',
    });
  });
});
