import { Center } from '@ui/center';
import { Heading } from '@ui/heading';
import { Text } from '@ui/text';
import { Link } from 'expo-router';
import { links } from '@/config/links';

export function NotFoundScreen() {
  return (
    <Center className="flex-1 gap-3 bg-background px-6" testID="not-found-screen">
      <Heading size="xl" className="text-foreground">
        Page not found
      </Heading>
      <Text className="text-center text-muted-foreground">This screen does not exist.</Text>
      <Link href={links.chats} replace testID="not-found-home-link">
        <Text className="font-semibold text-primary">Go to chats</Text>
      </Link>
    </Center>
  );
}
