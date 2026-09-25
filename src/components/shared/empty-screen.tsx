import { Center } from '@ui/center';
import { Heading } from '@ui/heading';
import { Text } from '@ui/text';
import Animated, { FadeIn } from 'react-native-reanimated';

type EmptyScreenProps = {
  title: string;
  description?: string;
  testID?: string;
};

/** Placeholder body for screens that are not implemented yet. */
export function EmptyScreen({ title, description, testID }: EmptyScreenProps) {
  return (
    <Center className="flex-1 bg-background px-6 pt-safe" testID={testID}>
      <Animated.View entering={FadeIn.duration(250)} className="items-center gap-2">
        <Heading size="xl" className="text-foreground">
          {title}
        </Heading>
        {description ? (
          <Text className="text-center text-muted-foreground">{description}</Text>
        ) : null}
      </Animated.View>
    </Center>
  );
}
