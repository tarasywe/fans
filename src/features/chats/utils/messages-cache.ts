import type { MessagesData } from '../api/queries';
import type { Message } from '../types/message';

const EMPTY: MessagesData = { pages: [{ items: [], nextCursor: null }], pageParams: [null] };

/** Adds a message to the newest page (page 0). */
export function appendMessage(data: MessagesData | undefined, message: Message): MessagesData {
  const source = data ?? EMPTY;
  const [newest, ...older] = source.pages;
  const first = newest ?? { items: [], nextCursor: null };
  return { ...source, pages: [{ ...first, items: [...first.items, message] }, ...older] };
}

export function replaceMessage(
  data: MessagesData | undefined,
  id: string,
  message: Message,
): MessagesData | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.id === id ? message : item)),
    })),
  };
}

/** Flattens newest-first pages into one chronological (oldest → newest) list. */
export function flattenMessages(data: Pick<MessagesData, 'pages'> | undefined): Message[] {
  if (!data) return [];
  return [...data.pages].reverse().flatMap((page) => page.items);
}
