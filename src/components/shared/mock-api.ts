import { chatsMockRoutes } from '@features/chats';
import { usersMockRoutes } from '@features/users';
import { USE_MOCK_API } from '@/config/api';
import { http } from '@/lib/http/http-client';
import { installMockApi } from '@/lib/mock';

/**
 * Without EXPO_PUBLIC_API_URL every request is answered by the feature mocks (visible delay).
 * With it, requests go to the real backend.
 */
export function installAppMocks(): void {
  if (!USE_MOCK_API) return;
  installMockApi(http, [...usersMockRoutes, ...chatsMockRoutes]);
}
