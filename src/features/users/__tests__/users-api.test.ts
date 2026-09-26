import { failureStatus, installTestMocks } from '@test/test-utils';

import { fetchFanLists, fetchUser, fetchUsers } from '../api/queries';
import { mockFanLists, mockUsers, TEST_USER_IDS, USER_COUNT } from '../mocks/users-data';
import { UserProfileSchema } from '../types/user';

beforeAll(installTestMocks);

describe('users mock data', () => {
  it('generates valid, unique users plus the error test user', () => {
    expect(mockUsers).toHaveLength(USER_COUNT + 1);
    for (const user of mockUsers) expect(UserProfileSchema.safeParse(user).success).toBe(true);
    expect(new Set(mockUsers.map((user) => user.username)).size).toBe(USER_COUNT + 1);
    expect(mockUsers[0]?.id).toBe(TEST_USER_IDS.sendError);
  });

  it('only references existing users in fan lists', () => {
    const ids = new Set(mockUsers.map((user) => user.id));
    for (const list of mockFanLists) {
      expect(list.memberIds.every((id) => ids.has(id))).toBe(true);
      expect(list.fansCount).toBe(list.memberIds.length);
    }
  });
});

describe('users API (mocked)', () => {
  it('lists every user without a search', async () => {
    expect(await fetchUsers('')).toHaveLength(USER_COUNT + 1);
  });

  it('searches by username, @username and display name, case-insensitively', async () => {
    const [byUsername, byHandle, byName] = await Promise.all([
      fetchUsers('ETHAN_SHOOTS'),
      fetchUsers('@ethan_'),
      fetchUsers('ethan shoots'),
    ]);
    for (const result of [byUsername, byHandle, byName]) {
      expect(result.map((user) => user.username)).toContain('ethan_shoots');
    }
  });

  it('returns an empty list when nothing matches', async () => {
    expect(await fetchUsers('zzz-nobody')).toEqual([]);
  });

  it('returns a full profile', async () => {
    const user = await fetchUser('u_1');
    expect(user.displayName).toBe('Ethan Shoots');
    expect(user.bio.length).toBeGreaterThan(0);
  });

  it('rejects unknown users with 404', async () => {
    expect(await failureStatus(fetchUser('u_404'))).toBe(404);
  });

  it('returns fan lists', async () => {
    expect(await fetchFanLists()).toHaveLength(mockFanLists.length);
  });
});
