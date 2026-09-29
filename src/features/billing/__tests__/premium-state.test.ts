import type { ReceiptEntry } from '../store/receipt-queue';
import { type Access, NO_ACCESS } from '../types/access';
import { derivePremiumState, hasPremiumAccess } from '../utils/premium-state';

const active: Access = {
  ...NO_ACCESS,
  status: 'active',
  transactionId: 't1',
  willRenew: true,
  expiresAt: '2026-10-27T10:00:00.000Z',
};
const entry = (status: ReceiptEntry['status']): ReceiptEntry => ({
  transactionId: 't2',
  productId: 'p',
  store: 'simulated',
  purchasedAt: '2026-09-27T10:00:00.000Z',
  restored: false,
  status,
  attempts: 0,
  error: status === 'failed' ? 'Purchase belongs to another account' : null,
});
const flags = { isLoading: false, isError: false };

describe('derivePremiumState', () => {
  it('only unlocks with backend-confirmed access', () => {
    expect(hasPremiumAccess(derivePremiumState(active, [], flags))).toBe(true);
    expect(hasPremiumAccess(derivePremiumState(NO_ACCESS, [entry('queued')], flags))).toBe(false);
    expect(
      hasPremiumAccess(
        derivePremiumState({ ...NO_ACCESS, pendingTransactionIds: ['t2'] }, [], flags),
      ),
    ).toBe(false);
  });

  it('shows confirming while a receipt is queued locally or pending on the backend', () => {
    expect(derivePremiumState(NO_ACCESS, [entry('sending')], flags).kind).toBe('confirming');
    expect(
      derivePremiumState({ ...NO_ACCESS, pendingTransactionIds: ['t2'] }, [], flags).kind,
    ).toBe('confirming');
    expect(
      derivePremiumState(undefined, [entry('queued')], { isLoading: true, isError: false }).kind,
    ).toBe('confirming');
  });

  it('keeps active access while another purchase is confirming or was rejected', () => {
    expect(derivePremiumState(active, [entry('queued')], flags)).toMatchObject({
      kind: 'active',
      confirmingAnother: true,
    });
    expect(derivePremiumState(active, [entry('failed')], flags)).toMatchObject({ kind: 'active' });
  });

  it('marks cancelled subscriptions that are still active', () => {
    expect(derivePremiumState({ ...active, willRenew: false }, [], flags)).toMatchObject({
      kind: 'active',
      cancelled: true,
    });
  });

  it('reports rejected receipts, expiry, refunds, loading and offline', () => {
    expect(derivePremiumState(NO_ACCESS, [entry('failed')], flags).kind).toBe('rejected');
    expect(derivePremiumState({ ...NO_ACCESS, status: 'expired' }, [], flags).kind).toBe('expired');
    expect(derivePremiumState({ ...NO_ACCESS, status: 'refunded' }, [], flags).kind).toBe(
      'refunded',
    );
    expect(derivePremiumState(undefined, [], { isLoading: true, isError: false }).kind).toBe(
      'loading',
    );
    expect(derivePremiumState(undefined, [], { isLoading: false, isError: true }).kind).toBe(
      'unavailable',
    );
  });
});
