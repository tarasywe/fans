import type { ReceiptEntry } from '../store/receipt-queue';
import type { Access } from '../types/access';

/**
 * What the user should see, derived from the backend's view of access (the only thing that
 * unlocks premium) plus receipts this device has not handed to the backend yet.
 */
export type PremiumState =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'none'; access: Access | null }
  | { kind: 'expired'; access: Access }
  | { kind: 'refunded'; access: Access }
  /** Store took the payment; the backend has not confirmed it — no new access yet. */
  | { kind: 'confirming'; access: Access | null; rejected: ReceiptEntry | null }
  /** The backend refused a receipt (e.g. it belongs to another account). */
  | { kind: 'rejected'; access: Access | null; rejected: ReceiptEntry }
  | { kind: 'active'; access: Access; cancelled: boolean; confirmingAnother: boolean };

export function derivePremiumState(
  access: Access | undefined,
  receipts: readonly ReceiptEntry[],
  { isLoading, isError }: { isLoading: boolean; isError: boolean },
): PremiumState {
  const waiting = receipts.some((entry) => entry.status !== 'failed');
  const rejected = receipts.find((entry) => entry.status === 'failed') ?? null;
  const confirming = waiting || (access?.pendingTransactionIds.length ?? 0) > 0;

  if (!access) {
    if (confirming) return { kind: 'confirming', access: null, rejected };
    if (rejected) return { kind: 'rejected', access: null, rejected };
    if (isLoading) return { kind: 'loading' };
    if (isError) return { kind: 'unavailable' };
    return { kind: 'none', access: null };
  }

  if (access.status === 'active') {
    // Valid access is kept no matter what happens to another purchase attempt.
    return { kind: 'active', access, cancelled: !access.willRenew, confirmingAnother: confirming };
  }
  if (confirming) return { kind: 'confirming', access, rejected };
  if (rejected) return { kind: 'rejected', access, rejected };
  if (access.status === 'expired') return { kind: 'expired', access };
  if (access.status === 'refunded') return { kind: 'refunded', access };
  return { kind: 'none', access };
}

/** True when premium features are unlocked (backend-confirmed only). */
export function hasPremiumAccess(state: PremiumState): boolean {
  return state.kind === 'active';
}
