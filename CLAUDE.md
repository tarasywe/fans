# Project Instructions for AI Agents

## Stack

Expo SDK 57 · React 19.2 + React Compiler · Expo Router v6 · gluestack-ui v5
(UniWind/Tailwind v4) · Zustand · React Query v5 · Axios · zod · MMKV (v4,
createMMKV factory, + react-native-nitro-modules) · Biome · strict TS · Npm
package manager · @types/node (devDep, app.config.ts reads process.env / fs) ·
react-native-keyboard-controller (wrapped in KeyboardProvider in the root
layout; requires react-native-reanimated)

UI & interaction: react-native-gesture-handler · react-native-reanimated ·
· react-native-svg · react-dom and
react-native-web (required on native by gluestack v5's react-aria dependency)
· @legendapp/list (chat / long lists) · expo-image · expo-secure-store
· @react-native-community/netinfo (connectivity) · @tanstack/react-query-persist-client +
@tanstack/query-sync-storage-persister (query cache persisted to MMKV)

Billing: react-native-purchases + react-native-purchases-ui 10.10.2 (RevenueCat, exact pins;
mocked in jest.setup.ts)

gluestack v5 runtime deps (installed by `gluestack-ui init`): @gluestack-ui/core ·
@gluestack-ui/utils · @expo/html-elements · @legendapp/motion · react-aria ·
react-stately · tailwind-variants · uniwind · tailwindcss (devDep)

Testing: jest 29 + jest-expo · @testing-library/react-native 14 (+ test-renderer
1.2.x — 1.3+ needs React 19.3) · @react-native/jest-preset · expo-router/testing-library
for routing tests (`renderRouter` returns the pending async render — `await` it,
then read `getPathname()` from the original object).

## Non-negotiable rules

1. Route files in src/app/ are ≤15 lines: import screen from a feature, export it.
2. Features import other features ONLY via their index.ts. Architecture check is
   planned (gen:arch / arch:check scripts not yet scaffolded).
3. Server data → React Query. Client state → Zustand. Screen-local → useState. Never mix.
4. Every API response is parsed with zod in features/\*/types before use. No `any`.
5. Do NOT write useMemo/useCallback/React.memo — React Compiler handles it.
6. Do NOT hand-edit src/components/ui/\*\* — regenerate via `npx gluestack-ui@latest add <component>`.
7. Styling: UniWind className only. No StyleSheet.create, no inline style objects.
8. No new dependencies without updating this file's Stack section.
9. Layout differences use Tailwind breakpoints (md:, lg:).
10. Navigation paths come from src/config/links.ts, never hardcoded strings.

## Code culture (every session)

1. **Single responsibility per file.** endpoints.ts = URLs. queries.ts = reads. mutations.ts = writes. store.ts = client-only state. types/*.ts = zod + inferred types. If a second concern appears, split the file.
2**Aliases only for cross-cuts.** `@/lib`, `@/components/shared`, `@/utils`, `@/config`, `@/stores`, `@/theme`, `@features/<x>`, `@ui/*`, `@/assets`. Relative imports are intra-feature only. No deep `../../..`.
3**React Compiler owns memoization.** Never write useMemo / useCallback / React.memo.
4**Explicit public APIs.** A feature's index.ts is a deliberate allowlist, never `export *`.
5**Every feature ships with mocks + tests + edge cases.** No feature is "done" without the negative-testing contract (template §11) covered.
6**Clean / testable / extensible by construction.** Small files, one job each, named exports, no `any`, no `console` (warn/error only), no hardcoded route strings (use links.ts).

## Figma workflow

When given a Figma link: fetch the node via the Figma MCP server, then map
design elements to EXISTING gluestack-ui components in src/components/ui.
Match colors/spacing to Tailwind tokens in global.css — never hex literals.
If a needed component is missing, run `npx gluestack-ui@latest add <name>` first.

## Verification loop

After every change: `npm run check` (biome + tsc) → `npm test` → if UI changed.


- **Routes dir:** src/app/ (Expo Router modern default), not root app/. Functionally identical.
- **react-native-mmkv v4** (not v3): use `createMMKV({ id, encryptionKey? })` factory, and `remove()`
  (not `delete()`) in the zustand adapter.
- **MMKV encryption key:** per-device key in the Keychain/Keystore via src/lib/device-key.ts
  (expo-secure-store), NOT a build-time EXPO_PUBLIC_MMKV_KEY var.
- **TS strict flags:** `verbatimModuleSyntax` is OFF (gluestack v5 alpha ships type-only imports
  without `import type`, pulled in transitively). Re-enable once gluestack v5 stabilizes.
- **`.npmrc` pins `legacy-peer-deps=true`** — expo-router's radix/vaul chain still declares
  React 19.0 peers. Removing it breaks `npm install`.
- **The Expo SDK is pinned to 57.0.4, exactly.** Every `expo-*` dependency has an exact
  version and `overrides` pins the transitive ones (`expo-modules-core@57.0.3`,
  `expo-modules-jsi@57.0.1`, `@expo/ui@57.0.4`). Reason: SDK 57.0.5+ cannot be compiled by
  Xcode 26.2 / Swift 6.2.3. **Never run `npx expo install --fix`** — it undoes the pins and
  breaks the iOS build. All Expo modules must move together; a mismatched one fails at
  *launch* with a dyld `Symbol not found: ...ExpoModulesCore...` error, not at compile time.
  Ranges do not work (`~57.0.4` resolves to 57.0.21). 
- **`expo-router@57.0.4` does not export the `Theme` type** — `src/theme/navigation-theme.ts`
  derives it from `ComponentProps<typeof ThemeProvider>`. Leave it that way while pinned.
- **`newArchEnabled` / `edgeToEdgeEnabled`** are not set in app.config.ts: both are always-on
  in SDK 57 and are no longer part of the `ExpoConfig` type.
- **Transitive Expo pins:** besides the three above, `overrides` also pins every other transitive
  `expo-*` / `@expo/*` package to the version that was current on the 57.0.4 release day
  (2026-07-07): expo-asset, expo-file-system, expo-keep-awake, expo-glass-effect, expo-symbols,
  expo-modules-autolinking, @expo/dom-webview, @expo/cli, @expo/router-server, @expo/metro-runtime,
  @expo/prebuild-config, expo-server. Without them npm resolves the `^57.0.x` ranges to 57.0.2x.
  Third-party native libs use the exact versions from expo@57.0.4's `bundledNativeModules.json`
  (react-native 0.86.0, reanimated 4.5.0, worklets 0.10.0, screens 4.25.2, svg 15.15.4, …).
- **`gluestack-ui init` bumps native deps** (reanimated, worklets, svg, safe-area) — re-pin them
  after running it. It only detects an Expo project if `app.json`/`app.config.ts` exists, and only
  picks UniWind if `uniwind` is already in package.json; otherwise it silently falls back to NativeWind.
  `add` does not touch package.json. Use `--path src/components/ui`.
- **Bottom tabs** use `expo-router/js-tabs` (the root `Tabs` export is deprecated). Tab order and the
  default tab (chats) live in `src/features/navigation/tabs.ts`.
- **Light theme only.** `userInterfaceStyle: 'light'` (native), `Uniwind.setTheme('light')` before the
  first render and `GluestackUIProvider mode="light"` (app-providers), light navigation theme, dark
  status-bar text. Tokens are plain `:root` variables in global.css, with no `@variant light/dark`:
  UniWind always registers both built-in themes and errors ("Theme dark is missing variable") if a
  themed variable exists in only one. Don't add `dark:` classes.
- **Navigation theme colors** come from the global.css tokens via uniwind's `useCSSVariable`
  (`src/theme/use-navigation-theme.ts`) — no hex literals.
- **TS 6** defaults `types` to `[]`, so tsconfig lists `"types": ["jest", "node"]`.
  `noUncheckedIndexedAccess` is off because generated gluestack files fail it.
- **CocoaPods** needs `LANG=en_US.UTF-8` or `pod install` crashes with an ASCII-8BIT error.
- **Custom icons** live in `src/components/shared/icons.tsx`, built with
  `createIcon({ Root: Svg, … })` from `@gluestack-ui/core/icon/creator` (NOT `createIcon` from
  `@ui/icon`, which loses the stroke color). A single `<Path>` must be wrapped in a fragment, or it
  renders with no stroke ("" is not a valid color warning).
- **No dotted module names** like `chats.db.ts` / `x.data.ts`: Metro resolves `./chats.db` as a
  `.db` asset and fails. Use hyphens (`chats-store.ts`).
- **UniWind ignores gluestack `data-[…]` state classes** (e.g. `data-[disabled=true]:opacity-40`).
  Add the state class yourself (`disabled ? 'opacity-40' : ''`).
- **Don't put buttons in gluestack `InputSlot`**: slots are `accessibilityElementsHidden`. Use a
  plain `Pressable` child of `Input` (see `SearchField`).
- **Third-party components need `withUniwind(...)`** for `className` (KeyboardAvoidingView,
  expo-image). For LegendList use `useResolveClassNames()` for `contentContainerStyle` instead, which
  keeps its generics.
- **Mock API**: every request goes through `installAppMocks()` (Axios adapter, 500–1100 ms delay,
  0 under Jest). Features export their `*MockRoutes` + mock data from `index.ts`.
- **Tests**: `@test/*` → `test/` (renderWithQuery, installTestMocks, failureStatus). LegendList is
  replaced by `test/legend-list-mock.tsx` in Jest (renders every row; `<testID>-start-reached`
  triggers `onStartReached`).
- **Backend:** NestJS in `../wikibackend` (branch `fans-backend`, Railway). `EXPO_PUBLIC_API_URL`
  (origin without `/v1`, read in `src/config/env.ts`) switches the app from the in-app mocks to the
  real API; `src/config/api.ts` derives `API_BASE_URL` / `USE_MOCK_API`. Keep the mock routes and
  the backend contract identical (same ids and shapes). Test chats: `c_test_error` exists in both;
  `c_test_slow` (slow send) is backend-only on purpose — don't add it back to the mocks.
- **Sending messages = durable outbox + client ID** (see docs/message-delivery-reliability.md).
  `features/chats/outbox/`: `outbox-store.ts` writes to MMKV *before* updating memory; every send
  has a `clientId` reused for all retries (the server dedupes on it); `outbox-sync.ts` is the one
  app-wide sender (`<OutboxSync/>` in AppProviders), sequential, local order, "no response" =
  re-queue, HTTP error = failed (+ recoverable?). Never send a message without a clientId and never
  regenerate one on retry.
- **MMKV instances:** `fans-outbox` (client queue), `fans-mock-server` (mock backend DB, separate on
  purpose), `fans-query-cache` (React Query), `fans-dev-tools` (mock faults). Jest uses MMKV's
  in-memory mock (Nitro is stubbed in jest.setup.ts).
- **Never `queryClient.clear()` while screens are mounted** — observed queries are dropped from the
  cache and stop persisting. Use `resetQueries()`.
- **React Query onlineManager** is wired to connectivity at module load
  (`lib/network/connectivity.ts`) so first-render queries pause offline instead of failing.
- **Repro tooling:** Network lab screen (More → Network lab, dev only), `npm run start:mock:*`
  presets (`EXPO_PUBLIC_USE_MOCK_API=1`, `EXPO_PUBLIC_MOCK_SCENARIO`), `npm run test:reliability`.
  Restart tests: `test/app-restart.ts` + `renderPersistedApp`; unmount with the render's own
  `unmount`, not `screen.unmount()` (breaks the next test's render).
- **Safe areas (Android is edge-to-edge).** Every screen owns its insets with UniWind classes
  (`pt-safe`, `pb-safe-offset-*`). `presentation: 'modal'` is a page sheet on iOS (already below the
  status bar) but a full-screen page on Android, so modal headers use `MODAL_TOP_CLASS` from
  `components/shared/modal-insets.ts` (chosen with `Platform.OS`). Don't use UniWind's `android:` /
  `ios:` variants for insets — `android:pt-safe-offset-5` was applied on iOS too.
  Check new screens on Android for status-bar / navigation-bar overlap.
- **RevenueCat Test Store logs** errors for simulated failures, which open LogBox; expected ones
  are listed in `LogBox.ignoreLogs` in `revenuecat-store.ts`. `presentCustomerCenter` does not
  present over an RN modal (hangs) — the Test Store simulates cancellation instead, real keys use
  `showManageSubscriptions()`.
- **Mock presets apply once per script run**, not per launch: `start:mock:*` sets
  `EXPO_PUBLIC_MOCK_RUN_ID=$(date +%s)` and `dev-tools/launch-scenario.ts` remembers the applied run
  in MMKV. Otherwise the inlined `clean` preset wiped the outbox on every force-quit (breaks the
  restart scenarios). New presets need the run id in their script too.
