import { QueryClient } from '@tanstack/react-query';

import { QUERY_CACHE_MAX_AGE_MS } from './query-persister';

const STALE_TIME_MS = 30_000;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        // Must outlive the persisted cache, otherwise restored queries are dropped immediately.
        gcTime: QUERY_CACHE_MAX_AGE_MS,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
