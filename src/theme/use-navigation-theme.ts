import { useCSSVariable } from 'uniwind';

import {
  buildNavigationTheme,
  type NavigationColors,
  type NavigationTheme,
} from './navigation-theme';

type ColorKey = keyof NavigationColors;

/** Navigation color → Tailwind token from global.css. */
const TOKEN_BY_COLOR = {
  primary: '--color-primary',
  background: '--color-background',
  card: '--color-card',
  text: '--color-foreground',
  border: '--color-border',
  notification: '--color-destructive',
} as const satisfies Partial<Record<ColorKey, string>>;

const COLOR_KEYS = Object.keys(TOKEN_BY_COLOR) as Array<keyof typeof TOKEN_BY_COLOR>;

/** Maps the Tailwind tokens from global.css onto the React Navigation theme. */
export function useNavigationTheme(): NavigationTheme {
  const values = useCSSVariable(COLOR_KEYS.map((key) => TOKEN_BY_COLOR[key]));

  const colors: Partial<NavigationColors> = {};
  COLOR_KEYS.forEach((key, index) => {
    const value = values[index];
    if (typeof value === 'string') colors[key] = value;
  });

  return buildNavigationTheme(colors);
}
