import { Heading } from '@ui/heading';
import { CloseIcon } from '@ui/icon';
import { router } from 'expo-router';
import { View } from 'react-native';
import { IconButton } from '@/components/shared/icon-button';
import { MODAL_TOP_CLASS } from '@/components/shared/modal-insets';

export function ModalHeader({ title, testID }: { title: string; testID?: string }) {
  return (
    <View
      className={`flex-row items-center justify-between border-b border-border px-5 pb-3 ${MODAL_TOP_CLASS}`}
    >
      <Heading size="md" className="text-foreground">
        {title}
      </Heading>
      <IconButton
        icon={CloseIcon}
        accessibilityLabel="Close"
        onPress={() => router.back()}
        testID={testID}
      />
    </View>
  );
}
