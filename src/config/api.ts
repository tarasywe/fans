import { env } from './env';

const MOCK_ORIGIN = 'https://api.fansuite.mock';

/**
 * True when every request is answered by the in-app mocks: no backend configured, or forced with
 * EXPO_PUBLIC_USE_MOCK_API=1 (the `npm run start:mock*` scripts).
 */
export const USE_MOCK_API =
  env.EXPO_PUBLIC_USE_MOCK_API === '1' || env.EXPO_PUBLIC_API_URL === undefined;

/** Every backend route lives under /v1. */
export const API_BASE_URL = `${(USE_MOCK_API ? MOCK_ORIGIN : (env.EXPO_PUBLIC_API_URL ?? MOCK_ORIGIN)).replace(/\/+$/, '')}/v1`;
