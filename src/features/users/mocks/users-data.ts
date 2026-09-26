import { CURRENT_USER_ID } from '@/config/session';
import { createRandom, paragraph } from '@/lib/mock';

import type { FanList } from '../types/fan-list';
import type { UserProfile } from '../types/user';

const FIRST_NAMES = [
  'Ethan',
  'Olivia',
  'Liam',
  'Emma',
  'Noah',
  'Ava',
  'Mason',
  'Sophia',
  'Lucas',
  'Mia',
  'Logan',
  'Isabella',
  'James',
  'Amelia',
  'Aiden',
  'Harper',
  'Elijah',
  'Evelyn',
  'Oliver',
  'Abigail',
  'Jacob',
  'Emily',
  'Daniel',
  'Ella',
  'Henry',
  'Scarlett',
  'Jack',
  'Grace',
  'Leo',
  'Chloe',
];
const LAST_NAMES = [
  'Shoots',
  'Rivera',
  'Carter',
  'Brooks',
  'Hayes',
  'Foster',
  'Reed',
  'Bennett',
  'Coleman',
  'Price',
  'Sanders',
  'Ward',
  'Morgan',
  'Kelly',
  'Howard',
  'Cooper',
  'Perry',
  'Long',
  'Butler',
  'Barnes',
];
const LOCATIONS = [
  'Austin, Texas, US',
  'Lviv, Ukraine',
  'Berlin, Germany',
  'Toronto, Canada',
  'Lisbon, Portugal',
  null,
];
const PREFERENCES = [
  'Custom videos, behind the scenes',
  'Fitness tips',
  'Live streams',
  null,
  null,
];
const FAN_CLUBS = ['FanSuite Name', 'Gold Circle', 'Early Supporters'];
const DAY_MS = 86_400_000;

export const USER_COUNT = 30;

function buildUsers(): UserProfile[] {
  const random = createRandom(42);
  const now = Date.now();

  return Array.from({ length: USER_COUNT }, (_, index) => {
    const first = FIRST_NAMES[index % FIRST_NAMES.length] ?? 'Fan';
    const last = LAST_NAMES[index % LAST_NAMES.length] ?? 'User';
    const lastOnlineAt = now - random.int(1, 60 * 24 * 7) * 60_000;

    return {
      id: `u_${index + 1}`,
      displayName: `${first} ${last}`,
      username: `${first}_${last}`.toLowerCase(),
      avatarUrl: null,
      isVerified: random.chance(0.6),
      isOnline: random.chance(0.35),
      bio: `${first} is a ${random.int(19, 45)}-year-old fan. ${paragraph(random, 2, 3)}`,
      location: random.pick(LOCATIONS),
      preferences: random.pick(PREFERENCES),
      fanOf: {
        name: random.pick(FAN_CLUBS),
        since: new Date(now - random.int(10, 700) * DAY_MS).toISOString(),
      },
      rebill: random.chance(0.7),
      lastOnlineAt: new Date(lastOnlineAt).toISOString(),
      lastResponseAt: random.chance(0.85)
        ? new Date(lastOnlineAt - random.int(1, 60 * 24 * 30) * 60_000).toISOString()
        : null,
    };
  });
}

export const mockCurrentUser: UserProfile = {
  id: CURRENT_USER_ID,
  displayName: 'FanSuite Creator',
  username: 'fansuite_creator',
  avatarUrl: null,
  isVerified: true,
  isOnline: true,
  bio: 'Creator account.',
  location: null,
  preferences: null,
  fanOf: { name: 'FanSuite Name', since: new Date(0).toISOString() },
  rebill: false,
  lastOnlineAt: new Date(0).toISOString(),
  lastResponseAt: null,
};

/**
 * Same id as the backend (fans-backend) error test user. The backend's slow-send test user is
 * intentionally not mocked: slow networks are tested against the real API only.
 */
export const TEST_USER_IDS = { sendError: 'u_test_error' } as const;

function testUser(id: string, displayName: string, username: string, bio: string): UserProfile {
  return {
    ...mockCurrentUser,
    id,
    displayName,
    username,
    isVerified: false,
    bio,
    lastOnlineAt: new Date().toISOString(),
  };
}

export const mockUsers: readonly UserProfile[] = [
  testUser(
    TEST_USER_IDS.sendError,
    'Test: send fails (500)',
    'test_send_error',
    'Every message sent to this chat is rejected with HTTP 500.',
  ),
  ...buildUsers(),
];

export const mockFanLists: readonly FanList[] = [
  { id: 'fl_1', name: 'Top Supporters', memberIds: ['u_1', 'u_2', 'u_3', 'u_4'], fansCount: 4 },
  { id: 'fl_2', name: 'New Subscribers', memberIds: ['u_5', 'u_6', 'u_7'], fansCount: 3 },
  {
    id: 'fl_3',
    name: 'Rebill On',
    memberIds: ['u_8', 'u_9', 'u_10', 'u_11', 'u_12'],
    fansCount: 5,
  },
];

export function toUserSummary(user: UserProfile) {
  const { id, displayName, username, avatarUrl, isVerified, isOnline } = user;
  return { id, displayName, username, avatarUrl, isVerified, isOnline };
}

export function findMockUser(userId: string): UserProfile | undefined {
  return userId === CURRENT_USER_ID
    ? mockCurrentUser
    : mockUsers.find((user) => user.id === userId);
}
