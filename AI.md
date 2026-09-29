# How AI was used

## Tools

| Tool | Used for |
| --- | --- |
| **Claude Code** (Claude Opus, Claude desktop app) | Most of the code, tests, docs and the NestJS backend. It ran `npm run check`, Jest and the backend e2e tests after each change |
| Figma MCP server + the built-in browser | Reading the FanSuite Figma frames and mapping them to gluestack-ui components |
| iOS Simulator control (from Claude Code) | Tapping through scenarios, taking screenshots, and recording `docs/recordings/*.mp4` with `simctl` |
| `xcrun xctrace` | Trying to export Instruments traces for analysis |
| Xcode Instruments (by me, on a physical iPhone) | Animation Hitches recordings of a Release build |
| gluestack-ui CLI, Expo CLI, Biome, Jest + React Native Testing Library | Scaffolding and verification |

I tested each step myself on the simulator or device and committed after each step. The AI never
committed.

## Prompts and what they produced

| Prompt (summary) | Generated | Tests / verification |
| --- | --- | --- |
| Create an Expo project (iOS + Android) from TODO.md; app id `com.fans.app` | Expo SDK 57 project with Router, gluestack v5 + UniWind, Zustand, React Query, MMKV, Biome, strict TS; tabs; CLAUDE.md | `npm run check`, first Jest setup |
| Implement the Figma UI (chat list, new chat, chat, Fan Details), mock data, `fans` scheme, light theme only | Screens, components, custom icons, mock users/chats (100 messages per chat), navigation via `links.ts` | Screen tests: list, search, new chat, pagination with `onStartReached`, profile |
| NestJS backend on branch `fans-backend`, same endpoints as the mocks, a test chat that always returns 500 and a slow chat, endless history | `wikibackend`: users, chats, cursor pagination with endless history, `c_test_error`, `c_test_slow`; Railway config | Backend e2e tests; checked against the deployed Railway URL |
| Android safe-area overlap | Per-screen inset classes, edge-to-edge handling | Fixed from my Android screenshot, then re-checked by me on Android |
| "Keep messages safe": duplicates, offline queue, restarts, recovery, repro doc, recording, tests | Client-ID idempotency (client, mock, Nest), durable MMKV outbox, app-wide sender, persisted query cache, Network lab, `start:mock:*` presets, `docs/message-delivery-reliability.md` | 23 reliability tests: lost-response duplicate (failed before the fix with 2 copies), offline + restart + incoming + reconnect, restart during an in-flight send, repeated responses, offline cache restore. Simulator recording |
| Purchases: reuse carboai-mobile's RevenueCat setup, paywall on cold start, status page (none / purchased / cancel), backend confirmation, plus the payment requirements | Billing feature: provider abstraction (RevenueCat Test Store / simulated store), receipt queue + sync, mock billing backend + Nest `billing` module, paywall, Subscription page, Network lab billing section, `docs/billing.md` | 41 billing tests: **delayed confirmation**, single-flight purchase, duplicate receipts, cancelled/failed purchase keeps access, 409 keeps access, restore (another device, reinstall), cancel/resume, refund replayed ×3 applied once, offline queue, lost response, store timeout, cold-start rules. Backend billing e2e. Simulator recording |

## Output I checked or corrected

- **Metro and dotted file names.** A module named like `chats.db.ts` was resolved as an asset and
  failed. Renamed with hyphens, and noted in CLAUDE.md.
- **gluestack init** silently fell back to NativeWind and bumped native versions. I re-pinned them
  and switched to UniWind.
- **Expo version.** The "latest" Expo 57 patch releases don't compile with Xcode 26.2. Pinned 57.0.4
  exactly, including transitive packages.
- **iOS modal header gap.** The generated `android:pt-safe-offset-5` class was also applied on
  iOS. Replaced with a `Platform.OS`-based class.
- **RevenueCat Customer Center hung the UI** over a React Native modal. Replaced with a simulated
  cancellation (Test Store) or the system subscription settings, plus a store timeout.
- **Stale notices.**
  - "Waiting for confirmation" stayed after a purchase was confirmed.
  - After a refund, "Auto-renew is back on" was still shown.

  Both are fixed, and the refund case has a test.
- **Network lab "Replay ×3"** showed nothing new on screen. It now prints the number of new effects
  (0).
- **Test warnings.** Some tests updated state outside `act()`. Fixed the React warnings in the
  billing tests.
- **Docs claiming more than the code does.** For example, the billing doc said access is refetched
  "on foreground", which isn't wired. The docs were corrected, and the gap is listed as a follow-up.
- **The AI's own earlier fix was incomplete.** Making mock presets run "once per JS runtime" still
  wiped the outbox on every force-quit. I found this while recording Scenario A. The fix changed to
  once per `start:mock:*` run, with a regression test.
- **Performance analysis.** The AI computed hitch totals and the ratio, and found the exact 5 s
  period by hand from the pasted list. It said explicitly that it could not identify the cause
  without thread data.

## Still unsure / not verified

- **The 5-second periodic hitch.** No 5 s timer exists in our code. A library timer or system work
  is possible. It needs a Time Profiler recording. The idle trace couldn't be exported because
  `xctrace` rejects documents that contain failed runs.
- **Keystroke hitches.** That typing costs a frame is a hypothesis from the timing only.
- **No before/after performance comparison and no memory numbers yet.**
- **An `ExpoRoot` red-screen error** in one build. Only the bottom of the stack was captured.
  RevenueCat was disabled as a workaround, and the root cause was not confirmed.
- **RevenueCat with real platform keys** (`showManageSubscriptions`, webhooks) is untested. So is
  billing on Android.
