import { router } from 'expo-router';
import { useRef } from 'react';
import { View } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { withUniwind } from 'uniwind';

import { links } from '@/config/links';

import { submitReceipt } from '../billing-actions';
import { SimulatedBillingBanner } from '../components/simulated-billing-banner';
import { receiptFromTransaction, receiptsFromCustomerInfo } from '../providers/revenuecat-store';
import { usePurchaseFlow } from '../store/purchase-flow-store';

const Paywall = withUniwind(RevenueCatUI.Paywall);

/**
 * The paywall designed in the RevenueCat dashboard (same project as carboai-mobile). The store
 * result only becomes access after the backend confirms the receipt.
 */
export function NativePaywall() {
  const { setNotice } = usePurchaseFlow.getState();
  // The paywall also fires onDismiss after a purchase/restore; by then we already navigated to
  // the status page, so a second navigation would pop it again.
  const navigated = useRef(false);
  const showStatus = () => {
    navigated.current = true;
    router.replace(links.subscription);
  };
  return (
    <View className="flex-1 bg-background pt-safe" testID="paywall-screen">
      <View className="px-4 pb-2">
        <SimulatedBillingBanner />
      </View>
      <Paywall
        className="flex-1"
        options={{ displayCloseButton: true }}
        onPurchaseCompleted={({ storeTransaction }) => {
          submitReceipt(receiptFromTransaction(storeTransaction), false);
          setNotice({
            tone: 'info',
            text: 'Payment received. Waiting for the server to confirm your access…',
            awaitingConfirmation: true,
          });
          showStatus();
        }}
        onRestoreCompleted={({ customerInfo }) => {
          const receipts = receiptsFromCustomerInfo(customerInfo);
          for (const receipt of receipts) submitReceipt(receipt, true);
          setNotice({
            tone: 'info',
            text:
              receipts.length > 0
                ? 'Purchase found. Asking the server to restore your access…'
                : 'No previous purchases found.',
            awaitingConfirmation: receipts.length > 0,
          });
          if (receipts.length > 0) showStatus();
        }}
        onPurchaseCancelled={() =>
          setNotice({ tone: 'info', text: 'Purchase cancelled. You were not charged.' })
        }
        onPurchaseError={({ error }) =>
          setNotice({ tone: 'error', text: `Purchase failed: ${error.message}` })
        }
        onDismiss={() => {
          if (!navigated.current) router.back();
        }}
      />
    </View>
  );
}
