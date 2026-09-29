import { LogBox } from 'react-native';
import Purchases, {
  type CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type PurchasesPackage,
  type PurchasesStoreTransaction,
} from 'react-native-purchases';

import { RC_ENTITLEMENT_ID, RC_OFFERING_ID } from '../constants';
import type { Product } from '../types/product';
import type { Receipt } from '../types/receipt';
import type { BillingProvider } from './billing-provider';

/**
 * RevenueCat with a `test_…` SDK key = RevenueCat Test Store: real SDK, real paywall from the
 * dashboard (same project/config as carboai-mobile), simulated payment sheet, no charges.
 */
let configured = false;

async function defaultPackage(): Promise<PurchasesPackage | null> {
  const offerings = await Purchases.getOfferings();
  const offering = offerings.all[RC_OFFERING_ID] ?? offerings.current;
  if (!offering) return null;
  return offering.monthly ?? offering.availablePackages[0] ?? null;
}

export function receiptFromTransaction(transaction: PurchasesStoreTransaction): Receipt {
  return {
    transactionId: transaction.transactionIdentifier,
    productId: transaction.productIdentifier,
    store: 'rc_test_store',
    purchasedAt: new Date(transaction.purchaseDate).toISOString(),
  };
}

/** Receipts for everything the store says this customer owns (used by Restore). */
export function receiptsFromCustomerInfo(info: CustomerInfo): Receipt[] {
  const entitlement = info.entitlements.all[RC_ENTITLEMENT_ID];
  if (!entitlement) return [];
  const subscription = info.subscriptionsByProductIdentifier[entitlement.productIdentifier];
  const transactionId =
    subscription?.storeTransactionId ??
    `${entitlement.productIdentifier}_${entitlement.originalPurchaseDateMillis}`;
  return [
    {
      transactionId,
      productId: entitlement.productIdentifier,
      store: 'rc_test_store',
      purchasedAt: new Date(entitlement.latestPurchaseDateMillis).toISOString(),
    },
  ];
}

function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return 'The store could not complete the purchase.';
}

function isCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { code, userCancelled } = error as { code?: unknown; userCancelled?: unknown };
  return userCancelled === true || code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export function createRevenueCatStore(apiKey: string): BillingProvider {
  const isTestStore = apiKey.startsWith('test_');
  return {
    kind: 'rc_test_store',
    label: isTestStore
      ? 'Simulated billing · RevenueCat Test Store · no real charges'
      : 'RevenueCat sandbox',
    hasNativePaywall: true,
    managesSubscriptionInApp: isTestStore,

    async init() {
      if (configured) return;
      await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.INFO : LOG_LEVEL.WARN);
      // Expected in the Test Store (key notice, simulated failures, paywall image prefetch cancellations);
      // the app shows its own message for these, so keep them out of the dev overlay.
      LogBox.ignoreLogs([
        '[RevenueCat] [Test Store]',
        '[RevenueCat] Error: Error loading image',
        'Using a Test Store API key',
        'Purchases delegate has already been configured',
      ]);
      Purchases.configure({ apiKey });
      configured = true;
    },

    getAppUserId: () => Purchases.getAppUserID(),

    async getProduct(): Promise<Product | null> {
      const pkg = await defaultPackage();
      if (!pkg) return null;
      const { product } = pkg;
      return {
        id: product.identifier,
        title: product.title,
        description: product.description,
        priceString: product.priceString,
        period: product.subscriptionPeriod === 'P1Y' ? 'year' : 'month',
      };
    },

    async purchase(productId) {
      try {
        const pkg = await defaultPackage();
        if (!pkg || pkg.product.identifier !== productId) {
          return { status: 'failed', message: 'This product is not available right now.' };
        }
        const { transaction } = await Purchases.purchasePackage(pkg);
        return { status: 'purchased', receipt: receiptFromTransaction(transaction) };
      } catch (error) {
        if (isCancelled(error)) return { status: 'cancelled' };
        return { status: 'failed', message: errorMessage(error) };
      }
    },

    async restore() {
      try {
        return {
          status: 'restored',
          receipts: receiptsFromCustomerInfo(await Purchases.restorePurchases()),
        };
      } catch (error) {
        return { status: 'failed', message: errorMessage(error) };
      }
    },

    // The Test Store has no subscription management (nothing to cancel in a real store), so the
    // store-side change is simulated and the webhook forwarded by the caller. With a real key the
    // App Store / Play subscription settings open instead.
    async cancelSubscription() {
      if (isTestStore) return 'cancelled';
      await Purchases.showManageSubscriptions();
      return 'opened-store';
    },

    async resubscribe() {
      if (isTestStore) return 'resubscribed';
      await Purchases.showManageSubscriptions();
      return 'opened-store';
    },
  };
}
