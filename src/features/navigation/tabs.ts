import { BellIcon, GlobeIcon, MessageCircleIcon, SearchIcon, SettingsIcon } from '@ui/icon';

export type TabName = 'feed' | 'search' | 'chats' | 'notifications' | 'settings';

export type TabDefinition = {
  name: TabName;
  title: string;
  icon: typeof MessageCircleIcon;
};

/** Default tab opened on launch. */
export const INITIAL_TAB: TabName = 'chats';

/**
 * Bottom tabs in display order. `name` must match the route file in src/app/(tabs)/.
 * Icons are placeholders until the Figma assets are wired in.
 */
export const TABS: readonly TabDefinition[] = [
  { name: 'feed', title: 'Feed', icon: GlobeIcon },
  { name: 'search', title: 'Search', icon: SearchIcon },
  { name: 'chats', title: 'Chats', icon: MessageCircleIcon },
  { name: 'notifications', title: 'Notifications', icon: BellIcon },
  { name: 'settings', title: 'Settings', icon: SettingsIcon },
];
