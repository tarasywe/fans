import { Heading } from '@ui/heading';
import { AddIcon } from '@ui/icon';
import { View } from 'react-native';
import { IconButton } from '@/components/shared/icon-button';

export function ChatsHeader({ onNewChat }: { onNewChat: () => void }) {
  return (
    <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
      <Heading size="xl" className="text-foreground">
        Chats
      </Heading>
      <IconButton
        icon={AddIcon}
        variant="outline"
        accessibilityLabel="New chat"
        onPress={onNewChat}
        testID="new-chat-button"
      />
    </View>
  );
}
