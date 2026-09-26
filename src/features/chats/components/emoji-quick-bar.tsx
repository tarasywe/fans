import { Icon, ThreeDotsIcon } from '@ui/icon';
import { Pressable } from '@ui/pressable';
import { Text } from '@ui/text';
import { View } from 'react-native';
import { KeyboardIcon } from '@/components/shared/icons';

import { QUICK_EMOJIS } from '../constants/emojis';

type EmojiQuickBarProps = {
  onSelect: (emoji: string) => void;
  isPickerOpen: boolean;
  onTogglePicker: () => void;
};

export function EmojiQuickBar({ onSelect, isPickerOpen, onTogglePicker }: EmojiQuickBarProps) {
  return (
    <View
      className="flex-row items-center justify-between rounded-2xl bg-bubble px-3 py-1.5"
      testID="emoji-quick-bar"
    >
      {QUICK_EMOJIS.map((emoji) => (
        <Pressable
          key={emoji}
          accessibilityRole="button"
          accessibilityLabel={`Insert ${emoji}`}
          onPress={() => onSelect(emoji)}
          hitSlop={4}
          className="px-1 active:opacity-50"
          testID={`quick-emoji-${emoji}`}
        >
          <Text className="text-2xl leading-8">{emoji}</Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isPickerOpen ? 'Show keyboard' : 'Show all emoji'}
        onPress={onTogglePicker}
        hitSlop={6}
        className="h-8 w-8 items-center justify-center rounded-full active:bg-accent"
        testID="emoji-picker-toggle"
      >
        <Icon
          as={isPickerOpen ? KeyboardIcon : ThreeDotsIcon}
          className="h-5 w-5 text-foreground"
        />
      </Pressable>
    </View>
  );
}
