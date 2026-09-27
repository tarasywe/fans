import { Button, ButtonText } from '@ui/button';
import { router } from 'expo-router';
import { View } from 'react-native';
import { EmptyScreen } from '@/components/shared/empty-screen';
import { links } from '@/config/links';

export function MoreScreen() {
  return (
    <View className="flex-1 bg-background">
      <EmptyScreen testID="more-screen" title="More" description="Coming soon." />
      {__DEV__ ? (
        <View className="px-6 pb-8">
          <Button
            variant="outline"
            onPress={() => router.push(links.devTools)}
            testID="open-dev-tools"
          >
            <ButtonText>Network lab (dev)</ButtonText>
          </Button>
        </View>
      ) : null}
    </View>
  );
}
