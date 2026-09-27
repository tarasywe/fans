import { OutboxSync } from '@features/chats';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { GluestackUIProvider } from '@ui/gluestack-ui-provider';
import { ThemeProvider } from 'expo-router';
import { type PropsWithChildren, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind, withUniwind } from 'uniwind';
import { createQueryClient } from '@/lib/query-client';
import {
  createQueryPersister,
  QUERY_CACHE_MAX_AGE_MS,
  shouldPersistQuery,
} from '@/lib/query-persister';
import { useNavigationTheme } from '@/theme/use-navigation-theme';

import { installAppMocks } from './mock-api';

installAppMocks();
// Light-only app: fix the theme before the first render so nothing is styled with the system theme.
Uniwind.setTheme('light');

const StyledGestureHandlerRootView = withUniwind(GestureHandlerRootView);

function NavigationThemeProvider({ children }: PropsWithChildren) {
  const theme = useNavigationTheme();
  return <ThemeProvider value={theme}>{children}</ThemeProvider>;
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);
  const [persistOptions] = useState(() => ({
    persister: createQueryPersister(),
    maxAge: QUERY_CACHE_MAX_AGE_MS,
    buster: 'v1',
    dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
  }));

  return (
    <StyledGestureHandlerRootView className="flex-1">
      <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
        <KeyboardProvider>
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <OutboxSync />
            <GluestackUIProvider mode="light">
              <NavigationThemeProvider>{children}</NavigationThemeProvider>
            </GluestackUIProvider>
          </PersistQueryClientProvider>
        </KeyboardProvider>
      </SafeAreaListener>
    </StyledGestureHandlerRootView>
  );
}
