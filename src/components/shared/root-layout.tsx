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
            add the top inset themselves with `android:pt-safe-offset-*`. */}
        <Stack.Screen name="chats/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="users/[userId]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="dev-tools" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  );
}
