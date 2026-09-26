import { z } from 'zod';

export const UserSummarySchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  username: z.string().min(1),
  avatarUrl: z.url().nullable(),
  isVerified: z.boolean(),
  isOnline: z.boolean(),
});

export const UserProfileSchema = UserSummarySchema.extend({
  bio: z.string(),
  location: z.string().nullable(),
  preferences: z.string().nullable(),
  fanOf: z.object({ name: z.string(), since: z.iso.datetime() }),
  rebill: z.boolean(),
  lastOnlineAt: z.iso.datetime(),
  lastResponseAt: z.iso.datetime().nullable(),
});

export const UserSummaryListSchema = z.array(UserSummarySchema);

export type UserSummary = z.infer<typeof UserSummarySchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
