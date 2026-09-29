# FanSuite chat (Expo, iOS + Android)

A creator ↔ fan messaging app:
- chat list, a chat thread with endless history, a new-message flow and fan profiles (designs from Figma)
- a message outbox that survives network loss and app restarts
- a simulated Premium subscription

Bundle ID / package: `com.fans.app`, scheme `fans`. Backend: NestJS in `../wikibackend` (branch
`fans-backend`, deployed on Railway).

## Run it

```bash
npm install
```

```bash
npm run prebuild
```

```bash
npm run ios
```

- Use `npm run android` for Android. The app needs a development build; Expo Go won't work
  because of the native modules.
- If `pod install` fails, `export LANG=en_US.UTF-8` first.
- Never run `npx expo install --fix`. The Expo SDK is pinned to 57.0.4 on purpose (see
  Limitations).

| Command | Purpose |
| --- | --- |
| `npm start` | Metro. Uses the in-app mock API unless `EXPO_PUBLIC_API_URL` is set in `.env.local` (see `.env.example`) |
| `npm run start:mock:clean` | Mock API, all mock data wiped once when Metro starts. Other presets: `:offline`, `:lost-response`, `:server-error`, `:billing-slow-confirm`, `:billing-no-confirm`, `:billing-store-fails` |
| `npm run check` | Biome + `tsc --noEmit` |
| `npm test` · `npm run test:reliability` · `npm run test:billing` | Jest |

In a dev build, **More → Network lab** simulates faults on demand:
- offline
- a lost response
- a 500 error
- 4 incoming messages from Ethan
- billing store and backend outcomes

## The duplicate-message bug

- **Symptom.** A send reached the server, but the response was lost. The app showed *Not sent*,
  the user tapped Retry, and the thread contained the message **twice**.
- **Cause.** The POST carried only `{ text }`, and the server created a new message for every
  request. The client treated "no response" as "not delivered", although the server had already
  stored the message. Pending messages were also kept in memory only, so a force-quit lost them.
- **Proof.** `lost-response-duplicate.test.tsx` injects a lost response and retries. It failed on
  the old code with `Expected: 1, Received: 2` and passes after the fix.
- **Fix.**
  - Every send gets a **client ID** when the user taps Send. The same ID is reused for every retry,
    including after a restart.
  - The server (mock and Nest) returns the stored message for a known client ID instead of creating
    a new one.
  - "No response" re-queues the message instead of marking it failed.
  - The client cache also de-duplicates by client ID.

## Key decisions

- **Durable outbox.** A message is written to MMKV **before** it is shown as queued. One app-wide
  sender works through the queue one message at a time, in local order. A network error stops the
  queue, so nothing overtakes an unsent message. HTTP errors show *Not sent* with a reason and
  Retry, or Edit when retrying can't help.
- **Recovery on reconnect.** The app refetches first, which brings in messages that arrived while
  offline, then flushes the queue. It skips entries whose client ID is already in the thread.
- **Offline start.** The React Query cache is persisted to MMKV, and queries pause while offline
  instead of failing.
- **Mock backend = real backend contract.** The mock has the same ids and shapes, and its own MMKV
  storage, so it behaves like a server across restarts. Faults are injected in the Axios mock
  adapter.
- **Paid access comes only from the backend.** The store result is shown as *confirming* until the
  backend confirms the receipt.
  - Receipts go through a durable queue and are idempotent by transaction ID.
  - Store events (webhooks) are idempotent by event ID.
  - Store flows are single-flight, with a timeout.
  - A failed purchase never removes access the user still has.
  - The paywall opens on every cold start for users without access.
- **Billing is simulated.** RevenueCat's Test Store uses the paywall from carboai-mobile's
  RevenueCat project. The app also has a built-in simulated store. **RevenueCat initialisation is
  currently disabled** (`REVENUECAT_ENABLED = false` in `features/billing/providers/index.ts`), so
  the simulated store is used.
- **Mock presets apply once per `start:mock:*` run** (a run id stored in MMKV), not on every launch.
  Otherwise the `clean` preset wiped the outbox on each force-quit and broke the restart scenarios.
