import { Redirect } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { NotFoundScreen } from '@/components/shared/not-found-screen';
import { links } from '@/config/links';

import { TabsLayout } from '../components/tabs-layout';
import { INITIAL_TAB, TABS } from '../tabs';

function makeScreen(testID: string) {
  return () => <Text testID={testID}>{testID}</Text>;
}

const routes = {
  index: () => <Redirect href={links.chats} />,
  '+not-found': NotFoundScreen,
  '(tabs)/_layout': { default: TabsLayout, unstable_settings: { initialRouteName: INITIAL_TAB } },
  '(tabs)/feed': makeScreen('feed-screen'),
  '(tabs)/search': makeScreen('search-screen'),
  '(tabs)/chats': makeScreen('chats-screen'),
  '(tabs)/notifications': makeScreen('notifications-screen'),
  '(tabs)/settings': makeScreen('settings-screen'),
};

/**
 * RNTL 14 renders asynchronously: renderRouter returns the pending render with the router
 * helpers attached, so await the render first and read the pathname from the original object.
 */
async function renderApp(initialUrl: string) {
  const router = renderRouter(routes, { initialUrl });
  await router;
  return { getPathname: () => router.getPathname() };
}

describe('tab routing', () => {
  it('opens chats when the app starts at the root path', async () => {
    const router = await renderApp(links.root);
    expect(screen.getByTestId('chats-screen')).toBeTruthy();
    expect(router.getPathname()).toBe(links.chats);
  });

  it('renders a button for each of the five tabs', async () => {
    await renderApp(links.chats);
    for (const tab of TABS) {
      expect(screen.getByTestId(`tab-${tab.name}`)).toBeTruthy();
    }
  });

  it('deep-links directly into a non-default tab', async () => {
    const router = await renderApp(links.settings);
    expect(screen.getByTestId('settings-screen')).toBeTruthy();
    expect(router.getPathname()).toBe(links.settings);
  });

  it('shows the not-found screen for unknown paths', async () => {
    const router = await renderApp('/does-not-exist');
    expect(screen.getByTestId('not-found-screen')).toBeTruthy();
    expect(screen.queryByTestId('chats-screen')).toBeNull();
    expect(router.getPathname()).toBe('/does-not-exist');
  });

  it('navigates back to chats from the not-found screen', async () => {
    const router = await renderApp('/does-not-exist');
    await fireEvent.press(screen.getByTestId('not-found-home-link'));
    expect(screen.getByTestId('chats-screen')).toBeTruthy();
    expect(router.getPathname()).toBe(links.chats);
  });

  it('switches tabs when a tab button is pressed', async () => {
    const router = await renderApp(links.chats);
    await fireEvent.press(screen.getByTestId('tab-search'));
    expect(screen.getByTestId('search-screen')).toBeTruthy();
    expect(router.getPathname()).toBe(links.search);
  });
});
