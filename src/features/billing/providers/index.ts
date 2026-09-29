import { Platform } from 'react-native';

import { env } from '@/config/env';

import type { BillingProvider } from './billing-provider';
import { createRevenueCatStore } from './revenuecat-store';
import { simulatedStore } from './simulated-store';

// TEMPORARY: RevenueCat initialisation is disabled; the app uses the simulated store even when
// EXPO_PUBLIC_REVENUECAT_API_KEY is set. Set back to true to re-enable RevenueCat.
const REVENUECAT_ENABLED = false;

/**
 * RevenueCat (Test Store) on iOS/Android when an SDK key is configured; otherwise — and always
 * under Jest — the built-in simulated store. Both are simulated billing; neither grants access.
 */
function selectProvider(): BillingProvider {
  if (!REVENUECAT_ENABLED) return simulatedStore;
  const key = env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  const native = Platform.OS === 'ios' || Platform.OS === 'android';
  if (key && native && process.env.NODE_ENV !== 'test') return createRevenueCatStore(key);
  return simulatedStore;
}

export const billingProvider: BillingProvider = selectProvider();
