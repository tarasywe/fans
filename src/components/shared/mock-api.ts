import { billingMockRoutes } from '@features/billing';
import { chatsMockRoutes } from '@features/chats';
import { applyLaunchScenario } from '@features/dev-tools';
import { usersMockRoutes } from '@features/users';
import { USE_MOCK_API } from '@/config/api';
import { env } from '@/config/env';
import { http } from '@/lib/http/http-client';
import { installMockApi } from '@/lib/mock';

/**
 * Without EXPO_PUBLIC_API_URL every request is answered by the feature mocks (visible delay).
 * With it, requests go to the real backend.
 */
export function installAppMocks(): void {
  if (!USE_MOCK_API) return;
  installMockApi(http, [...usersMockRoutes, ...chatsMockRoutes, ...billingMockRoutes]);
  // Once per `start:mock:*` run, not per launch: restarts and Fast Refresh keep the state.
  if (env.EXPO_PUBLIC_MOCK_SCENARIO) {
    applyLaunchScenario(env.EXPO_PUBLIC_MOCK_SCENARIO, env.EXPO_PUBLIC_MOCK_RUN_ID);
  }
}
