import { createKvStorage, readJson, writeJson } from '@/lib/storage/kv-storage';

import type { Access } from '../types/access';
import type { ConfirmPurchaseInput } from '../types/receipt';
import type { StoreEventInput } from '../types/store-event';

/**
 * The mock *backend's* billing database (its own MMKV instance, separate from the client and from
 * the simulated store). It never trusts a purchase result on arrival: a receipt is recorded as
 * unconfirmed and only grants access once "verification" completes after `confirmDelayMs` —
 * standing in for server-side receipt validation / a store webhook.
 */
const storage = createKvStorage('fans-mock-billing-server');
const KEY = 'billing-v1';
const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

type PurchaseRecord = {
  transactionId: string;
  appUserId: string;
  productId: string;
  receivedAt: number;
  /** null → verification never completes (fault injection). */
  confirmAt: number | null;
  expiresAt: number | null;
  willRenew: boolean;
  refundedAt: number | null;
  expiredEarly: boolean;
};

export type BillingServerConfig = {
  /** How long "verification" takes after a receipt arrives. */
  confirmDelayMs: number;
  /** When true, receipts are recorded but never confirmed. */
  neverConfirm: boolean;
};

type State = {
  purchases: PurchaseRecord[];
  processedEventIds: string[];
  config: BillingServerConfig;
  /** Counts of side effects, so tests can prove repeated calls change nothing. */
  effects: { receiptsRecorded: number; eventsApplied: number };
};

export const DEFAULT_BILLING_CONFIG: BillingServerConfig = {
  confirmDelayMs: process.env.NODE_ENV === 'test' ? 0 : 4000,
  neverConfirm: false,
};

function empty(): State {
  return {
    purchases: [],
    processedEventIds: [],
    config: DEFAULT_BILLING_CONFIG,
    effects: { receiptsRecorded: 0, eventsApplied: 0 },
  };
}

let state: State = readJson<State>(storage, KEY) ?? empty();
const save = () => writeJson(storage, KEY, state);

export class BillingServerError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function isConfirmed(record: PurchaseRecord, now: number) {
  return record.confirmAt !== null && record.confirmAt <= now;
}

/** Access for one user, derived only from confirmed server-side records. */
export function computeAccess(appUserId: string, now = Date.now()): Access {
  const mine = state.purchases.filter((record) => record.appUserId === appUserId);
  const confirmed = mine
    .filter((record) => isConfirmed(record, now))
    .sort((a, b) => (b.confirmAt ?? 0) - (a.confirmAt ?? 0));
  const pendingTransactionIds = mine
    .filter((record) => !isConfirmed(record, now) && record.refundedAt === null)
    .map((record) => record.transactionId);

  const valid = confirmed.find(
    (record) => record.refundedAt === null && !record.expiredEarly && (record.expiresAt ?? 0) > now,
  );
  const latest = valid ?? confirmed[0];
  const updatedAt = new Date(now).toISOString();

  if (!latest) {
    return {
      status: 'none',
      productId: null,
      transactionId: null,
      expiresAt: null,
      willRenew: false,
      pendingTransactionIds,
      updatedAt,
    };
  }
  const status = valid ? 'active' : latest.refundedAt !== null ? 'refunded' : 'expired';
  return {
    status,
    productId: latest.productId,
    transactionId: latest.transactionId,
    expiresAt: latest.expiresAt ? new Date(latest.expiresAt).toISOString() : null,
    willRenew: status === 'active' && latest.willRenew,
    pendingTransactionIds,
    updatedAt,
  };
}

/** Materialises confirmations whose verification delay has passed (lazy, on each request). */
function settle(now: number) {
  let changed = false;
  for (const record of state.purchases) {
    if (isConfirmed(record, now) && record.expiresAt === null) {
      record.expiresAt = (record.confirmAt ?? now) + PERIOD_MS;
      changed = true;
    }
  }
  if (changed) save();
}

export const billingServer = {
  access(appUserId: string, now = Date.now()): Access {
    settle(now);
    return computeAccess(appUserId, now);
  },

  /**
   * Records a receipt. Idempotent by transaction id: a repeated confirmation returns the same
   * state and records nothing new. A restore from another app user id transfers the purchase
   * (RevenueCat's default "transfer" behaviour).
   */
  confirmPurchase(appUserId: string, input: ConfirmPurchaseInput, now = Date.now()): Access {
    settle(now);
    const existing = state.purchases.find((record) => record.transactionId === input.transactionId);
    if (existing) {
      if (existing.appUserId !== appUserId) {
        if (!input.restored)
          throw new BillingServerError(409, 'Purchase belongs to another account');
        existing.appUserId = appUserId;
        save();
      }
      return computeAccess(appUserId, now);
    }
    const { confirmDelayMs, neverConfirm } = state.config;
    state.purchases.push({
      transactionId: input.transactionId,
      appUserId,
      productId: input.productId,
      receivedAt: now,
      confirmAt: neverConfirm ? null : now + confirmDelayMs,
      expiresAt: null,
      willRenew: true,
      refundedAt: null,
      expiredEarly: false,
    });
    state.effects.receiptsRecorded += 1;
    save();
    settle(now);
    return computeAccess(appUserId, now);
  },

  /** Store lifecycle events. Idempotent by event id. */
  applyStoreEvent(appUserId: string, event: StoreEventInput, now = Date.now()): Access {
    settle(now);
    if (state.processedEventIds.includes(event.eventId)) return computeAccess(appUserId, now);
    const record = state.purchases.find((item) => item.transactionId === event.transactionId);
    if (!record) throw new BillingServerError(404, 'Unknown transaction');

    if (event.type === 'CANCELLATION') record.willRenew = false;
    if (event.type === 'UNCANCELLATION') record.willRenew = true;
    if (event.type === 'EXPIRATION') {
      record.expiredEarly = true;
      record.willRenew = false;
    }
    if (event.type === 'REFUND') {
      record.refundedAt = now;
      record.willRenew = false;
    }
    state.processedEventIds.push(event.eventId);
    state.effects.eventsApplied += 1;
    save();
    return computeAccess(appUserId, now);
  },

  /** Latest purchase record of a user (for the lab's store-event buttons). */
  latestTransactionId(appUserId: string): string | null {
    const mine = state.purchases.filter((record) => record.appUserId === appUserId);
    return mine.at(-1)?.transactionId ?? null;
  },

  /** Forces pending confirmations to complete now (lab: "Confirm now"). */
  confirmPendingNow(now = Date.now()) {
    for (const record of state.purchases) {
      if (!isConfirmed(record, now) && record.refundedAt === null) record.confirmAt = now;
    }
    save();
    settle(now);
  },

  config: (): BillingServerConfig => state.config,
  setConfig(config: Partial<BillingServerConfig>) {
    state.config = { ...state.config, ...config };
    save();
  },
  effects: () => ({ ...state.effects }),
  reload: () => {
    state = readJson<State>(storage, KEY) ?? empty();
  },
  reset: () => {
    state = empty();
    save();
  },
};
