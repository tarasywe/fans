import { billingServer } from '../mocks/billing-server';
import type { ConfirmPurchaseInput } from '../types/receipt';

const USER = 'user_a';
const T0 = Date.UTC(2026, 8, 27, 10, 0, 0);
const DAY = 86_400_000;

const receipt = (transactionId: string, restored = false): ConfirmPurchaseInput => ({
  transactionId,
  productId: 'fans_premium_monthly',
  store: 'simulated',
  purchasedAt: new Date(T0).toISOString(),
  restored,
});

beforeEach(() => {
  billingServer.reset();
  billingServer.setConfig({ confirmDelayMs: 5000, neverConfirm: false });
});

describe('purchase confirmation', () => {
  it('records a receipt as pending and grants no access until it is confirmed', () => {
    const pending = billingServer.confirmPurchase(USER, receipt('t1'), T0);
    expect(pending).toMatchObject({ status: 'none', pendingTransactionIds: ['t1'] });

    expect(billingServer.access(USER, T0 + 4999).status).toBe('none');

    const confirmed = billingServer.access(USER, T0 + 5000);
    expect(confirmed).toMatchObject({
      status: 'active',
      transactionId: 't1',
      willRenew: true,
      pendingTransactionIds: [],
    });
    expect(Date.parse(confirmed.expiresAt ?? '')).toBe(T0 + 5000 + 30 * DAY);
  });

  it('is idempotent by transaction id: repeated receipts record nothing new', () => {
    billingServer.confirmPurchase(USER, receipt('t1'), T0);
    billingServer.confirmPurchase(USER, receipt('t1'), T0 + 10);
    billingServer.confirmPurchase(USER, receipt('t1'), T0 + 20);
    expect(billingServer.effects().receiptsRecorded).toBe(1);
    expect(billingServer.access(USER, T0 + 6000).pendingTransactionIds).toEqual([]);
  });

  it('keeps receipts pending forever when confirmation never arrives', () => {
    billingServer.setConfig({ neverConfirm: true });
    billingServer.confirmPurchase(USER, receipt('t1'), T0);
    expect(billingServer.access(USER, T0 + 365 * DAY)).toMatchObject({
      status: 'none',
      pendingTransactionIds: ['t1'],
    });
  });

  it('keeps valid access while an unrelated purchase is pending or never confirmed', () => {
    billingServer.confirmPurchase(USER, receipt('t1'), T0);
    billingServer.setConfig({ neverConfirm: true });
    billingServer.confirmPurchase(USER, receipt('t2'), T0 + 6000);
    expect(billingServer.access(USER, T0 + 7000)).toMatchObject({
      status: 'active',
      transactionId: 't1',
      pendingTransactionIds: ['t2'],
    });
  });

  it('keeps access separate per user', () => {
    billingServer.confirmPurchase(USER, receipt('t1'), T0);
    expect(billingServer.access('user_b', T0 + 6000).status).toBe('none');
  });
});

describe('restore', () => {
  it('transfers a purchase owned by another app user id when restoring', () => {
    billingServer.confirmPurchase('old_install', receipt('t1'), T0);
    const restored = billingServer.confirmPurchase(USER, receipt('t1', true), T0 + 6000);
    expect(restored.status).toBe('active');
    expect(billingServer.access('old_install', T0 + 6000).status).toBe('none');
    expect(billingServer.effects().receiptsRecorded).toBe(1);
  });

  it("refuses to take another account's purchase outside a restore", () => {
    billingServer.confirmPurchase('old_install', receipt('t1'), T0);
    expect(() => billingServer.confirmPurchase(USER, receipt('t1'), T0 + 10)).toThrow(
      'another account',
    );
    expect(billingServer.access('old_install', T0 + 6000).status).toBe('active');
  });
});

describe('store events (webhooks)', () => {
  beforeEach(() => {
    billingServer.confirmPurchase(USER, receipt('t1'), T0);
  });

  it('cancellation turns off renewal but keeps access until expiry', () => {
    const access = billingServer.applyStoreEvent(
      USER,
      { eventId: 'evt_cancel_1', type: 'CANCELLATION', transactionId: 't1' },
      T0 + 6000,
    );
    expect(access).toMatchObject({ status: 'active', willRenew: false });
    expect(billingServer.access(USER, T0 + 5000 + 31 * DAY).status).toBe('expired');
  });

  it('uncancellation turns renewal back on', () => {
    billingServer.applyStoreEvent(
      USER,
      { eventId: 'evt_cancel_1', type: 'CANCELLATION', transactionId: 't1' },
      T0 + 6000,
    );
    const access = billingServer.applyStoreEvent(
      USER,
      { eventId: 'evt_resume_1', type: 'UNCANCELLATION', transactionId: 't1' },
      T0 + 7000,
    );
    expect(access.willRenew).toBe(true);
  });

  it('refund removes access immediately', () => {
    const access = billingServer.applyStoreEvent(
      USER,
      { eventId: 'evt_refund_1', type: 'REFUND', transactionId: 't1' },
      T0 + 6000,
    );
    expect(access).toMatchObject({ status: 'refunded', willRenew: false });
  });

  it('expiration removes access', () => {
    expect(
      billingServer.applyStoreEvent(
        USER,
        { eventId: 'evt_exp_1', type: 'EXPIRATION', transactionId: 't1' },
        T0 + 6000,
      ).status,
    ).toBe('expired');
  });

  it('is idempotent by event id: a replayed event has no extra effect', () => {
    const event = { eventId: 'evt_cancel_1', type: 'CANCELLATION', transactionId: 't1' } as const;
    billingServer.applyStoreEvent(USER, event, T0 + 6000);
    billingServer.applyStoreEvent(
      USER,
      { eventId: 'evt_resume_1', type: 'UNCANCELLATION', transactionId: 't1' },
      T0 + 7000,
    );
    // A late duplicate of the old cancellation must not cancel again.
    const access = billingServer.applyStoreEvent(USER, event, T0 + 8000);
    expect(access.willRenew).toBe(true);
    expect(billingServer.effects().eventsApplied).toBe(2);
  });

  it('rejects events for unknown transactions', () => {
    expect(() =>
      billingServer.applyStoreEvent(
        USER,
        { eventId: 'evt_x_1234', type: 'REFUND', transactionId: 'nope' },
        T0,
      ),
    ).toThrow('Unknown transaction');
  });
});

it('survives an app restart (its own storage)', () => {
  billingServer.confirmPurchase(USER, receipt('t1'), T0);
  billingServer.reload();
  expect(billingServer.access(USER, T0 + 6000).status).toBe('active');
});
