import { z } from 'zod';

export const FanListSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fansCount: z.number().int().nonnegative(),
  memberIds: z.array(z.string()),
});

export const FanListListSchema = z.array(FanListSchema);

export type FanList = z.infer<typeof FanListSchema>;
