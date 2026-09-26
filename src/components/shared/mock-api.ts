import { chatsMockRoutes } from '@features/chats';
import { usersMockRoutes } from '@features/users';
import { http } from '@/lib/http/http-client';
import { installMockApi } from '@/lib/mock';

/** No backend yet: every request is answered by the feature mocks, with a visible delay. */
export function installAppMocks(): void {
  installMockApi(http, [...usersMockRoutes, ...chatsMockRoutes]);
}
