import { DarkTheme, DefaultTheme } from 'expo-router';

import { buildNavigationTheme } from '../navigation-theme';

describe('buildNavigationTheme', () => {
  it('uses the light base theme when not dark', () => {
    const theme = buildNavigationTheme(false, {});
    expect(theme.dark).toBe(false);
    expect(theme.colors).toEqual(DefaultTheme.colors);
  });

  it('uses the dark base theme when dark', () => {
    const theme = buildNavigationTheme(true, {});
    expect(theme.dark).toBe(true);
    expect(theme.colors).toEqual(DarkTheme.colors);
  });

  it('overrides only the provided colors', () => {
    const theme = buildNavigationTheme(false, { primary: 'rgb(1, 2, 3)' });
    expect(theme.colors.primary).toBe('rgb(1, 2, 3)');
    expect(theme.colors.background).toBe(DefaultTheme.colors.background);
  });
});
