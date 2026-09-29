import { z } from 'zod';

const EnvSchema = z.object({
  /** Backend origin without `/v1`, e.g. https://fans-backend.up.railway.app. Unset → in-app mocks. */
  EXPO_PUBLIC_API_URL: z.url().optional(),
  /** "1" forces the in-app mock API even when EXPO_PUBLIC_API_URL is set (e.g. in .env.local). */
  EXPO_PUBLIC_USE_MOCK_API: z.enum(['0', '1']).optional(),
  /** RevenueCat public SDK key. `test_…` = RevenueCat Test Store. Unset → built-in simulated store. */
  EXPO_PUBLIC_REVENUECAT_API_KEY: z.string().min(1).optional(),
  /**
   * Mock API only: preset applied once per `start:mock:*` run, to reproduce cases on demand.
   * clean wipes mock server + outbox + cache (not again on restarts of the same run).
   */
  EXPO_PUBLIC_MOCK_SCENARIO: z
    .enum([
      'offline',
      'lost-response',
      'server-error',
      'clean',
      'billing-slow-confirm',
      'billing-no-confirm',
      'billing-store-fails',
    ])
    .optional(),
  /** Set by the `start:mock:*` scripts (a timestamp): the preset is applied once per script run. */
  EXPO_PUBLIC_MOCK_RUN_ID: z.string().min(1).optional(),
});

// Expo inlines EXPO_PUBLIC_* only when accessed literally as process.env.EXPO_PUBLIC_…
export const env = EnvSchema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || undefined,
  EXPO_PUBLIC_USE_MOCK_API: process.env.EXPO_PUBLIC_USE_MOCK_API || undefined,
  EXPO_PUBLIC_MOCK_SCENARIO: process.env.EXPO_PUBLIC_MOCK_SCENARIO || undefined,
  EXPO_PUBLIC_MOCK_RUN_ID: process.env.EXPO_PUBLIC_MOCK_RUN_ID || undefined,
  EXPO_PUBLIC_REVENUECAT_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim() || undefined,
});
