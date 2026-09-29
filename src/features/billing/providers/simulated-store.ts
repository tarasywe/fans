import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createKvStorage, readJson, writeJson, zustandStorage } from '@/lib/storage/kv-storage';

import { SIMULATED_PRODUCT } from '../constants';
import type { Receipt } from '../types/receipt';
import type { BillingProvider } from './billing-provider';

/** What the simulated store sheet does on the next purchase (Network lab). */
export type NextStoreOutcome = 'succeed' | 'fail' | 'cancel';

type StoreFaults = { nextOutcome: NextStoreOutcome; sheetDelayMs: number };

export const useSimulatedStoreFaults = create<
  StoreFaults & { set: (faults: Partial<StoreFaults>) => void }
>()(
  persist(
    (set) => ({
      nextOutcome: 'succeed',
      sheetDelayMs: process.env.NODE_ENV === 'test' ? 0 : 900,
      set: (faults) => set(faults),
    }),
    {
      name: 'store-faults',
      storage: zustandStorage(createKvStorage('fans-dev-tools')),
      partialize: ({ nextOutcome, sheetDelayMs }) => ({ nextOutcome, sheetDelayMs }),
    },
  ),
);

type StorePurchase = Receipt & { autoRenew: boolean };
type StoreState = { appUserId: string; purchases: StorePurchase[]; sequence: number };

/**
 * The simulated app store account (think: the user's Apple ID). Persisted separately from the
 * app's own state and from the mock backend, so purchases survive restarts and can be restored.
 */
const storage = createKvStorage('fans-simulated-store');
const KEY = 'store-v1';

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function load(): StoreState {
  const saved = readJson<StoreState>(storage, KEY);
  if (saved) return saved;
  const fresh: StoreState = {
    appUserId: `sim_${randomId()}${randomId()}`,
    purchases: [],
    sequence: 0,
  };
  writeJson(storage, KEY, fresh);
  return fresh;
}

let state = load();
const save = () => writeJson(storage, KEY, state);
const wait = (ms: number) =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

export const simulatedStoreAccount = {
  purchases: (): StorePurchase[] => state.purchases,
  /** Adds a purchase made "on another device" with the same store account (for Restore). */
  addPurchaseFromAnotherDevice(): StorePurchase {
    state.sequence += 1;
    const purchase: StorePurchase = {
      transactionId: `sim_txn_other_${Date.now().toString(36)}_${state.sequence}`,
      productId: SIMULATED_PRODUCT.id,
      store: 'simulated',
      purchasedAt: new Date().toISOString(),
      autoRenew: true,
    };
    state.purchases.push(purchase);
    save();
    return purchase;
  },
  setAutoRenew(transactionId: string, autoRenew: boolean) {
    state.purchases = state.purchases.map((item) =>
      item.transactionId === transactionId ? { ...item, autoRenew } : item,
    );
    save();
  },
  /** Simulates reinstalling the app: new app user id, same store account (purchases kept). */
  reinstall() {
    state = { ...state, appUserId: `sim_${randomId()}${randomId()}` };
    save();
  },
  reload: () => {
    state = load();
  },
  reset: () => {
    storage.clearAll();
    state = load();
  },
};

const toReceipt = ({ transactionId, productId, store, purchasedAt }: StorePurchase): Receipt => ({
  transactionId,
  productId,
  store,
  purchasedAt,
});

/** Built-in simulated store: deterministic, fault-injectable, no network, no real money. */
export const simulatedStore: BillingProvider = {
  kind: 'simulated',
  label: 'Simulated billing · built-in test store · no real charges',
  hasNativePaywall: false,
  managesSubscriptionInApp: true,
  init: async () => undefined,
  getAppUserId: async () => state.appUserId,
  getProduct: async () => ({ ...SIMULATED_PRODUCT }),

  async purchase(productId) {
    const faults = useSimulatedStoreFaults.getState();
    await wait(faults.sheetDelayMs); // the store sheet is on screen
    const outcome = faults.nextOutcome;
    if (outcome !== 'succeed') faults.set({ nextOutcome: 'succeed' }); // one-shot fault
    if (outcome === 'cancel') return { status: 'cancelled' };
    if (outcome === 'fail')
      return { status: 'failed', message: 'Payment declined by the store (simulated).' };

    state.sequence += 1;
    const purchase: StorePurchase = {
      transactionId: `sim_txn_${Date.now().toString(36)}_${state.sequence}`,
      productId,
      store: 'simulated',
      purchasedAt: new Date().toISOString(),
      autoRenew: true,
    };
    state.purchases.push(purchase);
    save();
    return { status: 'purchased', receipt: toReceipt(purchase) };
  },

  async restore() {
    await wait(useSimulatedStoreFaults.getState().sheetDelayMs);
    return { status: 'restored', receipts: state.purchases.map(toReceipt) };
  },

  async cancelSubscription(transactionId) {
    simulatedStoreAccount.setAutoRenew(transactionId, false);
    return 'cancelled';
  },

  async resubscribe(transactionId) {
    simulatedStoreAccount.setAutoRenew(transactionId, true);
    return 'resubscribed';
  },
};
