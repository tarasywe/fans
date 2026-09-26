import { Text } from '@ui/text';

export function DaySeparator({ label }: { label: string }) {
  return (
    <Text className="py-3 text-center text-sm text-muted-foreground" accessibilityRole="header">
      {label}
    </Text>
  );
}
