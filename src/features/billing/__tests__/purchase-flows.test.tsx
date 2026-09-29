import { renderWithQuery } from '@test/test-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { useMockFaults } from '@/lib/mock';

import { purchase, restore, submitReceipt } from '../billing-actions';
import { billingTiming } from '../constants';
import { billingServer } from '../mocks/billing-server';
import {
  simulatedStore,
  simulatedStoreAccount,
  useSimulatedStoreFaults,
} from '../providers/simulated-store';
import { SimplePaywall } from '../screens/simple-paywall';
import { SubscriptionScreen } from '../screens/subscription-screen';
import { useBillingSession } from '../store/billing-session';
import { usePurchaseFlow } from '../store/purchase-flow-store';
import { useReceiptQueue } from '../store/receipt-queue';
import { freshBilling, serverAccess } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useRootNavigationState: () => ({ key: 'root' }),
}));

const PRODUCT = 'fans_premium_monthly';

beforeEach(() => {
  freshBilling();
  jest.clearAllMocks();
});

async function openSubscription() {
  await renderWithQuery(<SubscriptionScreen />);
  await waitFor(() => expect(useBillingSession.getState().appUserId).not.toBeNull());
}

async function becomePremium() {
  await act(async () => {
    await purchase(PRODUCT);
  });
  await screen.findByTestId('status-active', {}, { timeout: 3000 });
}

const notice = () => usePurchaseFlow.getState().notice;

describe('duplicate purchase flows', () => {
  it('runs one store flow for overlapping purchase requests', async () => {
    useSimulatedStoreFaults.getState().set({ sheetDelayMs: 150 });
    const spy = jest.spyOn(simulatedStore, 'purchase');
    await openSubscription();

    // Three requests while the first store sheet is still open (e.g. rapid taps from two buttons).
    const outcomes = await act(async () =>
      Promise.all([purchase(PRODUCT), purchase(PRODUCT), purchase(PRODUCT)]),
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(new Set(outcomes).size).toBe(1); // everyone got the same flow's result
    expect(simulatedStoreAccount.purchases()).toHaveLength(1);
    await waitFor(() => expect(useReceiptQueue.getState().entries).toEqual([]));
    expect(billingServer.effects().receiptsRecorded).toBe(1);
    spy.mockRestore();
  });

  it('disables Subscribe and shows progress while the store sheet is open', async () => {
    useSimulatedStoreFaults.getState().set({ sheetDelayMs: 200 });
    await renderWithQuery(<SimplePaywall />);
    await waitFor(() =>
      expect(screen.getByTestId('subscribe-button').props.accessibilityState.disabled).toBe(false),
    );
    // Start the flow without waiting for it, then inspect the button while the sheet is open.
    let flow: Promise<unknown> = Promise.resolve();
    await act(async () => {
      flow = purchase(PRODUCT);
    });
    expect(screen.getByTestId('subscribe-button')).toHaveTextContent('Waiting for the store…');
    expect(screen.getByTestId('subscribe-button').props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
    await act(async () => {
      await flow;
    });
  });

  it('records repeated submissions of the same receipt once', async () => {
    await openSubscription();
    const receipt = {
      transactionId: 'dup_txn_1',
      productId: PRODUCT,
      store: 'simulated' as const,
      purchasedAt: new Date().toISOString(),
    };
    await act(async () => {
      submitReceipt(receipt, false);
      submitReceipt(receipt, false);
      submitReceipt(receipt, false);
    });
    await screen.findByTestId('status-active', {}, { timeout: 3000 });
    expect(billingServer.effects().receiptsRecorded).toBe(1);
  });
});

describe('store outcomes', () => {
  it('a cancelled store sheet changes nothing and says so', async () => {
    await openSubscription();
    useSimulatedStoreFaults.getState().set({ nextOutcome: 'cancel' });
    await act(async () => {
      await purchase(PRODUCT);
    });
    expect(notice()?.text).toMatch(/Purchase cancelled/);
    expect(screen.getByTestId('status-none')).toBeTruthy();
    expect(billingServer.effects().receiptsRecorded).toBe(0);
  });

  it('a failed purchase shows the error and keeps existing, still-valid access', async () => {
    await openSubscription();
    await becomePremium();

    useSimulatedStoreFaults.getState().set({ nextOutcome: 'fail' });
    await act(async () => {
      await purchase(PRODUCT);
    });

    expect(notice()).toMatchObject({ tone: 'error' });
    expect(screen.getByTestId('billing-notice')).toHaveTextContent(/Payment declined/);
    expect(screen.getByTestId('status-active')).toBeTruthy();
    expect(serverAccess().status).toBe('active');
  });

  it('keeps existing access when a second purchase is rejected by the backend', async () => {
    await openSubscription();
    await becomePremium();
    // A receipt that belongs to another account (409) must not touch current access.
    billingServer.confirmPurchase('someone_else', {
      transactionId: 'foreign',
      productId: PRODUCT,
      store: 'simulated',
      purchasedAt: new Date().toISOString(),
      restored: false,
    });
    await act(async () =>
      submitReceipt(
        {
          transactionId: 'foreign',
          productId: PRODUCT,
          store: 'simulated',
          purchasedAt: new Date().toISOString(),
        },
        false,
      ),
    );
    await waitFor(() => expect(useReceiptQueue.getState().entries[0]?.status).toBe('failed'));
    expect(screen.getByTestId('status-active')).toBeTruthy();
    expect(serverAccess().status).toBe('active');
  });
});

describe('restore', () => {
  it('restores a purchase made on another device', async () => {
    const other = simulatedStoreAccount.addPurchaseFromAnotherDevice();
    billingServer.confirmPurchase('another-device', { ...other, restored: false });
    billingServer.confirmPendingNow();
    await openSubscription();
    await screen.findByTestId('status-none');

    await fireEvent.press(screen.getByTestId('restore-button'));
    expect(await screen.findByTestId('status-active', {}, { timeout: 3000 })).toBeTruthy();
    expect(billingServer.access('another-device').status).toBe('none'); // transferred
    expect(billingServer.effects().receiptsRecorded).toBe(1);
  });

  it('says when there is nothing to restore', async () => {
    await openSubscription();
    await act(async () => {
      await restore();
    });
    expect(notice()?.text).toMatch(/No previous purchases/);
    expect(screen.getByTestId('status-none')).toBeTruthy();
  });

  it('restores after a reinstall (new app user id, same store account)', async () => {
    await openSubscription();
    await becomePremium();
    simulatedStoreAccount.reinstall();
    const newUserId = await simulatedStore.getAppUserId();
    await act(async () => useBillingSession.setState({ appUserId: newUserId }));
    await screen.findByTestId('status-none', {}, { timeout: 3000 });

    await act(async () => {
      await restore();
    });
    expect(await screen.findByTestId('status-active', {}, { timeout: 3000 })).toBeTruthy();
  });
});

describe('subscription lifecycle', () => {
  it('cancels auto-renew but keeps access until the period ends, then resumes', async () => {
    await openSubscription();
    await becomePremium();

    await fireEvent.press(screen.getByTestId('cancel-subscription-button'));
    await fireEvent.press(screen.getByTestId('confirm-cancel-button'));
    await waitFor(() =>
      expect(screen.getAllByTestId('premium-badge')[0]).toHaveTextContent('Premium · cancelled'),
    );
    expect(screen.getByTestId('status-active')).toHaveTextContent(/Active until/);
    expect(serverAccess()).toMatchObject({ status: 'active', willRenew: false });

    await fireEvent.press(screen.getByTestId('resubscribe-button'));
    await waitFor(() =>
      expect(screen.getAllByTestId('premium-badge')[0]).toHaveTextContent('Premium · active'),
    );
    expect(serverAccess().willRenew).toBe(true);
  });

  it('a refund removes access; replayed refund events have no extra effect', async () => {
    const { client } = await (async () => {
      const result = await renderWithQuery(<SubscriptionScreen />);
      await waitFor(() => expect(useBillingSession.getState().appUserId).not.toBeNull());
      return result;
    })();
    await becomePremium();
    const appUserId = useBillingSession.getState().appUserId ?? '';
    const transactionId = billingServer.latestTransactionId(appUserId) ?? '';

    await act(async () =>
      usePurchaseFlow.getState().setNotice({ tone: 'success', text: 'Auto-renew is back on.' }),
    );

    const event = { eventId: 'evt_refund_0001', type: 'REFUND', transactionId } as const;
    for (let i = 0; i < 3; i += 1) billingServer.applyStoreEvent(appUserId, event);
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['billing'] });
    });

    expect(await screen.findByTestId('status-refunded')).toBeTruthy();
    expect(billingServer.effects().eventsApplied).toBe(1);
    // The last flow's message would contradict the refund, so it is cleared.
    expect(notice()).toBeNull();
  });
});

