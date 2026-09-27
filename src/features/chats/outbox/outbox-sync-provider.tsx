import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { startConnectivity } from '@/lib/network/connectivity';

import { outboxSync } from './outbox-sync';

/** Mount once near the root: runs connectivity tracking and the outbox sender for the app. */
export function OutboxSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const stopConnectivity = startConnectivity();
    outboxSync.start(queryClient);
    return () => {
      outboxSync.stop();
      stopConnectivity();
    };
  }, [queryClient]);

  return null;
}
