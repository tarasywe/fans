import { CheckIcon, Icon } from '@ui/icon';
import { View } from 'react-native';

export function VerifiedBadge() {
  return (
    <View
      accessibilityLabel="Verified"
      className="h-4 w-4 items-center justify-center rounded-full bg-verified"
      testID="verified-badge"
    >
      <Icon as={CheckIcon} className="h-2.5 w-2.5 text-primary-foreground" />
    </View>
  );
}
