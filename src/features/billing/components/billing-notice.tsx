import { Alert, AlertText } from '@ui/alert';

import { usePurchaseFlow } from '../store/purchase-flow-store';

const TONE = {
  info: 'border-border bg-muted',
  success: 'border-success bg-muted',
  error: 'border-destructive bg-muted',
} as const;

/** Result of the last store flow (cancelled, failed, …). */
export function BillingNotice() {
  const notice = usePurchaseFlow((state) => state.notice);
  if (!notice) return null;
  return (
    <Alert className={`rounded-xl border ${TONE[notice.tone]}`} testID="billing-notice">
      <AlertText className={notice.tone === 'error' ? 'text-destructive' : 'text-foreground'}>
        {notice.text}
      </AlertText>
    </Alert>
  );
}
