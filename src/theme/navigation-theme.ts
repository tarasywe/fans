import { DefaultTheme, type ThemeProvider } from 'expo-router';
import type { ComponentProps } from 'react';

// expo-router@57.0.4 does not export the `Theme` type — derive it from ThemeProvider.
export type NavigationTheme = NonNullable<ComponentProps<typeof ThemeProvider>['value']>;
export type NavigationColors = NavigationTheme['colors'];

/** The app is light-only: always the light base theme, with token colors layered on top. */
export function buildNavigationTheme(colors: Partial<NavigationColors>): NavigationTheme {
  return { ...DefaultTheme, dark: false, colors: { ...DefaultTheme.colors, ...colors } };
}
