import { DarkTheme, DefaultTheme, type ThemeProvider } from 'expo-router';
import type { ComponentProps } from 'react';

// expo-router@57.0.4 does not export the `Theme` type — derive it from ThemeProvider.
export type NavigationTheme = NonNullable<ComponentProps<typeof ThemeProvider>['value']>;
export type NavigationColors = NavigationTheme['colors'];

export function buildNavigationTheme(
  isDark: boolean,
  colors: Partial<NavigationColors>,
): NavigationTheme {
  const base = isDark ? DarkTheme : DefaultTheme;
  return { ...base, dark: isDark, colors: { ...base.colors, ...colors } };
}
