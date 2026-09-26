import type { UserSummary } from '@features/users';
import { Button, ButtonIcon, ButtonText } from '@ui/button';
import { ArrowLeftIcon, StarIcon, ThreeDotsIcon } from '@ui/icon';
import { Pressable } from '@ui/pressable';
import { Text } from '@ui/text';
import { View } from 'react-native';
import { IconButton } from '@/components/shared/icon-button';
import { UserAvatar } from '@/components/shared/user-avatar';

type ChatHeaderProps = {
  user: UserSummary;
  onBack: () => void;
  onOpenProfile: (userId: string) => void;
};

/** One-to-one header: "Chat with" + receiver avatar, name, @username and "Full Details". */
export function ChatHeader({ user, onBack, onOpenProfile }: ChatHeaderProps) {
  return (
    <View className="gap-2 border-b border-border px-4 pb-3" testID="chat-header">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <IconButton
            icon={ArrowLeftIcon}
            accessibilityLabel="Back"
            onPress={onBack}
            testID="chat-back"
          />
          <Text className="text-base font-medium text-foreground">Chat with</Text>
        </View>
        <IconButton icon={ThreeDotsIcon} accessibilityLabel="More options" />
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${user.displayName}'s profile`}
          onPress={() => onOpenProfile(user.id)}
          className="flex-1 flex-row items-center gap-3"
          testID="chat-header-user"
        >
          <UserAvatar name={user.displayName} isOnline={user.isOnline} />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-base font-semibold text-foreground">
              {user.displayName}
            </Text>
            <Text numberOfLines={1} className="text-sm text-primary">
              @{user.username}
            </Text>
          </View>
        </Pressable>
        <Button
          variant="secondary"
          onPress={() => onOpenProfile(user.id)}
          className="h-10 rounded-xl px-3"
          testID="full-details-button"
        >
          <ButtonIcon as={StarIcon} className="h-4 w-4 text-secondary-foreground" />
          <ButtonText className="text-sm font-medium text-secondary-foreground">
            Full Details
          </ButtonText>
        </Button>
      </View>
    </View>
  );
}
