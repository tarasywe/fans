import { useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@ui/spinner';
import { Text } from '@ui/text';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { links } from '@/config/links';
import { useAccessQuery } from '../api/queries';
import { cancelSubscription, restore, resubscribe } from '../billing-actions';
import { BillingNotice } from '../components/billing-notice';
import { ModalHeader } from '../components/modal-header';
import { PrimaryAction } from '../components/primary-action';
import { ProductCard } from '../components/product-card';
import { SimulatedBillingBanner } from '../components/simulated-billing-banner';
import { StatusCard } from '../components/status-card';
import { useProduct } from '../components/use-product';
import { billingProvider } from '../providers';
import { useBillingSession } from '../store/billing-session';
import { usePurchaseFlow } from '../store/purchase-flow-store';
import { usePremiumState } from '../use-premium-state';
import { formatBillingDate } from '../utils/format';

/** Purchase status page: shows exactly what the backend has confirmed, with actions per state. */
export function SubscriptionScreen() {
  const client = useQueryClient();
  const state = usePremiumState();
  const access = useAccessQuery();
  const product = useProduct();
  const busy = usePurchaseFlow((flow) => flow.busy);
  const appUserId = useBillingSession((session) => session.appUserId);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const openPaywall = () => router.push(links.paywall);
  const restoreAction = (
    <PrimaryAction
      label="Restore purchases"
      busyLabel="Restoring…"
      busy={busy === 'restore'}
      disabled={busy !== null}
      onPress={() => void restore()}
      variant="outline"
      testID="restore-button"
    />
  );

  const renderState = () => {
    switch (state.kind) {
      case 'loading':
        return (
          <StatusCard
            tone="neutral"
            badge="Checking"
            title="Checking your subscription…"
            testID="status-loading"
          >
            <Spinner className="self-start text-primary" />
          </StatusCard>
        );
      case 'unavailable':
        return (
          <StatusCard
            tone="warning"
            badge="Offline"
            title="Can't reach the server"
            testID="status-unavailable"
          >
            <Text className="text-sm text-muted-foreground">
              Your subscription status will appear when you're back online. Nothing was charged or
              changed.
            </Text>
            <PrimaryAction
              label="Try again"
              busyLabel=""
              busy={false}
              onPress={() => void access.refetch()}
              variant="outline"
            />
          </StatusCard>
        );
      case 'confirming':
        return (
          <StatusCard
            tone="pending"
            badge="Payment received · not confirmed yet"
            title="Confirming your purchase…"
            testID="status-confirming"
          >
            <View className="flex-row items-center gap-2">
              <Spinner size="small" className="text-primary" />
              <Text className="flex-1 text-sm text-foreground">
                The store accepted your payment. Premium unlocks as soon as our server confirms it —
                you don't need to buy again.
              </Text>
            </View>
            {state.access?.status === 'expired' || state.access?.status === 'refunded' ? (
              <Text className="text-sm text-muted-foreground">
                Your previous subscription has ended.
              </Text>
            ) : null}
            <PrimaryAction
              label="Check now"
              busyLabel="Checking…"
              busy={access.isFetching}
              onPress={() => void access.refetch()}
              variant="outline"
              testID="check-now"
            />
          </StatusCard>
        );
      case 'rejected':
        return (
          <StatusCard
            tone="warning"
            badge="Not confirmed"
            title="We couldn't confirm this purchase"
            testID="status-rejected"
          >
            <Text className="text-sm text-destructive">{state.rejected.error}</Text>
            <Text className="text-sm text-muted-foreground">
              You won't be charged twice. Try restoring purchases, or contact support with
              transaction
              {` ${state.rejected.transactionId}`}.
            </Text>
            {restoreAction}
          </StatusCard>
        );
      case 'active':
        return (
          <StatusCard
            tone="success"
            badge={state.cancelled ? 'Premium · cancelled' : 'Premium · active'}
            title={
              state.cancelled
                ? `Active until ${formatBillingDate(state.access.expiresAt)}`
                : 'You have Premium'
            }
            testID="status-active"
          >
            <Text className="text-sm text-muted-foreground">
              {state.cancelled
                ? "Auto-renew is off. You keep access until the end of the paid period; you won't be charged again."
                : `Renews on ${formatBillingDate(state.access.expiresAt)}.`}
            </Text>
            {state.confirmingAnother ? (
              <Text className="text-sm text-primary" testID="confirming-another">
                Another purchase is being confirmed. Your current access is unaffected.
              </Text>
            ) : null}
            {state.cancelled ? (
              <PrimaryAction
                label={
                  billingProvider.managesSubscriptionInApp
                    ? 'Resume subscription'
                    : 'Manage subscription'
                }
                busyLabel="Updating…"
                busy={busy === 'resubscribe'}
                disabled={busy !== null || !appUserId || !state.access.transactionId}
                onPress={() =>
                  appUserId && state.access.transactionId
                    ? void resubscribe({
                        client,
                        appUserId,
                        transactionId: state.access.transactionId,
                      })
                    : undefined
                }
                testID="resubscribe-button"
              />
            ) : confirmCancel ? (
              <View className="gap-2" testID="cancel-confirmation">
                <Text className="text-sm text-foreground">
                  Cancel auto-renew? You keep Premium until{' '}
                  {formatBillingDate(state.access.expiresAt)}.
                </Text>
                <PrimaryAction
                  label="Yes, cancel subscription"
                  busyLabel="Cancelling…"
                  busy={busy === 'cancel'}
                  disabled={busy !== null || !appUserId || !state.access.transactionId}
                  onPress={async () => {
                    if (!appUserId || !state.access.transactionId) return;
                    await cancelSubscription({
                      client,
                      appUserId,
                      transactionId: state.access.transactionId,
                    });
                    setConfirmCancel(false);
                  }}
                  variant="destructive"
                  testID="confirm-cancel-button"
                />
                <PrimaryAction
                  label="Keep subscription"
                  busyLabel=""
                  busy={false}
                  onPress={() => setConfirmCancel(false)}
                  variant="outline"
                />
              </View>
            ) : (
              <PrimaryAction
                label={
                  billingProvider.managesSubscriptionInApp
                    ? 'Cancel subscription'
                    : 'Manage / cancel subscription'
                }
                busyLabel=""
                busy={false}
                disabled={busy !== null}
                onPress={() => setConfirmCancel(true)}
                variant="outline"
                testID="cancel-subscription-button"
              />
            )}
          </StatusCard>
        );
      default: {
        const titles = {
          none: 'You are on the free plan',
          expired: 'Your subscription has expired',
          refunded: 'Your purchase was refunded',
        } as const;
        return (
          <StatusCard
            tone={state.kind === 'none' ? 'neutral' : 'warning'}
            badge={state.kind === 'none' ? 'Free' : 'No access'}
            title={titles[state.kind]}
            testID={`status-${state.kind}`}
          >
            {state.kind === 'refunded' ? (
              <Text className="text-sm text-muted-foreground">
                Premium was removed when the refund was processed.
              </Text>
            ) : null}
            {product.data ? <ProductCard product={product.data} /> : null}
            <PrimaryAction
              label="See Premium plans"
              busyLabel="Waiting for the store…"
              busy={busy === 'purchase'}
              disabled={busy !== null}
              onPress={openPaywall}
              testID="open-paywall-button"
            />
            {restoreAction}
          </StatusCard>
        );
      }
    }
  };

  return (
    <View className="flex-1 bg-background" testID="subscription-screen">
      <ModalHeader title="Subscription" testID="close-subscription" />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-safe-offset-6 pt-5">
        <SimulatedBillingBanner />
        <BillingNotice />
        {renderState()}
      </ScrollView>
    </View>
  );
}
