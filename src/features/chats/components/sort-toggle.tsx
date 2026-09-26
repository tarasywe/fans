import { Icon } from '@ui/icon';
import { Pressable } from '@ui/pressable';
import { View } from 'react-native';
import { SortAscendingIcon, SortDescendingIcon } from '@/components/shared/icons';

import type { ChatSortOrder } from '../types/chat';

type SortToggleProps = { order: ChatSortOrder; onToggle: () => void };

/** Newest → oldest shows the lines icon; oldest → newest shows the triangle (corner up). */
export function SortToggle({ order, onToggle }: SortToggleProps) {
  const isNewest = order === 'newest';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isNewest ? 'Sorted newest first' : 'Sorted oldest first'}
      accessibilityHint="Toggles the chat order"
      onPress={onToggle}
      testID="sort-toggle"
      className="h-11 w-11 items-center justify-center rounded-xl border border-border bg-background active:opacity-70"
    >
      <View testID={isNewest ? 'sort-icon-newest' : 'sort-icon-oldest'}>
        <Icon
          as={isNewest ? SortDescendingIcon : SortAscendingIcon}
          className="h-5 w-5 text-foreground"
        />
      </View>
    </Pressable>
  );
}
