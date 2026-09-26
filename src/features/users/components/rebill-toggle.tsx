import { Pressable } from '@ui/pressable';
import { Text } from '@ui/text';

type RebillToggleProps = { value: boolean; onChange: (value: boolean) => void };

/** Pill switch from the Figma "Rebill" row. */
export function RebillToggle({ value, onChange }: RebillToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Rebill"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      testID="rebill-toggle"
      className={`min-w-12 items-center rounded-full px-3 py-1 ${value ? 'bg-success' : 'bg-muted'}`}
    >
      <Text
        className={`text-sm font-medium ${value ? 'text-primary-foreground' : 'text-muted-foreground'}`}
      >
        {value ? 'On' : 'Off'}
      </Text>
    </Pressable>
  );
}
