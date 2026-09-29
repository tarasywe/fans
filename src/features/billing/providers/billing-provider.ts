import type { Product } from '../types/product';
import type { Receipt, StoreKind } from '../types/receipt';

/**
 * The *store* side of billing. A successful result here means "the store took the money" — it
 * never grants access by itself; the receipt must be confirmed by the backend first.
 */
export type PurchaseOutcome =
  | { status: 'purchased'; receipt: Receipt }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

export type RestoreOutcome =
  | { status: 'restored'; receipts: Receipt[] }
  | { status: 'failed'; message: string };

export interface BillingProvider {
  kind: StoreKind;
  /** Shown on every billing screen: this is not real billing. */
  label: string;
  /** RevenueCat can render the paywall designed in its dashboard. */
  hasNativePaywall: boolean;
  /** Cancel / resume happen in the app (simulated); otherwise the store's settings open. */
  managesSubscriptionInApp: boolean;
  init(): Promise<void>;
  getAppUserId(): Promise<string>;
  getProduct(): Promise<Product | null>;
  purchase(productId: string): Promise<PurchaseOutcome>;
  restore(): Promise<RestoreOutcome>;
  /**
   * Turns off auto-renew in the store.
   * - 'cancelled': the store-side change happened in this simulation; the caller forwards the
   *   store's webhook to the backend (what the store / RevenueCat would do in production).
   * - 'opened-store': the real store's subscription management was opened; the backend learns
   *   about any change from the store webhook, the app just refreshes.
   */
  cancelSubscription(transactionId: string): Promise<'cancelled' | 'opened-store'>;
  resubscribe(transactionId: string): Promise<'resubscribed' | 'opened-store'>;
}
