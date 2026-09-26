import { Icon } from '@ui/icon';
import { Pressable } from '@ui/pressable';
import type { ComponentProps } from 'react';

type IconButtonProps = {
  icon: ComponentProps<typeof Icon>['as'];
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: 'ghost' | 'outline' | 'primary' | 'dark';
  disabled?: boolean;
  testID?: string;
  className?: string;
  iconClassName?: string;
};

const CONTAINER = {
  ghost: 'h-10 w-10 rounded-full',
  outline: 'h-10 w-10 rounded-xl border border-border bg-background',
  primary: 'h-10 w-10 rounded-xl bg-primary',
  dark: 'h-8 w-8 rounded-full bg-foreground',
} as const;

const ICON = {
  ghost: 'h-5 w-5 text-foreground',
  outline: 'h-5 w-5 text-foreground',
  primary: 'h-5 w-5 text-primary-foreground',
  dark: 'h-4 w-4 text-background',
} as const;

export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'ghost',
  disabled,
  testID,
  className,
  iconClassName,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      hitSlop={6}
      className={`items-center justify-center active:opacity-70 ${disabled ? 'opacity-40' : ''} ${CONTAINER[variant]} ${className ?? ''}`}
    >
      <Icon as={icon} className={`${ICON[variant]} ${iconClassName ?? ''}`} />
    </Pressable>
  );
}
