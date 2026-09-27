import { mockChatServer, useOutboxStore } from '@features/chats';
import { useQueryClient } from '@tanstack/react-query';
import { Button, ButtonText } from '@ui/button';
import { Heading } from '@ui/heading';
import { CloseIcon } from '@ui/icon';
import { Pressable } from '@ui/pressable';
import { Text } from '@ui/text';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { IconButton } from '@/components/shared/icon-button';
import { USE_MOCK_API } from '@/config/api';
import { useMockFaults } from '@/lib/mock';

import { LabRow } from '../components/lab-row';
import { resetEverything } from '../scenarios';

const INCOMING_CHAT_ID = 'c_1';

/**
 * Network lab for reproducing delivery cases on a device (mock API only).
 * See docs/message-delivery-reliability.md for the step-by-step scenarios.
 */
export function DevToolsScreen() {
  const queryClient = useQueryClient();
  const faults = useMockFaults();
  const outbox = useOutboxStore((state) => state.entries);

  const [injected, setInjected] = useState(0);
  const injectIncoming = () => {
    mockChatServer.injectIncoming(INCOMING_CHAT_ID, 4);
    setInjected((count) => count + 4);
  };
  const reset = () => {
    resetEverything();
    // Not queryClient.clear(): that drops queries still observed by mounted screens, which then
    // keep showing stale data but are never persisted again. resetQueries keeps them and refetches.
    void queryClient.resetQueries();
  };

  return (
    <View className="flex-1 bg-background" testID="dev-tools-screen">
      <View className="flex-row items-center justify-between border-b border-border px-5 pb-3 pt-5 android:pt-safe-offset-5">
        <Heading size="md" className="text-foreground">
          Network lab
        </Heading>
        <IconButton icon={CloseIcon} accessibilityLabel="Close" onPress={() => router.back()} />
      </View>

      {USE_MOCK_API ? null : (
        <Text className="bg-muted px-5 py-3 text-sm text-muted-foreground">
          The app uses the real backend (EXPO_PUBLIC_API_URL). These faults only affect the mock API
          — use airplane mode on the device instead.
        </Text>
      )}

      <ScrollView contentContainerClassName="gap-3 px-5 pb-safe-offset-8 pt-5">
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: faults.offline }}
          accessibilityLabel="Simulate offline"
          onPress={() => faults.set({ offline: !faults.offline })}
          testID="lab-offline"
        >
          <LabRow
            title="Offline"
            description="Every request fails, like airplane mode. Survives app restarts."
          >
            {/* Display only: the whole row is the control (bigger touch target). */}
            <Switch value={faults.offline} pointerEvents="none" testID="lab-offline-switch" />
          </LabRow>
        </Pressable>

        <LabRow
          title="Lose next send response"
          description={`Server accepts the next send, the response never arrives. Pending: ${faults.loseResponses}`}
        >
          <Button
            size="sm"
            variant="outline"
            onPress={() => faults.set({ loseResponses: faults.loseResponses + 1 })}
            testID="lab-lose-response"
          >
            <ButtonText>+1</ButtonText>
          </Button>
        </LabRow>

        <LabRow
          title="Fail next send (500)"
          description={`Server error for the next send. Pending: ${faults.failWith500}`}
        >
          <Button
            size="sm"
            variant="outline"
            onPress={() => faults.set({ failWith500: faults.failWith500 + 1 })}
            testID="lab-fail-500"
          >
            <ButtonText>+1</ButtonText>
          </Button>
        </LabRow>

        <LabRow
          title="4 incoming messages"
          description={`Ethan Shoots sends 4 messages to the server now (e.g. while you are offline). Sent this session: ${injected}`}
        >
          <Button size="sm" variant="outline" onPress={injectIncoming} testID="lab-inject-incoming">
            <ButtonText>Send</ButtonText>
          </Button>
        </LabRow>

        <View className="gap-1 rounded-2xl border border-border bg-card p-4" testID="lab-outbox">
          <Text className="text-base font-medium text-foreground">Outbox ({outbox.length})</Text>
          {outbox.length === 0 ? (
            <Text className="text-sm text-muted-foreground">No pending messages.</Text>
          ) : (
            outbox.map((entry) => (
              <Text key={entry.clientId} className="text-sm text-muted-foreground">
                #{entry.seq} {entry.status} · {entry.chatId} · “{entry.text}” · {entry.clientId}
              </Text>
            ))
          )}
        </View>

        <Button variant="destructive" onPress={reset} testID="lab-reset">
          <ButtonText>Reset mock server, outbox and cache</ButtonText>
        </Button>
      </ScrollView>
    </View>
  );
}
