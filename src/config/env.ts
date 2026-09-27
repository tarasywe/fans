import { z } from 'zod';

const EnvSchema = z.object({
  /** Backend origin without `/v1`, e.g. https://fans-backend.up.railway.app. Unset → in-app mocks. */
  EXPO_PUBLIC_API_URL: z.url().optional(),
  /** "1" forces the in-app mock API even when EXPO_PUBLIC_API_URL is set (e.g. in .env.local). */
  EXPO_PUBLIC_USE_MOCK_API: z.enum(['0', '1']).optional(),
  /**
   * Mock API only: fault preset applied at launch, to reproduce delivery cases on demand.
   * offline | lost-response | server-error | clean (wipes mock server + outbox + cache)
   */
  EXPO_PUBLIC_MOCK_SCENARIO: z
    .enum(['offline', 'lost-response', 'server-error', 'clean'])
    .optional(),
});

// Expo inlines EXPO_PUBLIC_* only when accessed literally as process.env.EXPO_PUBLIC_…
export const env = EnvSchema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || undefined,
  EXPO_PUBLIC_USE_MOCK_API: process.env.EXPO_PUBLIC_USE_MOCK_API || undefined,
  EXPO_PUBLIC_MOCK_SCENARIO: process.env.EXPO_PUBLIC_MOCK_SCENARIO || undefined,
});
