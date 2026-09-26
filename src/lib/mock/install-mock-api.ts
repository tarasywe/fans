import type { AxiosInstance } from 'axios';

import { createMockAdapter, type MockDelay } from './mock-adapter';
import type { MockRoute } from './mock-types';

/** Routes every request of `client` to the given mock routes (no network). */
export function installMockApi(
  client: AxiosInstance,
  routes: readonly MockRoute[],
  delay?: MockDelay,
): void {
  client.defaults.adapter = createMockAdapter(routes, delay);
}