describe('store that never answers', () => {
  it('times out, explains it, and frees the UI for another attempt', async () => {
    billingTiming.storeTimeoutMs = 50;
    const spy = jest
      .spyOn(simulatedStore, 'purchase')
      .mockReturnValueOnce(new Promise(() => undefined));
    await openSubscription();

    const outcome = await act(async () => purchase(PRODUCT));
    expect(outcome).toMatchObject({ status: 'failed' });
    expect(notice()).toMatchObject({ tone: 'error' });
    expect(usePurchaseFlow.getState().busy).toBeNull();
    expect(billingServer.effects().receiptsRecorded).toBe(0);

    // The next attempt works normally.
    await becomePremium();
    spy.mockRestore();
    billingTiming.storeTimeoutMs = 60_000;
  });
});

describe('network trouble', () => {
  it('queues a purchase made offline and confirms it after reconnecting', async () => {
    await openSubscription();
    await screen.findByTestId('status-none');
    await act(async () => useMockFaults.getState().set({ offline: true }));

    await act(async () => {
      await purchase(PRODUCT);
    });
    expect(useReceiptQueue.getState().entries).toEqual([
      expect.objectContaining({ status: 'queued' }),
    ]);
    expect(screen.getByTestId('status-confirming')).toBeTruthy();
    expect(billingServer.effects().receiptsRecorded).toBe(0);

    await act(async () => useMockFaults.getState().set({ offline: false }));
    expect(await screen.findByTestId('status-active', {}, { timeout: 3000 })).toBeTruthy();
    expect(billingServer.effects().receiptsRecorded).toBe(1);
  });

  it('a lost confirmation response is retried without a duplicate record', async () => {
    await openSubscription();
    await screen.findByTestId('status-none');
    useMockFaults.getState().set({ loseResponses: 1 });
    await act(async () => {
      await purchase(PRODUCT);
    });
    expect(await screen.findByTestId('status-active', {}, { timeout: 3000 })).toBeTruthy();
    expect(billingServer.effects().receiptsRecorded).toBe(1);
  });
});
