import { CURRENT_USER_ID } from '@/config/session';

import type { MessagesData } from '../../api/queries';
import type { OutboxEntry } from '../../outbox/outbox-store';
import type { Message } from '../../types/message';
import { appendMessage, flattenMessages } from '../../utils/messages-cache';
import { buildThread, messageKey } from '../../utils/thread';

const server = (id: string, clientId?: string): Message => ({
  id,
  clientId: clientId ?? null,
  chatId: 'c_1',
  senderId: CURRENT_USER_ID,
  createdAt: '2026-09-26T10:00:00.000Z',
  status: 'sent',
  type: 'text',
  text: id,
});

const pending = (
  clientId: string,
  seq: number,
  status: OutboxEntry['status'] = 'queued',
): OutboxEntry => ({
  clientId,
  chatId: 'c_1',
  text: clientId,
  createdAt: '2026-09-26T10:01:00.000Z',
  seq,
  status,
  attempts: 0,
  error: null,
});

const page = (items: Message[], nextCursor: string | null = null) => ({ items, nextCursor });

describe('repeated responses', () => {
  it('ignores the same confirmed message delivered twice (by id or by client ID)', () => {
    const base: MessagesData = { pages: [page([server('m1')])], pageParams: [null] };
    const once = appendMessage(base, server('m2', 'cid-000002'));
    expect(appendMessage(once, server('m2', 'cid-000002'))).toBe(once);
    expect(appendMessage(once, { ...server('m2-other-id', 'cid-000002') })).toBe(once);
    expect(flattenMessages(once).map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  it('shows a message once when it is both confirmed on the server and still in the outbox', () => {
    const thread = buildThread(
      [server('m1'), server('m2', 'cid-000002')],
      [pending('cid-000002', 1)],
    );
    expect(thread.messages.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(thread.confirmedClientIds).toEqual(['cid-000002']);
  });

  it('does not drop an entry that is still in flight even if a copy is on the server', () => {
    const thread = buildThread([server('m2', 'cid-000002')], [pending('cid-000002', 1, 'sending')]);
    expect(thread.messages).toHaveLength(1);
    expect(thread.confirmedClientIds).toEqual([]);
  });

  it('keeps a message in place with the same key from pending to confirmed (no jumping)', () => {
    const before = buildThread(
      [server('m1')],
      [pending('cid-000002', 1), pending('cid-000003', 2)],
    );
    const afterFirst = buildThread(
      [server('m1'), server('m2', 'cid-000002')],
      [pending('cid-000003', 2)],
    );
    const afterBoth = buildThread(
      [server('m1'), server('m2', 'cid-000002'), server('m3', 'cid-000003')],
      [],
    );
    const keys = (messages: Message[]) => messages.map(messageKey);
    expect(keys(before.messages)).toEqual(['m1', 'cid-000002', 'cid-000003']);
    expect(keys(afterFirst.messages)).toEqual(keys(before.messages));
    expect(keys(afterBoth.messages)).toEqual(keys(before.messages));
  });

  it('keeps pending messages in local order behind server messages', () => {
    const thread = buildThread(
      [server('m1')],
      [pending('cid-00000b', 2), pending('cid-00000a', 1)],
    );
    expect(thread.messages.map(messageKey)).toEqual(['m1', 'cid-00000a', 'cid-00000b']);
  });

  it('de-duplicates a message that appears in two pages after a refetch', () => {
    const data = {
      pages: [page([server('m3'), server('m4')]), page([server('m2'), server('m3')])],
    };
    expect(flattenMessages(data).map((m) => m.id)).toEqual(['m2', 'm3', 'm4']);
  });
});
