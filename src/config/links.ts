/** Single source of truth for navigation paths. Never hardcode route strings elsewhere. */
export const links = {
  root: '/',
  feed: '/feed',
  search: '/search',
  chats: '/chats',
  notifications: '/notifications',
  settings: '/settings',
} as const;

export type AppLink = (typeof links)[keyof typeof links];
