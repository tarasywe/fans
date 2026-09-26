import { Heading } from '@ui/heading';
import { FavouriteIcon, Icon, RepeatIcon } from '@ui/icon';
import { Text } from '@ui/text';
import { useState } from 'react';
import { View } from 'react-native';
import { FanSuiteLogoIcon, MapPinIcon, SparklesIcon } from '@/components/shared/icons';
import { UserAvatar } from '@/components/shared/user-avatar';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { formatDate, formatDateTime } from '@/utils/format-time';

import type { UserProfile } from '../types/user';
import { InfoCard } from './info-card';
import { RebillToggle } from './rebill-toggle';

// Editing is not wired yet — the pencils are visible to match the design but do nothing.
const noop = () => undefined;

export function ProfileDetails({ user }: { user: UserProfile }) {
  const [rebill, setRebill] = useState(user.rebill);

  return (
    <View className="gap-3">
      <View className="items-center gap-1 pb-3">
        <UserAvatar name={user.displayName} size="xl" isOnline={user.isOnline} />
        <View className="mt-3 flex-row items-center gap-1.5">
          <Heading size="lg" className="text-foreground">
            {user.displayName}
          </Heading>
          {user.isVerified ? <VerifiedBadge /> : null}
        </View>
        <Text className="text-primary">@{user.username}</Text>
      </View>

      <View className="gap-2 rounded-2xl border border-border bg-card p-4" testID="profile-bio">
        <Text className="text-sm font-medium text-foreground">User BIO</Text>
        <Text className="text-sm leading-5 text-muted-foreground">{user.bio}</Text>
        <View className="flex-row items-center gap-1 self-start rounded-full bg-secondary px-3 py-1">
          <Icon as={SparklesIcon} className="h-3.5 w-3.5 text-secondary-foreground" />
          <Text className="text-xs font-medium text-secondary-foreground">AI</Text>
        </View>
      </View>

      <InfoCard icon={MapPinIcon} onEdit={noop} editLabel="Edit location">
        <Text className="text-sm text-foreground">{user.location ?? 'Location unknown'}</Text>
      </InfoCard>

      <InfoCard icon={FavouriteIcon} onEdit={noop} editLabel="Edit preferences">
        <Text
          className={`text-sm ${user.preferences ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {user.preferences ?? 'Click to add preferences'}
        </Text>
      </InfoCard>

      <InfoCard icon={FanSuiteLogoIcon}>
        <Text className="text-sm text-foreground">
          Fan in <Text className="text-sm text-primary">{user.fanOf.name}</Text>
        </Text>
        <Text className="text-xs text-muted-foreground">
          Since {formatDate(new Date(user.fanOf.since))}
        </Text>
      </InfoCard>

      <InfoCard icon={RepeatIcon} trailing={<RebillToggle value={rebill} onChange={setRebill} />}>
        <Text className="text-sm text-foreground">Rebill</Text>
      </InfoCard>

      <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
        <View className={`h-4 w-4 rounded-full ${user.isOnline ? 'bg-online' : 'bg-offline'}`} />
        <View className="flex-1">
          <Text className="text-xs text-muted-foreground">Last Online</Text>
          <Text className="text-sm text-foreground">
            {user.isOnline ? 'Online now' : formatDateTime(new Date(user.lastOnlineAt))}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted-foreground">Last Response</Text>
          <Text className="text-sm text-foreground">
            {user.lastResponseAt ? formatDateTime(new Date(user.lastResponseAt)) : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}
