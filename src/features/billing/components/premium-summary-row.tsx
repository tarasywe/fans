import { ChevronRightIcon, Icon } from '@ui/icon';
import { Pressable } from '@ui/pressable';
import { Text } from '@ui/text';
import { router } from 'expo-router';
import { View } from 'react-native';
import { links } from '@/config/links';

import { usePremiumState } from '../use-premium-state';
import type { PremiumState } from '../utils/premium-state';

export function premiumSummary(state: PremiumState): { label: string; tone: string } {
  switch (state.kind) {
    case 'active':
      return state.cancelled
        ? { label: 'Premium · cancelled, active until period ends', tone: 'text-foreground' }
        : { label: 'Premium · active', tone: 'text-success' };
    case 'confirming':
      return { label: 'Payment received · confirming…', tone: 'text-primary' };
    case 'rejected':
      return { label: 'Purchase not confirmed', tone: 'text-destructive' };
    case 'expired':
      return { label: 'Expired', tone: 'text-muted-foreground' };
    case 'refunded':
      return { label: 'Refunded', tone: 'text-muted-foreground' };
    case 'unavailable':
      return { label: 'Status unavailable (offline)', tone: 'text-muted-foreground' };
    case 'loading':
      return { label: 'Checking…', tone: 'text-muted-foreground' };
    default:
      return { label: 'Free plan', tone: 'text-muted-foreground' };
  }
}

/** Compact purchase status that opens the Subscription page. */
export function PremiumSummaryRow() {
  const summary = premiumSummary(usePremiumState());
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Subscription: ${summary.label}`}
      onPress={() => router.push(links.subscription)}
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:opacity-70"
      testID="premium-summary-row"
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-medium text-foreground">Subscription</Text>
        <Text className={`text-sm ${summary.tone}`} testID="premium-summary-status">
          {summary.label}
        </Text>
      </View>
      <Icon as={ChevronRightIcon} className="h-5 w-5 text-muted-foreground" />
    </Pressable>
  );
}
