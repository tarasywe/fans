import { z } from 'zod';

const EnvSchema = z.object({
  /** Backend origin without `/v1`, e.g. https://fans-backend.up.railway.app. Unset → in-app mocks. */
  EXPO_PUBLIC_API_URL: z.url().optional(),
});

// Expo inlines EXPO_PUBLIC_* only when accessed literally as process.env.EXPO_PUBLIC_…
export const env = EnvSchema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || undefined,
});
