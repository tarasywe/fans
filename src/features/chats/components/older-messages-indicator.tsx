import { Spinner } from '@ui/spinner';
import { Text } from '@ui/text';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

type OlderMessagesIndicatorProps = { isLoading: boolean; hasMore: boolean };

/** Top-of-list state while paging back through history. */
export function OlderMessagesIndicator({ isLoading, hasMore }: OlderMessagesIndicatorProps) {
  if (isLoading) {
    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        className="flex-row items-center justify-center gap-2 py-4"
        testID="loading-older-messages"
      >
        <Spinner size="small" className="text-primary" />
        <Text className="text-sm text-muted-foreground">Loading earlier messages…</Text>
      </Animated.View>
    );
  }
  if (!hasMore) {
    return (
      <Text className="py-4 text-center text-xs text-muted-foreground" testID="conversation-start">
        This is the beginning of the conversation
      </Text>
    );
  }
  return null;
}
