import { DefaultTheme } from 'expo-router';

import { buildNavigationTheme } from '../navigation-theme';

describe('buildNavigationTheme', () => {
  it('is always the light theme', () => {
    const theme = buildNavigationTheme({});
    expect(theme.dark).toBe(false);
    expect(theme.colors).toEqual(DefaultTheme.colors);
  });

  it('overrides only the provided colors', () => {
    const theme = buildNavigationTheme({ primary: 'rgb(1, 2, 3)' });
    expect(theme.colors.primary).toBe('rgb(1, 2, 3)');
    expect(theme.colors.background).toBe(DefaultTheme.colors.background);
  });
});
