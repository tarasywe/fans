import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { http } from '@/lib/http/http-client';

import { FanListListSchema } from '../types/fan-list';
import { UserProfileSchema, UserSummaryListSchema } from '../types/user';
import { usersEndpoints } from './endpoints';

export const usersKeys = {
  all: ['users'] as const,
  list: (search: string) => ['users', 'list', search] as const,
  detail: (userId: string) => ['users', 'detail', userId] as const,
  fanLists: ['fan-lists'] as const,
};

export async function fetchUsers(search: string) {
  const { data } = await http.get(usersEndpoints.list, { params: search ? { search } : undefined });
  return UserSummaryListSchema.parse(data);
}

export async function fetchUser(userId: string) {
  const { data } = await http.get(usersEndpoints.detail(userId));
  return UserProfileSchema.parse(data);
}

export async function fetchFanLists() {
  const { data } = await http.get(usersEndpoints.fanLists);
  return FanListListSchema.parse(data);
}

export function useUsersQuery(search: string) {
  return useQuery({
    queryKey: usersKeys.list(search),
    queryFn: () => fetchUsers(search),
    placeholderData: keepPreviousData,
  });
}

export function useUserQuery(userId: string) {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => fetchUser(userId),
    enabled: userId.length > 0,
  });
}

export function useFanListsQuery() {
  return useQuery({ queryKey: usersKeys.fanLists, queryFn: fetchFanLists });
}
