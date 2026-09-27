import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { Query } from '@tanstack/react-query';

import { createKvStorage } from '@/lib/storage/kv-storage';

export const QUERY_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const storage = createKvStorage('fans-query-cache');

/**
 * Persists the React Query cache to MMKV so that, after a force-quit while offline, chats and
 * threads reopen from disk instead of an empty screen. Server data only — pending sends live in
 * the separate outbox storage.
 */
export function createQueryPersister(throttleTime = 1000) {
  return createSyncStoragePersister({
    storage: {
      getItem: (key) => storage.getString(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => {
        storage.remove(key);
      },
    },
    key: 'query-cache-v1',
    throttleTime,
  });
}

const PERSISTED_ROOTS = new Set(['chats', 'users', 'fan-lists']);

export function shouldPersistQuery(query: Query): boolean {
  const [root] = query.queryKey;
  return query.state.status === 'success' && typeof root === 'string' && PERSISTED_ROOTS.has(root);
}

export function clearPersistedQueries(): void {
  storage.clearAll();
}
