import { create } from 'zustand';

type BillingSession = {
  /** Purchaser id from the store SDK; `null` until the provider is initialised. */
  appUserId: string | null;
  initError: string | null;
};

export const useBillingSession = create<BillingSession>()(() => ({
  appUserId: null,
  initError: null,
}));
