import { ColdStartPaywall } from '@features/billing';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from './app-providers';

export function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chats/[chatId]" options={{ animation: 'slide_from_right' }} />
        {/* iOS: page sheet below the status bar. Android: full-screen page, so these screens
            add the top inset themselves via MODAL_TOP_CLASS (components/shared/modal-insets). */}
        <Stack.Screen name="chats/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="users/[userId]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="dev-tools" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="subscription" options={{ presentation: 'modal' }} />
      </Stack>
      <ColdStartPaywall />
    </AppProviders>
  );
}
