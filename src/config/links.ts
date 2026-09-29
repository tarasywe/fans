/** Single source of truth for navigation paths. Never hardcode route strings elsewhere. */
export const links = {
  root: '/',
  analytics: '/analytics',
  wallet: '/wallet',
  chats: '/chats',
  calendar: '/calendar',
  more: '/more',
  newChat: '/chats/new',
  devTools: '/dev-tools',
  paywall: '/paywall',
  subscription: '/subscription',
  chat: (chatId: string) => ({ pathname: '/chats/[chatId]', params: { chatId } }) as const,
  user: (userId: string) => ({ pathname: '/users/[userId]', params: { userId } }) as const,
} as const;

export type TabLink = (typeof links)['analytics' | 'wallet' | 'chats' | 'calendar' | 'more'];
