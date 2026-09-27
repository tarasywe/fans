import { Text } from '@ui/text';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type LabRowProps = { title: string; description: string; children: ReactNode; testID?: string };

export function LabRow({ title, description, children, testID }: LabRowProps) {
  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4"
      testID={testID}
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-medium text-foreground">{title}</Text>
        <Text className="text-sm text-muted-foreground">{description}</Text>
      </View>
      {children}
    </View>
  );
}
