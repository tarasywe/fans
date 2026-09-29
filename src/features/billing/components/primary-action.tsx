import { Button, ButtonSpinner, ButtonText } from '@ui/button';

type PrimaryActionProps = {
  label: string;
  busyLabel: string;
  busy: boolean;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
  variant?: 'default' | 'outline' | 'destructive';
};

/** Full-width action that shows its own progress and cannot be pressed twice. */
export function PrimaryAction({
  label,
  busyLabel,
  busy,
  disabled,
  onPress,
  testID,
  variant = 'default',
}: PrimaryActionProps) {
  const isDisabled = busy || disabled === true;
  return (
    <Button
      size="lg"
      variant={variant}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityState={{ disabled: isDisabled, busy }}
      className={`h-12 rounded-xl ${isDisabled ? 'opacity-50' : ''}`}
      testID={testID}
    >
      {busy ? (
        <ButtonSpinner
          className={variant === 'default' ? 'text-primary-foreground' : 'text-foreground'}
        />
      ) : null}
      <ButtonText className="text-base">{busy ? busyLabel : label}</ButtonText>
    </Button>
  );
}
