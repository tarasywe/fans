import { MockHttpError, type MockRoute } from '@/lib/mock';

import { usersEndpoints } from '../api/endpoints';
import { findMockUser, mockFanLists, mockUsers, toUserSummary } from './users-data';

export function normalizeSearch(value: string | undefined): string {
  return (value ?? '').trim().replace(/^@/, '').toLowerCase();
}

export const usersMockRoutes: MockRoute[] = [
  {
    method: 'get',
    path: usersEndpoints.list,
    handler: ({ query }) => {
      const search = normalizeSearch(query.search);
      return mockUsers
        .filter(
          (user) =>
            !search ||
            user.username.toLowerCase().includes(search) ||
            user.displayName.toLowerCase().includes(search),
        )
        .map(toUserSummary);
    },
  },
  {
    method: 'get',
    path: '/users/:userId',
    handler: ({ params }) => {
      const user = findMockUser(params.userId ?? '');
      if (!user) throw new MockHttpError(404, 'User not found');
      return user;
    },
  },
  { method: 'get', path: usersEndpoints.fanLists, handler: () => mockFanLists },
];
