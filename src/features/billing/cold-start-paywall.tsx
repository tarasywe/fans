import { router, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';

import { links } from '@/config/links';

import { usePremiumState } from './use-premium-state';

/** Once per JS runtime = once per cold start (warm resumes keep this module in memory). */
const launch = { handled: false };

export function resetColdStartPaywall() {
  launch.handled = false;
}

/**
 * Shows the paywall on every cold start for users without confirmed access. Not shown while a
 * purchase is being confirmed, or while the status is unknown (offline).
 */
export function ColdStartPaywall() {
  const state = usePremiumState();
  const navigationReady = Boolean(useRootNavigationState()?.key);

  useEffect(() => {
    if (launch.handled || !navigationReady || state.kind === 'loading') return;
    launch.handled = true;
    if (state.kind === 'none' || state.kind === 'expired' || state.kind === 'refunded') {
      router.push(links.paywall);
    }
  }, [state.kind, navigationReady]);

  return null;
}
