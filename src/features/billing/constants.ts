/** RevenueCat entitlement / offering from the shared dashboard project (same as carboai-mobile). */
export const RC_ENTITLEMENT_ID = 'carboai Unlimited';
export const RC_OFFERING_ID = 'default';

/** Product sold by the built-in simulated store (used when RevenueCat is not available). */
export const SIMULATED_PRODUCT = {
  id: 'fans_premium_monthly',
  title: 'FanSuite Premium',
  description: 'Unlimited voice messages, albums and priority support.',
  priceString: '$4.99',
  period: 'month',
} as const;

/** Poll the backend this often while a purchase is waiting for confirmation (tests lower it). */
export const billingTiming = {
  accessPollMs: 2000,
  /** A store sheet that never answers must not leave the UI spinning forever. */
  storeTimeoutMs: 60_000,
};
