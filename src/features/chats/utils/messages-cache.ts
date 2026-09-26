import type { MessagesData } from '../api/queries';
import type { Message } from '../types/message';

const EMPTY: MessagesData = { pages: [{ items: [], nextCursor: null }], pageParams: [null] };

/** Adds a message to the newest page (page 0), ignoring duplicates. */
export function appendMessage(data: MessagesData | undefined, message: Message): MessagesData {
  const source = data ?? EMPTY;
  if (source.pages.some((page) => page.items.some((item) => item.id === message.id))) return source;
  const [newest, ...older] = source.pages;
  const first = newest ?? { items: [], nextCursor: null };
  return { ...source, pages: [{ ...first, items: [...first.items, message] }, ...older] };
}

/** Flattens newest-first pages into one chronological (oldest → newest) list. */
export function flattenMessages(data: Pick<MessagesData, 'pages'> | undefined): Message[] {
  if (!data) return [];
  return [...data.pages].reverse().flatMap((page) => page.items);
}
