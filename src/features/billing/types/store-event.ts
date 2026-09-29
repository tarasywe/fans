import { z } from 'zod';

/**
 * Store-side lifecycle events. In production these arrive at the backend as store / RevenueCat
 * webhooks; here the app posts them to simulate that. Idempotent by `eventId`.
 */
export const StoreEventTypeSchema = z.enum([
  'CANCELLATION',
  'UNCANCELLATION',
  'EXPIRATION',
  'REFUND',
]);

export const StoreEventInputSchema = z.object({
  eventId: z.string().min(8).max(64),
  type: StoreEventTypeSchema,
  transactionId: z.string().min(1),
});

export type StoreEventType = z.infer<typeof StoreEventTypeSchema>;
export type StoreEventInput = z.infer<typeof StoreEventInputSchema>;
