import { createKvStorage } from '@/lib/storage/kv-storage';

import { applyMockScenario, type MockScenario } from './scenarios';

const storage = createKvStorage('fans-dev-tools');
const APPLIED_KEY = 'launch-scenario-applied';

/**
 * Applies the EXPO_PUBLIC_MOCK_SCENARIO preset once per `npm run start:mock:*` run, not on every
 * launch. The preset is inlined into the bundle, so re-applying it at each cold start would e.g.
 * make "clean" wipe the outbox when the app is force-quit, which is the very thing restart tests
 * check. `runId` (EXPO_PUBLIC_MOCK_RUN_ID, a timestamp set by the script) makes each script run a
 * new preset application; the applied run is remembered on the device.
 */
export function applyLaunchScenario(scenario: MockScenario, runId: string | undefined): boolean {
  const key = `${scenario}:${runId ?? 'no-run-id'}`;
  if (storage.getString(APPLIED_KEY) === key) return false;
  storage.set(APPLIED_KEY, key);
  applyMockScenario(scenario);
  return true;
}
