import { type FanList, type UserSummary, useFanListsQuery, useUsersQuery } from '@features/users';
import { LegendList } from '@legendapp/list/react-native';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@ui/button';
import { Heading } from '@ui/heading';
import { ArrowRightIcon, CloseIcon, Icon } from '@ui/icon';
import { Text } from '@ui/text';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { IconButton } from '@/components/shared/icon-button';
import { FanSuiteLogoIcon } from '@/components/shared/icons';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/query-state';
import { SearchField } from '@/components/shared/search-field';
import { UserAvatar } from '@/components/shared/user-avatar';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { links } from '@/config/links';
import { useDebouncedValue } from '@/utils/use-debounced-value';

import { useCreateChatMutation } from '../api/mutations';
import { SelectableRow } from '../components/selectable-row';
import { isGroupSelected, submitLabel, toggleGroup, toggleId } from '../utils/selection';

type Row =
  | { kind: 'list'; list: FanList }
  | { kind: 'divider' }
  | { kind: 'user'; user: UserSummary };

export function NewChatScreen() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const users = useUsersQuery(debouncedSearch);
  const fanLists = useFanListsQuery();
  const createChat = useCreateChatMutation();
  const contentStyle = useResolveClassNames('gap-2 px-5 pb-4 pt-1');

  const showLists = debouncedSearch.length === 0 && (fanLists.data?.length ?? 0) > 0;
  const rows: Row[] = [
    ...(showLists ? (fanLists.data ?? []).map((list): Row => ({ kind: 'list', list })) : []),
    ...(showLists ? [{ kind: 'divider' } as const] : []),
    ...(users.data ?? []).map((user): Row => ({ kind: 'user', user })),
  ];

  const isSubmitDisabled = selected.size === 0 || createChat.isPending;
  const submit = () =>
    createChat.mutate(
      { participantIds: [...selected] },
      { onSuccess: (chat) => router.replace(links.chat(chat.id)) },
    );

  const renderRow = (row: Row) => {
    if (row.kind === 'divider') return <View className="my-2 h-px bg-border" />;
    if (row.kind === 'list') {
      return (
        <SelectableRow
          selected={isGroupSelected(selected, row.list.memberIds)}
          onToggle={() => setSelected((current) => toggleGroup(current, row.list.memberIds))}
          accessibilityLabel={`Select list ${row.list.name}`}
          leading={<Icon as={FanSuiteLogoIcon} className="h-6 w-6 text-foreground" />}
          testID={`fan-list-${row.list.id}`}
        >
          <Text className="text-base font-medium text-foreground">{row.list.name}</Text>
          <Text className="text-sm text-muted-foreground">{row.list.fansCount} fans</Text>
        </SelectableRow>
      );
    }
    const { user } = row;
    return (
      <SelectableRow
        selected={selected.has(user.id)}
        onToggle={() => setSelected((current) => toggleId(current, user.id))}
        accessibilityLabel={`Select ${user.displayName}`}
        leading={<UserAvatar name={user.displayName} size="sm" />}
        testID={`user-row-${user.id}`}
      >
        <View className="flex-row items-center gap-1.5">
          <Text numberOfLines={1} className="flex-shrink text-base font-medium text-foreground">
            {user.displayName}
          </Text>
          {user.isVerified ? <VerifiedBadge /> : null}
        </View>
        <Text className="text-sm text-muted-foreground">@{user.username}</Text>
      </SelectableRow>
    );
  };

  return (
    <View className="flex-1 bg-background" testID="new-chat-screen">
      <View className="flex-row items-center justify-between border-b border-border px-5 pb-3 pt-5">
        <Heading size="md" className="text-foreground">
          New message
        </Heading>
        <IconButton
          icon={CloseIcon}
          accessibilityLabel="Close"
          onPress={() => router.back()}
          testID="close-new-chat"
        />
      </View>

      <View className="px-5 py-3">
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Search for users on FanSuite"
          testID="users-search"
        />
      </View>

      {users.isPending ? <LoadingState label="Loading users…" /> : null}
      {users.isError ? (
        <ErrorState message="Couldn't load users." onRetry={() => users.refetch()} />
      ) : null}
      {users.data ? (
        <LegendList
          data={rows}
          keyExtractor={(row, index) =>
            row.kind === 'user'
              ? row.user.id
              : row.kind === 'list'
                ? row.list.id
                : `divider_${index}`
          }
          renderItem={({ item }) => renderRow(item)}
          estimatedItemSize={64}
          recycleItems
          extraData={selected}
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <EmptyState testID="users-empty" message={`No users match “${debouncedSearch}”.`} />
          }
          testID="users-list"
        />
      ) : null}

      <View className="gap-2 border-t border-border px-5 pb-safe-offset-3 pt-3">
        {createChat.isError ? (
          <Text className="text-sm text-destructive" testID="create-chat-error">
            Couldn't start the chat. Please try again.
          </Text>
        ) : null}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground" testID="selected-count">
            {selected.size === 0 ? 'Select at least one user' : `${selected.size} selected`}
          </Text>
          <Button
            size="lg"
            onPress={submit}
            disabled={isSubmitDisabled}
            className={`h-12 rounded-xl px-5 ${isSubmitDisabled ? 'opacity-40' : ''}`}
            testID="start-chat-button"
          >
            {createChat.isPending ? <ButtonSpinner className="text-primary-foreground" /> : null}
            <ButtonText className="text-base">{submitLabel(selected.size)}</ButtonText>
            <ButtonIcon as={ArrowRightIcon} />
          </Button>
        </View>
      </View>
    </View>
  );
}
