import {
  chatTitle,
  filterChats,
  normalizeQuery,
  sortChats,
  toggleSortOrder,
} from '../utils/chat-list';
import { chat, user } from './fixtures';

const ethan = user('u_1', 'Ethan Shoots', 'ethan_shoots');
const olivia = user('u_2', 'Olivia Rivera', 'olivia_rivera');
const liam = user('u_3', 'Liam Carter', 'liam_carter');

const chats = [
  chat('a', [ethan], '2026-09-25T10:00:00.000Z'),
  chat('b', [olivia], '2026-09-25T12:00:00.000Z'),
  chat('c', [liam, olivia], '2026-09-24T09:00:00.000Z'),
];

describe('filterChats', () => {
  it('returns every chat for an empty or blank query', () => {
    expect(filterChats(chats, '')).toHaveLength(3);
    expect(filterChats(chats, '   ')).toHaveLength(3);
    expect(filterChats(chats, '@')).toHaveLength(3);
  });

  it('matches usernames case-insensitively, with or without @', () => {
    expect(filterChats(chats, 'ETHAN').map((item) => item.id)).toEqual(['a']);
    expect(filterChats(chats, '@olivia_').map((item) => item.id)).toEqual(['b', 'c']);
    expect(filterChats(chats, '  liam_carter ').map((item) => item.id)).toEqual(['c']);
  });

  it('matches display names too', () => {
    expect(filterChats(chats, 'rivera').map((item) => item.id)).toEqual(['b', 'c']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterChats(chats, 'nobody')).toEqual([]);
    expect(filterChats([], 'ethan')).toEqual([]);
  });

  it('does not mutate the input', () => {
    const copy = [...chats];
    filterChats(chats, 'ethan');
    expect(chats).toEqual(copy);
  });
});

describe('sortChats', () => {
  it('sorts newest first by default order and oldest first when toggled', () => {
    expect(sortChats(chats, 'newest').map((item) => item.id)).toEqual(['b', 'a', 'c']);
    expect(sortChats(chats, 'oldest').map((item) => item.id)).toEqual(['c', 'a', 'b']);
  });

  it('toggles between orders', () => {
    expect(toggleSortOrder('newest')).toBe('oldest');
    expect(toggleSortOrder('oldest')).toBe('newest');
  });
});

describe('chatTitle / normalizeQuery', () => {
  it('builds titles for one-to-one and group chats', () => {
    expect(chatTitle(chats[0] as never)).toBe('Ethan Shoots');
    expect(chatTitle(chats[2] as never)).toBe('Liam Carter, Olivia Rivera');
    expect(chatTitle(chat('d', [ethan, olivia, liam], '2026-01-01T00:00:00.000Z'))).toBe(
      'Ethan Shoots +2',
    );
  });

  it('normalizes queries', () => {
    expect(normalizeQuery('  @EthAn ')).toBe('ethan');
  });
});
