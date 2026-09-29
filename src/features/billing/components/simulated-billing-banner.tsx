import { Text } from '@ui/text';
import { View } from 'react-native';

import { billingProvider } from '../providers';

/** Always visible on billing screens: this is simulated billing, not a real charge. */
export function SimulatedBillingBanner() {
  return (
    <View
      className="rounded-xl border border-dashed border-primary bg-accent px-3 py-2"
      testID="simulated-billing-banner"
    >
      <Text className="text-center text-xs font-semibold uppercase tracking-wide text-accent-foreground">
        {billingProvider.label}
      </Text>
    </View>
  );
}
