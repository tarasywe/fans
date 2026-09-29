import { renderWithQuery } from '@test/test-utils';
import { act, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { links } from '@/config/links';
import { useMockFaults } from '@/lib/mock';

import { purchase } from '../billing-actions';
import { ColdStartPaywall, resetColdStartPaywall } from '../cold-start-paywall';
import { billingServer } from '../mocks/billing-server';
import { simulatedStore, simulatedStoreAccount } from '../providers/simulated-store';
import { SubscriptionScreen } from '../screens/subscription-screen';
import { useBillingSession } from '../store/billing-session';
import { useReceiptQueue } from '../store/receipt-queue';
import { freshBilling } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useRootNavigationState: () => ({ key: 'root' }),
}));

beforeEach(() => {
  freshBilling();
  jest.clearAllMocks();
});

/** Force-stop: memory gone, every store reloads from its own on-device storage. */
function simulateBillingRestart() {
  useReceiptQueue.setState({ entries: [] });
  useReceiptQueue.getState().rehydrate();
  billingServer.reload();
  simulatedStoreAccount.reload();
  useBillingSession.setState({ appUserId: null });
  resetColdStartPaywall();
}

describe('app restart during confirmation', () => {
  it('keeps a receipt that never reached the backend and confirms it after restart', async () => {
    const first = await renderWithQuery(<SubscriptionScreen />);
    await waitFor(() => expect(useBillingSession.getState().appUserId).not.toBeNull());
    await act(async () => useMockFaults.getState().set({ offline: true }));
    await act(async () => {
      await purchase('fans_premium_monthly');
    });
    expect(useReceiptQueue.getState().entries).toHaveLength(1);

    await first.unmount();
    simulateBillingRestart();
    expect(useReceiptQueue.getState().entries).toEqual([
      expect.objectContaining({ status: 'queued' }),
    ]);

    useMockFaults.getState().set({ offline: false });
    await renderWithQuery(<SubscriptionScreen />);
    expect(await screen.findByTestId('status-active', {}, { timeout: 3000 })).toBeTruthy();
    expect(billingServer.effects().receiptsRecorded).toBe(1);
  });

  it('re-sends a confirmation that was in flight when the app died, without duplicating it', async () => {
    const { enqueue, markSending } = useReceiptQueue.getState();
    const receipt = {
      transactionId: 'inflight_1',
      productId: 'fans_premium_monthly',
      store: 'simulated' as const,
      purchasedAt: new Date().toISOString(),
    };
    enqueue(receipt, false);
    markSending(receipt.transactionId);
    // The backend received it; the response never came back before the app died.
    const appUserId = await simulatedStore.getAppUserId();
    billingServer.confirmPurchase(appUserId, { ...receipt, restored: false });

    simulateBillingRestart();
    expect(useReceiptQueue.getState().entries[0]?.status).toBe('queued');
    await renderWithQuery(<SubscriptionScreen />);
    expect(await screen.findByTestId('status-active', {}, { timeout: 3000 })).toBeTruthy();
    expect(billingServer.effects().receiptsRecorded).toBe(1);
  });
});

describe('cold-start paywall', () => {
  it('opens the paywall once per cold start for users without access', async () => {
    const first = await renderWithQuery(<ColdStartPaywall />);
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(links.paywall));
    await first.unmount();

    // Same launch (e.g. navigating around): not shown again.
    await renderWithQuery(<ColdStartPaywall />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it('shows it again on the next cold start', async () => {
    const first = await renderWithQuery(<ColdStartPaywall />);
    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    await first.unmount();
    simulateBillingRestart();
    await renderWithQuery(<ColdStartPaywall />);
    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(2));
  });

  it('does not show it to premium users or while a purchase is being confirmed', async () => {
    const setup = await renderWithQuery(<SubscriptionScreen />);
    await waitFor(() => expect(useBillingSession.getState().appUserId).not.toBeNull());
    await act(async () => {
      await purchase('fans_premium_monthly');
    });
    await screen.findByTestId('status-active', {}, { timeout: 3000 });
    await setup.unmount();

    resetColdStartPaywall();
    await renderWithQuery(<ColdStartPaywall />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(router.push).not.toHaveBeenCalled();

    billingServer.setConfig({ neverConfirm: true });
    await act(async () =>
      useReceiptQueue.getState().enqueue(
        {
          transactionId: 'pending_2',
          productId: 'x',
          store: 'simulated',
          purchasedAt: new Date().toISOString(),
        },
        false,
      ),
    );
    resetColdStartPaywall();
    await renderWithQuery(<ColdStartPaywall />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(router.push).not.toHaveBeenCalled();
  });

  it('does not show it while the status is unknown (offline, nothing cached)', async () => {
    useMockFaults.getState().set({ offline: true });
    await renderWithQuery(<ColdStartPaywall />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(router.push).not.toHaveBeenCalled();
  });
});
