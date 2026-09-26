export const usersEndpoints = {
  list: '/users',
  detail: (userId: string) => `/users/${encodeURIComponent(userId)}`,
  fanLists: '/fan-lists',
} as const;
