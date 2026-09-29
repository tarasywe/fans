import { CheckIcon, Icon } from '@ui/icon';
import { Text } from '@ui/text';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { links } from '@/config/links';

import { purchase, restore } from '../billing-actions';
import { BillingNotice } from '../components/billing-notice';
import { ModalHeader } from '../components/modal-header';
import { PrimaryAction } from '../components/primary-action';
import { ProductCard } from '../components/product-card';
import { SimulatedBillingBanner } from '../components/simulated-billing-banner';
import { useProduct } from '../components/use-product';
import { usePurchaseFlow } from '../store/purchase-flow-store';
import { usePremiumState } from '../use-premium-state';

const BENEFITS = ['Unlimited voice messages', 'Albums and cloud sync', 'Priority support'];

/** The app's own paywall, used with the built-in simulated store. */
export function SimplePaywall() {
  const product = useProduct();
  const busy = usePurchaseFlow((state) => state.busy);
  const premium = usePremiumState();
  const alreadyCovered = premium.kind === 'active' || premium.kind === 'confirming';

  const subscribe = async () => {
    if (!product.data) return;
    const outcome = await purchase(product.data.id);
    if (outcome.status === 'purchased') router.replace(links.subscription);
  };
  const restorePurchases = async () => {
    const outcome = await restore();
    if (outcome.status === 'restored' && outcome.receipts.length > 0)
      router.replace(links.subscription);
  };

  return (
    <View className="flex-1 bg-background" testID="paywall-screen">
      <ModalHeader title="Go Premium" testID="close-paywall" />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-safe-offset-6 pt-5">
        <SimulatedBillingBanner />
        {product.data ? <ProductCard product={product.data} /> : null}
        {product.isPending ? <Text className="text-muted-foreground">Loading price…</Text> : null}
        <View className="gap-2">
          {BENEFITS.map((benefit) => (
            <View key={benefit} className="flex-row items-center gap-2">
              <Icon as={CheckIcon} className="h-4 w-4 text-success" />
              <Text className="text-foreground">{benefit}</Text>
            </View>
          ))}
        </View>
        <BillingNotice />
        {alreadyCovered ? (
          <PrimaryAction
            label={
              premium.kind === 'active'
                ? 'You have Premium — view status'
                : 'Purchase is being confirmed — view status'
            }
            busyLabel=""
            busy={false}
            onPress={() => router.replace(links.subscription)}
            testID="paywall-view-status"
          />
        ) : (
          <PrimaryAction
            label={
              product.data
                ? `Subscribe for ${product.data.priceString} / ${product.data.period}`
                : 'Subscribe'
            }
            busyLabel={busy === 'restore' ? 'Restoring…' : 'Waiting for the store…'}
            busy={busy !== null}
            disabled={!product.data}
            onPress={subscribe}
            testID="subscribe-button"
          />
        )}
        <PrimaryAction
          label="Restore purchases"
          busyLabel="Restoring…"
          busy={busy === 'restore'}
          disabled={busy !== null}
          onPress={restorePurchases}
          variant="outline"
          testID="restore-button"
        />
        <Text className="text-center text-xs text-muted-foreground">
          Monthly subscription, renews automatically until cancelled. Access is unlocked once our
          server confirms the purchase.
        </Text>
      </ScrollView>
    </View>
  );
}