- **Light theme only.** The UI uses gluestack-ui v5 + UniWind; screens own their safe-area insets.
  Android is edge-to-edge.

## Test results

| Suite | Result |
| --- | --- |
| App: `npm test` | **198 / 198 passing**, 34 suites. Includes 23 reliability tests and 41 billing tests. `npm run check` is clean |
| Simulator: message delivery (iPhone 17 Pro, mock API) | Scenario A (offline sends, force-quit, 4 incoming, reconnect): 4 incoming then 3 outgoing, each once, all *Sent*. Scenario B (lost response): one copy. Scenario C (500): *Not sent* → Retry → *Sent*. Recording: `docs/recordings/offline-restart-recovery.mp4` |
| Simulator: billing (RevenueCat Test Store, mock backend) | Cold-start paywall, failed purchase, purchase confirmed after 4 s, restore, cancel/resume, a refund replayed ×3 (applied once), paywall again after a cold start. Recording: `docs/recordings/billing.mp4` |

The delayed-confirmation test (`delayed-confirmation.test.tsx`) proves that access is granted only
after the backend confirms a purchase.

## Performance measurements

One Release build on a physical 120 Hz iPhone, recorded with Instruments → Animation Hitches.
The sequence: scroll up about 10 pages, scroll down, type, then delete the text.

| Metric | Value |
| --- | --- |
| Hitches | 41 in about 55 s. Total hitch time about 471 ms |
| Hitch time ratio | about **8.5 ms/s** averaged over the whole recording. That's in Apple's "noticeable" band (5–10). It's a lower bound, because the ratio should be taken over scrolling time only |
| Longest hitch | 37.5 ms (4–5 missed frames), while scrolling up |
| Pattern 1 | A hitch every **5.00 s**, marked "expensive render, 8–13 offscreen passes". It accounts for about half of all hitch time. It has a fixed period, and the app has no 5 s timer, so the cause is **unknown** |
| Pattern 2 | A burst of "expensive app update" hitches about 150–190 ms apart during typing. This suggests keystrokes cost a frame. It's a hypothesis, not yet confirmed with Time Profiler |
| Memory | **Not measured yet** |
| Before / after a change | **Not done yet.** The idle-state trace could not be exported: `xctrace` refuses documents with failed runs (the trace has 4 runs, 2 failed, 3.6 GB) |

That run used the Railway backend. For a proper before/after, use the mock-API Release build from
the profiling guide, which gives the same history every time. Simulator timings are not used as
evidence.

## Platform limitations

- **Simulated faults act on the Axios mock adapter, not the OS network stack.** Real airplane mode
  goes through NetInfo and was only exercised against the real backend.
- **The Nest backend stores everything in memory.** Idempotency holds while it runs; a redeploy
  resets it.
- **Profiling.**
  - There's no automated scroll-and-type driver on a physical iPhone. 
  - Hermes JS stacks aren't visible in Release profiles.

## Resuming a large media upload (design only, not built)

- **Resumable protocol.** Upload in chunks to a resumable endpoint, for example
  [tus](https://tus.io/protocols/resumable-upload) or S3 multipart. The server keeps an upload ID
  and the confirmed byte offset or parts.
- **Durable local state.** Like the message outbox, the app saves the upload in MMKV **before**
  starting it:
  - a copy of the file in the app's own storage (the picker's temporary URI can disappear)
  - the upload ID
  - the confirmed offset or parts
- **Resuming.** After a network drop or a restart, the app asks the server for the current offset
  (`HEAD` in tus) and continues from there, without starting over. Finishing is idempotent by
  upload ID, so a lost "complete" response can't create a second post.
