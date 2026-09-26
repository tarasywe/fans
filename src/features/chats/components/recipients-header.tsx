import type { UserSummary } from '@features/users';
import { ArrowLeftIcon } from '@ui/icon';
import { Pressable } from '@ui/pressable';
import { Text } from '@ui/text';
import { ScrollView, View } from 'react-native';
import { IconButton } from '@/components/shared/icon-button';
import { UserAvatar } from '@/components/shared/user-avatar';

type RecipientsHeaderProps = {
  users: readonly UserSummary[];
  onBack: () => void;
  onOpenProfile: (userId: string) => void;
};

/** Multi-recipient header: "Separate Message to (N) users" + recipient chips. */
export function RecipientsHeader({ users, onBack, onOpenProfile }: RecipientsHeaderProps) {
  return (
    <View className="gap-3 border-b border-border pb-3" testID="recipients-header">
      <View className="flex-row items-center gap-1 px-4">
        <IconButton
          icon={ArrowLeftIcon}
          accessibilityLabel="Back"
          onPress={onBack}
          testID="chat-back"
        />
        <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1}>
          Separate Message to ({users.length}) users
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4"
      >
        {users.map((user) => (
          <Pressable
            key={user.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${user.displayName}'s profile`}
            onPress={() => onOpenProfile(user.id)}
            className="flex-row items-center gap-2 rounded-2xl border border-primary bg-accent px-3 py-2"
            testID={`recipient-${user.id}`}
          >
            <UserAvatar name={user.displayName} size="sm" isOnline={user.isOnline} />
            <View>
              <Text className="text-sm font-medium text-foreground">{user.displayName}</Text>
              <Text className="text-xs text-muted-foreground">@{user.username}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
