import type { MessagesData } from '../api/queries';
import type { Message } from '../types/message';

const EMPTY: MessagesData = { pages: [{ items: [], nextCursor: null }], pageParams: [null] };

const isSameMessage = (a: Message, b: Message) =>
  a.id === b.id || (a.clientId != null && a.clientId === b.clientId);

/**
 * Adds a confirmed message to the newest page (page 0). A message already present (same id, or
 * same client ID) is ignored, so repeated responses never add copies.
 */
export function appendMessage(data: MessagesData | undefined, message: Message): MessagesData {
  const source = data ?? EMPTY;
  if (source.pages.some((page) => page.items.some((item) => isSameMessage(item, message)))) {
    return source;
  }
  const [newest, ...older] = source.pages;
  const first = newest ?? { items: [], nextCursor: null };
  return { ...source, pages: [{ ...first, items: [...first.items, message] }, ...older] };
}

/**
 * Flattens newest-first pages into one chronological (oldest → newest) list, in server order.
 * Duplicates (a message present in two pages after a refetch) are kept once.
 */
export function flattenMessages(data: Pick<MessagesData, 'pages'> | undefined): Message[] {
  if (!data) return [];
  const seen = new Set<string>();
  const result: Message[] = [];
  for (const message of [...data.pages].reverse().flatMap((page) => page.items)) {
    const key = message.clientId ?? message.id;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(message);
  }
  return result;
}
