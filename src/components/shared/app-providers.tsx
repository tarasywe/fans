import { QueryClientProvider } from '@tanstack/react-query';
import { GluestackUIProvider } from '@ui/gluestack-ui-provider';
import { ThemeProvider } from 'expo-router';
import { type PropsWithChildren, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind, withUniwind } from 'uniwind';
import { createQueryClient } from '@/lib/query-client';
import { useNavigationTheme } from '@/theme/use-navigation-theme';

const StyledGestureHandlerRootView = withUniwind(GestureHandlerRootView);

function NavigationThemeProvider({ children }: PropsWithChildren) {
  const theme = useNavigationTheme();
  return <ThemeProvider value={theme}>{children}</ThemeProvider>;
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  return (
    <StyledGestureHandlerRootView className="flex-1">
      <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <GluestackUIProvider mode="system">
              <NavigationThemeProvider>{children}</NavigationThemeProvider>
            </GluestackUIProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaListener>
    </StyledGestureHandlerRootView>
  );
}
