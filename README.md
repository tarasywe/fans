# Voicegram

Record, play and manage short audio clips, compile them into albums and sync them with Firebase.
Built with Expo (iOS + Android). Bundle ID / package: `com.fans.app`.

See [CLAUDE.md](CLAUDE.md) for the full stack and architecture rules, and [TODO.md](TODO.md) for the roadmap.

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20.19+ (22 LTS recommended) | |
| npm | 10+ | The repo uses npm (`package-lock.json`). `.npmrc` sets `legacy-peer-deps=true`. |
| Xcode | 26.2 | iOS only. Also install an iOS Simulator runtime. |
| CocoaPods | 1.16+ | iOS only (`brew install cocoapods`). |
| Android Studio | latest | Android only. Android SDK + an emulator, `JDK 17`, `ANDROID_HOME` set. |

> This app uses native modules (MMKV, Nitro, Reanimated, keyboard-controller…), so it does **not**
> run in Expo Go. You always run a development build (`expo run:*`).

## Install

```bash
npm install
```

> Do **not** run `npx expo install --fix`. The Expo SDK is pinned to `57.0.4` exactly
> (see CLAUDE.md) and that command would undo the pins and break the iOS build.

## Run on a local device / simulator

The native `ios/` and `android/` folders are generated (Continuous Native Generation) and are
git-ignored. Generate them once, and again after changing `app.config.ts` or adding a native dependency:

```bash
npm run prebuild
```

If `pod install` fails with `Unicode Normalization not appropriate for ASCII-8BIT`, export a UTF-8
locale first: `export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`.

### iOS (simulator)

```bash
npm run ios
```

Pick a device with `npx expo run:ios --device`.

### Android (emulator or USB device)

```bash
npm run android
```

### Dev server only

When a development build is already installed on the device, just start Metro:

```bash
npm start
```

## Build

Release build installed on a local simulator/device:

```bash
npx expo run:ios --configuration Release
```

```bash
npx expo run:android --variant release
```

Store builds (signed `.ipa` / `.aab`) go through EAS: `npx eas-cli@latest build --platform ios|android`.

## Quality checks

| Command | What it does |
| --- | --- |
| `npm run check` | Biome (lint + format check) and TypeScript `tsc --noEmit` |
| `npm run check:fix` | Apply Biome's safe fixes and formatting |
| `npm test` | Jest (jest-expo preset + React Native Testing Library) |
| `npm run test:watch` | Jest in watch mode |

Run `npm run check` and `npm test` after every change.

`tsc` relies on Expo Router's generated route types in `.expo/types` (git-ignored). They are
created by `npm start`; after a fresh clone, or after adding a route, start Metro once before `npm run check`.

## Backend: real API or in-app mocks

The app talks to the **FanSuite API** (NestJS, repo `wikibackend`, branch `fans-backend`,
hosted on Railway). Where requests go is decided by `EXPO_PUBLIC_API_URL`:

| `EXPO_PUBLIC_API_URL` | Requests go to |
| --- | --- |
| unset (default) | In-app mock API: Axios adapter + `src/features/*/mocks`, 500–1100 ms delay, no network |
| `https://wikibackend-production-953e.up.railway.app` | The deployed backend on Railway (`/v1/...`, Swagger at `/api`) |
| `http://<your-computer-ip>:3000` | A local `npm run start:dev` of the backend (phone on the same Wi-Fi) |

Set it in `.env.local` (git-ignored, see `.env.example`), then restart Metro with
`npx expo start --clear` (env vars are inlined at bundle time). Use the origin **without** `/v1`.

Endpoints (same contract for mocks and backend):

| Endpoint | Notes |
| --- | --- |
| `GET /users?search=` · `GET /users/:userId` · `GET /fan-lists` | |
| `GET /chats` · `GET /chats/:chatId` · `POST /chats` `{ participantIds }` | Newest activity first; 1:1 chats are reused |
| `GET /chats/:chatId/messages?before=&limit=20` | Cursor pagination, oldest → newest per page. Backend history is endless |
| `POST /chats/:chatId/messages` `{ text }` | 1–400 characters |

### Sending messages and network test chats

A sent message appears immediately as **Sending…**. It becomes **Sent** only when the POST
succeeds and the server's copy replaces it. If the request fails (HTTP error, timeout after 15 s,
or offline), the message stays in the chat as **Not sent**, with **Retry** and **Delete**.
Pending and failed messages live in a Zustand outbox (`src/features/chats/store.ts`), so a refetch
never drops them.

Two chats at the top of the list exist to test this on a device, in both the mocks and the backend:

| Chat | Sending a message |
| --- | --- |
| **Test: send fails (500)** | Always fails with HTTP 500, so the message goes to Not sent |
| **Test: slow send** | Accepted after about 6 s, so you see Sending… and then Sent |

For offline testing, send while in airplane mode, then turn the network back on and tap Retry.

## Project layout

```
src/
  app/                 Expo Router routes only (≤15 lines each, re-export feature screens)
    (tabs)/            Bottom tabs: analytics, wallet, chats (default, middle), calendar, more
    chats/[chatId]     Chat screen · chats/new — "New message" modal
    users/[userId]     "Fan Details" profile modal
  features/<name>/     Feature modules; public API is the feature's index.ts
  components/shared/   Cross-feature components (providers, root layout, empty/not-found screens)
  components/ui/       gluestack-ui components — generated, never edit by hand
  config/links.ts      All navigation paths
  features/chats/      Chat list, new chat, chat screen, mock chat API (100 messages per chat)
  features/users/      Users + Fan Details screen, mock users API
  lib/                 Framework setup (React Query client, Axios `http`, mock API adapter)
  theme/               Navigation theme mapped from the Tailwind tokens
  global.css           Tailwind v4 / UniWind theme tokens
```

Add a gluestack-ui component with:

```bash
npx gluestack-ui@latest add <component> --path src/components/ui
```
