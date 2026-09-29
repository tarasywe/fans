import { Heading } from '@ui/heading';
import { Text } from '@ui/text';
import type { ReactNode } from 'react';
import { View } from 'react-native';

const TONE = {
  neutral: 'border-border bg-card',
  pending: 'border-primary bg-accent',
  success: 'border-success bg-card',
  warning: 'border-destructive bg-card',
} as const;

type StatusCardProps = {
  tone: keyof typeof TONE;
  badge: string;
  title: string;
  children?: ReactNode;
  testID?: string;
};

export function StatusCard({ tone, badge, title, children, testID }: StatusCardProps) {
  return (
    <View className={`gap-2 rounded-2xl border p-4 ${TONE[tone]}`} testID={testID}>
      <Text
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        testID="premium-badge"
      >
        {badge}
      </Text>
      <Heading size="md" className="text-foreground">
        {title}
      </Heading>
      {children}
    </View>
  );
}
