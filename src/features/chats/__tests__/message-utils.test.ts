import { appendWithLimit, formatAmount, messagePreview } from '../utils/message-format';
import { buildMessageRows } from '../utils/message-rows';
import { appendMessage, flattenMessages } from '../utils/messages-cache';
import { isGroupSelected, submitLabel, toggleGroup, toggleId } from '../utils/selection';
import { textMessage } from './fixtures';

describe('appendWithLimit', () => {
  it('appends while under the limit', () => {
    expect(appendWithLimit('hi', '🔥', 400)).toBe('hi🔥');
  });

  it('allows reaching the limit exactly', () => {
    expect(appendWithLimit('a'.repeat(398), '🔥', 400)).toHaveLength(400);
  });

  it('refuses inserts that would exceed the limit (emoji are 2 UTF-16 units)', () => {
    const text = 'a'.repeat(399);
    expect(appendWithLimit(text, '🔥', 400)).toBe(text);
  });
});

describe('messagePreview / formatAmount', () => {
  it('prefixes own messages and formats gifts', () => {
    expect(messagePreview(textMessage('1', { text: 'Hello' }))).toBe('You: Hello');
    expect(messagePreview(textMessage('1', { text: 'Hello', senderId: 'u_1' }))).toBe('Hello');
    expect(
      messagePreview({
        ...textMessage('1', { senderId: 'u_1' }),
        type: 'gift',
        amountCents: 5000,
      } as never),
    ).toBe('Sent you a $50.00 gift');
    expect(messagePreview(null)).toBe('No messages yet');
    expect(formatAmount(1)).toBe('$0.01');
  });
});

describe('buildMessageRows', () => {
  const now = new Date('2026-09-25T18:00:00.000Z');

  it('inserts a day separator per calendar day and groups consecutive senders', () => {
    const rows = buildMessageRows(
      [
        textMessage('1', { createdAt: '2026-09-24T10:00:00.000Z', senderId: 'u_1' }),
        textMessage('2', { createdAt: '2026-09-25T10:00:00.000Z', senderId: 'u_1' }),
        textMessage('3', { createdAt: '2026-09-25T10:01:00.000Z', senderId: 'u_1' }),
        textMessage('4', { createdAt: '2026-09-25T10:02:00.000Z' }),
      ],
      now,
    );
    expect(rows.map((row) => row.kind)).toEqual([
      'day',
      'message',
      'day',
      'message',
      'message',
      'message',
    ]);
    const messages = rows.filter((row) => row.kind === 'message');
    expect(messages.map((row) => row.isLastInGroup)).toEqual([true, false, true, true]);
    expect(messages.map((row) => row.isFirstInGroup)).toEqual([true, true, false, true]);
  });

  it('handles an empty conversation', () => {
    expect(buildMessageRows([], now)).toEqual([]);
  });
});

describe('messages cache', () => {
  const data = {
    pages: [
      { items: [textMessage('3'), textMessage('4')], nextCursor: '3' },
      { items: [textMessage('1'), textMessage('2')], nextCursor: null },
    ],
    pageParams: [null, '3'],
  };

  it('flattens newest-first pages chronologically', () => {
    expect(flattenMessages(data).map((message) => message.id)).toEqual(['1', '2', '3', '4']);
    expect(flattenMessages(undefined)).toEqual([]);
  });

  it('appends to the newest page and ignores duplicates', () => {
    const appended = appendMessage(data, textMessage('5'));
    expect(flattenMessages(appended).map((message) => message.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
    expect(appendMessage(appended, textMessage('5'))).toBe(appended);
    expect(appendMessage(appended, textMessage('2'))).toBe(appended);
  });

  it('creates the first page when the cache is empty', () => {
    expect(flattenMessages(appendMessage(undefined, textMessage('1')))).toHaveLength(1);
  });
});

describe('selection helpers', () => {
  it('toggles single ids', () => {
    const selected = toggleId(new Set(), 'a');
    expect([...selected]).toEqual(['a']);
    expect([...toggleId(selected, 'a')]).toEqual([]);
  });

  it('selects a whole list, and clears it only when all members are selected', () => {
    const members = ['a', 'b'];
    const partial = new Set(['a']);
    expect(isGroupSelected(partial, members)).toBe(false);
    const all = toggleGroup(partial, members);
    expect(isGroupSelected(all, members)).toBe(true);
    expect([...toggleGroup(all, members)]).toEqual([]);
    expect(isGroupSelected(new Set(), [])).toBe(false);
  });

  it('labels the submit button', () => {
    expect(submitLabel(0)).toBe('Start Chat');
    expect(submitLabel(1)).toBe('Start Chat');
    expect(submitLabel(4)).toBe('Message to (4) Users');
  });
});
