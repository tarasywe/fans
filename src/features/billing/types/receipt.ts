import { z } from 'zod';

export const StoreKindSchema = z.enum(['rc_test_store', 'simulated']);

/** What the store reports after a successful purchase or restore; sent to the backend to confirm. */
export const ReceiptSchema = z.object({
  /** Store transaction id — the idempotency key for confirmation. */
  transactionId: z.string().min(1).max(128),
  productId: z.string().min(1),
  store: StoreKindSchema,
  purchasedAt: z.iso.datetime(),
});

export const ConfirmPurchaseInputSchema = ReceiptSchema.extend({
  /** true when the receipt comes from "Restore purchases" rather than a new purchase. */
  restored: z.boolean(),
});

export type StoreKind = z.infer<typeof StoreKindSchema>;
export type Receipt = z.infer<typeof ReceiptSchema>;
export type ConfirmPurchaseInput = z.infer<typeof ConfirmPurchaseInputSchema>;
