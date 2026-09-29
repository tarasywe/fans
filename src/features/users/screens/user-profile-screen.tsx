import { Heading } from '@ui/heading';
import { CloseIcon } from '@ui/icon';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { IconButton } from '@/components/shared/icon-button';
import { MODAL_TOP_CLASS } from '@/components/shared/modal-insets';
import { ErrorState, LoadingState } from '@/components/shared/query-state';
import { useUserQuery } from '../api/queries';
import { ProfileDetails } from '../components/profile-details';

export function UserProfileScreen() {
  const { userId = '' } = useLocalSearchParams<{ userId: string }>();
  const { data: user, isPending, isError, refetch } = useUserQuery(userId);

  return (
    <View className="flex-1 bg-background" testID="user-profile-screen">
      <View
        className={`flex-row items-center justify-between border-b border-border px-5 pb-3 ${MODAL_TOP_CLASS}`}
      >
        <Heading size="md" className="text-foreground">
          Fan Details
        </Heading>
        <IconButton
          icon={CloseIcon}
          variant="dark"
          accessibilityLabel="Close"
          onPress={() => router.back()}
          testID="close-profile"
        />
      </View>

      {isPending ? <LoadingState label="Loading profile…" /> : null}
      {isError ? (
        <ErrorState message="Couldn't load this profile." onRetry={() => refetch()} />
      ) : null}
      {user ? (
        <ScrollView contentContainerClassName="px-5 pb-safe-offset-8 pt-5">
          <ProfileDetails user={user} />
        </ScrollView>
      ) : null}
    </View>
  );
}
