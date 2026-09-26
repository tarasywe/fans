import { Button, ButtonText } from '@ui/button';
import { Center } from '@ui/center';
import { Spinner } from '@ui/spinner';
import { Text } from '@ui/text';

export function LoadingState({ label = 'Loading…', testID }: { label?: string; testID?: string }) {
  return (
    <Center className="flex-1 gap-3 py-10" testID={testID ?? 'loading-state'}>
      <Spinner className="text-primary" />
      <Text className="text-muted-foreground">{label}</Text>
    </Center>
  );
}

type ErrorStateProps = { message?: string; onRetry?: () => void };

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <Center className="flex-1 gap-3 px-6 py-10" testID="error-state">
      <Text className="text-center text-muted-foreground">{message}</Text>
      {onRetry ? (
        <Button variant="outline" onPress={onRetry} testID="retry-button">
          <ButtonText>Try again</ButtonText>
        </Button>
      ) : null}
    </Center>
  );
}

export function EmptyState({ message, testID }: { message: string; testID?: string }) {
  return (
    <Center className="flex-1 px-6 py-10" testID={testID ?? 'empty-state'}>
      <Text className="text-center text-muted-foreground">{message}</Text>
    </Center>
  );
}
