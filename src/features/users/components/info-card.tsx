import { EditIcon, Icon } from '@ui/icon';
import { Pressable } from '@ui/pressable';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';

type InfoCardProps = {
  icon?: ComponentProps<typeof Icon>['as'];
  children: ReactNode;
  onEdit?: () => void;
  editLabel?: string;
  trailing?: ReactNode;
  testID?: string;
};

/** Rounded bordered row used for every block on the Fan Details screen. */
export function InfoCard({ icon, children, onEdit, editLabel, trailing, testID }: InfoCardProps) {
  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
      testID={testID}
    >
      {icon ? <Icon as={icon} className="h-5 w-5 text-muted-foreground" /> : null}
      <View className="flex-1">{children}</View>
      {trailing}
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editLabel ?? 'Edit'}
          onPress={onEdit}
          hitSlop={8}
          className="active:opacity-60"
        >
          <Icon as={EditIcon} className="h-4 w-4 text-muted-foreground" />
        </Pressable>
      ) : null}
    </View>
  );
}
