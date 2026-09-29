import { PremiumSummaryRow } from '@features/billing';
import { Button, ButtonText } from '@ui/button';
import { Heading } from '@ui/heading';
import { router } from 'expo-router';
import { View } from 'react-native';
import { links } from '@/config/links';

export function MoreScreen() {
  return (
    <View className="flex-1 gap-4 bg-background px-5 pt-safe-offset-4" testID="more-screen">
      <Heading size="xl" className="text-foreground">
        More
      </Heading>
      <PremiumSummaryRow />
      {__DEV__ ? (
        <Button
          variant="outline"
          onPress={() => router.push(links.devTools)}
          testID="open-dev-tools"
        >
          <ButtonText>Network lab (dev)</ButtonText>
        </Button>
      ) : null}
    </View>
  );
}
