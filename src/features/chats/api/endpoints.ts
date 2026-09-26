const encode = encodeURIComponent;

export const chatsEndpoints = {
  list: '/chats',
  create: '/chats',
  detail: (chatId: string) => `/chats/${encode(chatId)}`,
  messages: (chatId: string) => `/chats/${encode(chatId)}/messages`,
} as const;

/** Route patterns for the mock server. */
export const chatsRoutePatterns = {
  detail: '/chats/:chatId',
  messages: '/chats/:chatId/messages',
} as const;
