import { z } from 'zod';

/**
 * Paid access as confirmed by the backend. This — never a store purchase result — decides
 * whether premium features are unlocked.
 *
 * - none: never had access
 * - active: confirmed and not expired (`willRenew=false` → cancelled, active until `expiresAt`)
 * - expired / refunded: had access, no longer
 * `pendingTransactionIds` lists purchases the backend received but has not confirmed yet; they
 * never grant access on their own.
 */
export const AccessStatusSchema = z.enum(['none', 'active', 'expired', 'refunded']);

export const AccessSchema = z.object({
  status: AccessStatusSchema,
  productId: z.string().nullable(),
  /** Transaction behind the current/latest access (used for cancellation and refunds). */
  transactionId: z.string().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  willRenew: z.boolean(),
  pendingTransactionIds: z.array(z.string()),
  updatedAt: z.iso.datetime(),
});

export type AccessStatus = z.infer<typeof AccessStatusSchema>;
export type Access = z.infer<typeof AccessSchema>;

export const NO_ACCESS: Access = {
  status: 'none',
  productId: null,
  transactionId: null,
  expiresAt: null,
  willRenew: false,
  pendingTransactionIds: [],
  updatedAt: new Date(0).toISOString(),
};
