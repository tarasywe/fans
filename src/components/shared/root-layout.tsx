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
        <Stack.Screen name="chats/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="users/[userId]" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  );
}
