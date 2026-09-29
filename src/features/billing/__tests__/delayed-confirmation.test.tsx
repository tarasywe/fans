import { renderWithQuery } from '@test/test-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { links } from '@/config/links';

import { purchase } from '../billing-actions';
import { billingServer } from '../mocks/billing-server';
import { SimplePaywall } from '../screens/simple-paywall';
import { SubscriptionScreen } from '../screens/subscription-screen';
import { useReceiptQueue } from '../store/receipt-queue';
import { freshBilling, serverAccess, sleep } from './helpers';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useRootNavigationState: () => ({ key: 'root' }),
}));

const CONFIRM_DELAY_MS = 600;

beforeEach(() => {
  freshBilling({ confirmDelayMs: CONFIRM_DELAY_MS });
  jest.clearAllMocks();
});

/**
 * Required: a purchase that succeeds in the store while the backend has not confirmed it yet.
 * The UI must say so honestly, and premium must unlock only once the backend confirms.
 */
it('shows a succeeded purchase as "confirming" and grants access only after backend confirmation', async () => {
  await renderWithQuery(
    <>
      <SimplePaywall />
      <SubscriptionScreen />
    </>,
  );
  await screen.findByTestId('status-none');
  await waitFor(() =>
    expect(screen.getByTestId('subscribe-button').props.accessibilityState.disabled).toBe(false),
  );

  await fireEvent.press(screen.getByTestId('subscribe-button'));
  expect(router.replace).toHaveBeenCalledWith(links.subscription);

  // Store succeeded; the backend received the receipt but has not confirmed it.
  await screen.findByTestId('status-confirming');
  expect(screen.getAllByTestId('premium-badge')[0]).toHaveTextContent(
    'Payment received · not confirmed yet',
  );
  expect(screen.queryByTestId('status-active')).toBeNull();
  expect(serverAccess()).toMatchObject({ status: 'none' });
  expect(serverAccess().pendingTransactionIds).toHaveLength(1);
  // The paywall no longer offers a second purchase while this one is confirming.
  expect(screen.queryByTestId('subscribe-button')).toBeNull();
  expect(screen.getByTestId('paywall-view-status')).toBeTruthy();

  // Still unconfirmed half-way through the backend delay.
  await act(() => sleep(CONFIRM_DELAY_MS / 2));
  expect(screen.getByTestId('status-confirming')).toBeTruthy();

  // Access appears only once the backend confirms (the screen polls while pending).
  expect(await screen.findByTestId('status-active', {}, { timeout: 3000 })).toBeTruthy();
  expect(screen.getAllByTestId('premium-badge')[0]).toHaveTextContent('Premium · active');
  // The "waiting for the server" notice is replaced, so the page never contradicts itself.
  expect(screen.getAllByTestId('billing-notice')[0]).toHaveTextContent(/Confirmed by the server/);
  expect(serverAccess()).toMatchObject({ status: 'active', pendingTransactionIds: [] });
  expect(useReceiptQueue.getState().entries).toEqual([]);
  expect(billingServer.effects().receiptsRecorded).toBe(1);
});

it('stays honestly "confirming" (no access) when confirmation never arrives', async () => {
  billingServer.setConfig({ neverConfirm: true });
  await renderWithQuery(<SubscriptionScreen />);
  await screen.findByTestId('status-none');
  await act(async () => {
    await purchase('fans_premium_monthly');
  });

  await screen.findByTestId('status-confirming');
  await act(() => sleep(300));
  expect(screen.getByTestId('status-confirming')).toBeTruthy();
  expect(screen.queryByTestId('status-active')).toBeNull();

  // Support / backend completes verification later → access appears.
  billingServer.confirmPendingNow();
  expect(await screen.findByTestId('status-active', {}, { timeout: 3000 })).toBeTruthy();
});
