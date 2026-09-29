export const billingEndpoints = {
  access: '/billing/access',
  purchases: '/billing/purchases',
  storeEvents: '/billing/store-events',
} as const;

/** Identifies the purchaser (RevenueCat app user id or the simulated store's install id). */
export const APP_USER_ID_HEADER = 'x-app-user-id';
