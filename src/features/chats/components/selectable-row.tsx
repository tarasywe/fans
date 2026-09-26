import { CheckIcon, Icon } from '@ui/icon';
import { Pressable } from '@ui/pressable';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type SelectableRowProps = {
  selected: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
  leading: ReactNode;
  children: ReactNode;
  testID?: string;
};

/** Bordered checkbox row from the Figma "New message" popup. */
export function SelectableRow({
  selected,
  onToggle,
  accessibilityLabel,
  leading,
  children,
  testID,
}: SelectableRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: selected }}
      onPress={onToggle}
      testID={testID}
      className={`flex-row items-center gap-3 rounded-2xl border px-3 py-2.5 active:opacity-80 ${
        selected ? 'border-primary bg-accent' : 'border-border bg-card'
      }`}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-md border ${
          selected ? 'border-primary bg-primary' : 'border-input bg-background'
        }`}
      >
        {selected ? <Icon as={CheckIcon} className="h-3.5 w-3.5 text-primary-foreground" /> : null}
      </View>
      {leading}
      <View className="flex-1">{children}</View>
    </Pressable>
  );
}
