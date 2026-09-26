import { Pressable } from '@ui/pressable';
import { Text } from '@ui/text';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EMOJI_CATEGORIES } from '../constants/emojis';

/** Emoji "keyboard" shown in place of the system keyboard. */
export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [categoryId, setCategoryId] = useState(EMOJI_CATEGORIES[0]?.id ?? '');
  const category = EMOJI_CATEGORIES.find((item) => item.id === categoryId) ?? EMOJI_CATEGORIES[0];

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      className="h-72 border-t border-border bg-background"
      testID="emoji-picker"
    >
      <View className="flex-row border-b border-border px-2">
        {EMOJI_CATEGORIES.map((item) => {
          const active = item.id === category?.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              onPress={() => setCategoryId(item.id)}
              className={`flex-1 items-center border-b-2 py-2 ${active ? 'border-primary' : 'border-transparent'}`}
              testID={`emoji-category-${item.id}`}
            >
              <Text className="text-xl">{item.icon}</Text>
            </Pressable>
          );
        })}
      </View>
      <ScrollView
        contentContainerClassName="flex-row flex-wrap px-2 pb-safe-offset-2 pt-2"
        keyboardShouldPersistTaps="always"
      >
        {category?.emojis.map((emoji) => (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={`Insert ${emoji}`}
            onPress={() => onSelect(emoji)}
            className="w-[12.5%] items-center py-1.5 active:opacity-50"
          >
            <Text className="text-3xl leading-10">{emoji}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
