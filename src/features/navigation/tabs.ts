import { CalendarDaysIcon, type Icon, MessageCircleIcon } from '@ui/icon';
import type { ComponentProps } from 'react';
import { AnalyticsIcon, GridIcon, WalletIcon } from '@/components/shared/icons';

export type TabName = 'analytics' | 'wallet' | 'chats' | 'calendar' | 'more';

export type TabDefinition = {
  name: TabName;
  title: string;
  icon: ComponentProps<typeof Icon>['as'];
  /** Rendered as the filled square button in the middle of the bar (Figma). */
  featured?: boolean;
};

/** Default tab opened on launch. */
export const INITIAL_TAB: TabName = 'chats';

/** Bottom tabs in display order. `name` must match the route file in src/app/(tabs)/. */
export const TABS: readonly TabDefinition[] = [
  { name: 'analytics', title: 'Analytics', icon: AnalyticsIcon },
  { name: 'wallet', title: 'Wallet', icon: WalletIcon },
  { name: 'chats', title: 'Chats', icon: MessageCircleIcon, featured: true },
  { name: 'calendar', title: 'Calendar', icon: CalendarDaysIcon },
  { name: 'more', title: 'More', icon: GridIcon },
];