- **Backgrounding.** Hand the transfer to the OS so it keeps running while the app is suspended:
  - **iOS:** a background `URLSession`
    ([`background(withIdentifier:)`](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/background(withidentifier:)))
    uploading from a file. The OS continues the upload and relaunches the app in the background when
    it finishes.
  - **Android:** a [WorkManager](https://developer.android.com/develop/background-work/background-tasks/persistent)
    job run as a foreground service, or a user-initiated data transfer job on Android 14+. It
    survives the app being swiped away and even the process being killed.
- **Force-quit is different.** When the user **force-quits** on iOS (swipes the app away in the app
  switcher) or taps **Force stop** on Android, the system cancels the app's background transfers and
  scheduled work. Nothing runs until the user opens the app again. On the next launch the app reads
  its saved state, asks the server for the offset, and resumes, showing "Paused, resuming…" rather
  than failing.

## App Store and Google Play rules for creator content and payments

| Rule | Official source | What it means for this app |
| --- | --- | --- |
| **Digital purchases must use the store's billing**: subscriptions, premium content, unlocking features. Apple allows "tips" to digital content providers through in-app purchase | Apple [Guideline 3.1.1](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase) · Google Play [Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738) and [Play Billing](https://developer.android.com/google/play/billing) | Premium subscriptions, paid messages, locked media, tips and gifts sold **in the app** go through StoreKit / Play Billing (here via RevenueCat), with the store's commission. Payouts to creators happen outside the stores, on our backend |
| **Linking out to other payment methods** is only allowed in some cases. Apple: allowed on the **US storefront**, and with StoreKit External Purchase entitlements in some regions, such as the [EU (DMA)](https://developer.apple.com/support/dma-and-apps-in-the-eu/). Google: only in eligible countries through its alternative / external billing programs (see the Payments policy) | Apple [3.1.1(a)](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase) · Google [Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738) | A "subscribe on our website" button has to depend on the store and the country. The default everywhere is in-app purchase |
| **Multiplatform access.** Content bought on the web can be unlocked in the app **only if it's also sold as in-app purchase**. The "reader app" exception covers magazines, books, music and video, not fan subscriptions or messaging | Apple [3.1.3(a), 3.1.3(b)](https://developer.apple.com/app-store/review/guidelines/#other-purchase-methods) | A web subscription can grant access in the app, but the app must still offer the same products through in-app purchase. The backend is the single source of access (already true here) |
| **Real-time one-to-one services** (for example a paid video call with a creator) may use other payment methods. One-to-few and one-to-many services must use in-app purchase | Apple [3.1.3(d)](https://developer.apple.com/app-store/review/guidelines/#other-purchase-methods) | Only live 1:1 sessions could skip in-app purchase. Paid chats, posts and broadcasts can't |
| **User-generated / creator content needs moderation**: filtering, in-app reporting with a timely response, blocking users, published contact info, terms of use. Apple 1.2.1(a): content above the app's age rating must be flagged and gated by a verified or declared age | Apple [1.2 and 1.2.1](https://developer.apple.com/app-store/review/guidelines/#user-generated-content) · Google [User Generated Content](https://support.google.com/googleplay/android-developer/answer/9876937) | Scope must include report and block actions in chats and profiles, a moderation backend, terms and a support contact, and an age gate. The current UI has none of these |
| **No sexually explicit content**. On Apple, UGC apps used mainly for pornography are rejected. On Google, sexual content is restricted, and incidental sexual UGC must be filtered by default and kept from minors | Apple [1.1.4](https://developer.apple.com/app-store/review/guidelines/#objectionable-content) · Google [Inappropriate Content](https://support.google.com/googleplay/android-developer/answer/9878810) | If creators post adult content, it can't be viewed or sold in the store apps. It would stay on the web, and the mobile app would be limited to allowed content |
| **In-app account deletion** is required wherever the app lets users create an account | Apple [5.1.1(v)](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage) and the [account deletion guide](https://developer.apple.com/support/offering-account-deletion-in-your-app/) · Google [account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111) | Once real sign-up exists: "Delete account" in More, plus a web link for Google Play |

**Effect on scope.**
- The store apps have to be a **moderated, age-rated** client:
  - report and block
  - an age gate
  - no explicit content
  - account deletion
- Everything sold **inside** the app uses the store's billing (already modelled by the RevenueCat
  integration and backend confirmation).
- External payment links are added only per storefront where the rules allow them.
- Creator payouts, and any content the stores don't allow, stay on the web.
- The store guidelines change often, so re-check them before each submission. The links above were
  checked on 29 Sep 2026.
