import { Text } from '@ui/text';
import { View } from 'react-native';

export function OfflineBanner({ pendingCount }: { pendingCount: number }) {
  return (
    <View className="bg-muted px-4 py-2" testID="offline-banner" accessibilityLiveRegion="polite">
      <Text className="text-center text-sm text-muted-foreground">
        You're offline.{' '}
        {pendingCount > 0
          ? `${pendingCount} ${pendingCount === 1 ? 'message' : 'messages'} will be sent when you reconnect.`
          : 'New messages will be sent when you reconnect.'}
      </Text>
    </View>
  );
}
