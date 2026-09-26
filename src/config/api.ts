import { env } from './env';

const MOCK_ORIGIN = 'https://api.fansuite.mock';

/** True when no backend is configured: every request is answered by the in-app mocks. */
export const USE_MOCK_API = env.EXPO_PUBLIC_API_URL === undefined;

/** Every backend route lives under /v1. */
export const API_BASE_URL = `${(env.EXPO_PUBLIC_API_URL ?? MOCK_ORIGIN).replace(/\/+$/, '')}/v1`;
