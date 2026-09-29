import {
  billingServer,
  simulatedStoreAccount,
  useBillingSession,
  useSimulatedStoreFaults,
} from '@features/billing';
import { useQueryClient } from '@tanstack/react-query';
import { Button, ButtonText } from '@ui/button';
import { Heading } from '@ui/heading';
import { Text } from '@ui/text';
import { useState } from 'react';
import { View } from 'react-native';

import { LabRow } from './lab-row';

const DELAYS = [
  { label: 'Instant', ms: 0 },
  { label: '4 s', ms: 4000 },
  { label: '20 s', ms: 20_000 },
] as const;

type Choice<T> = { label: string; value: T; testID: string };

function Choices<T>({
  options,
  value,
  onChange,
}: {
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.label}
          size="sm"
          variant={option.value === value ? 'default' : 'outline'}
          onPress={() => onChange(option.value)}
          testID={option.testID}
        >
          <ButtonText>{option.label}</ButtonText>
        </Button>
      ))}
    </View>
  );
}

/**
 * Billing faults for the built-in simulated store and the mock backend. Store events stand in for
 * store → backend webhooks and are idempotent by event id ("Replay" sends the same id again).
 */
export function BillingLab() {
  const queryClient = useQueryClient();
  const store = useSimulatedStoreFaults();
  const appUserId = useBillingSession((session) => session.appUserId);
  const [config, setConfig] = useState(billingServer.config());
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [log, setLog] = useState('');

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['billing'] });
    setConfig(billingServer.config());
  };
  const updateConfig = (change: Parameters<typeof billingServer.setConfig>[0]) => {
    billingServer.setConfig(change);
    refresh();
  };
  const sendEvent = (type: 'CANCELLATION' | 'EXPIRATION' | 'REFUND', eventId?: string) => {
    const transactionId = appUserId ? billingServer.latestTransactionId(appUserId) : null;
    if (!appUserId || !transactionId) {
      setLog('No purchase for this user yet.');
      return;
    }
    const id = eventId ?? `${type.toLowerCase()}_${Date.now().toString(36)}`;
    billingServer.applyStoreEvent(appUserId, { eventId: id, type, transactionId });
    setLastEvent(`${type}|${id}`);
    const { eventsApplied } = billingServer.effects();
    setLog(`${type} ${id} → effects applied so far: ${eventsApplied}`);
    refresh();
  };
  const replay = () => {
    if (!lastEvent) return;
    const [type, id] = lastEvent.split('|') as ['CANCELLATION' | 'EXPIRATION' | 'REFUND', string];
    const before = billingServer.effects().eventsApplied;
    for (let i = 0; i < 3; i += 1) sendEvent(type, id);
    const after = billingServer.effects().eventsApplied;
    setLog(`Replayed ${type} ${id} ×3 → new effects: ${after - before} (total ${after})`);
  };

  return (
    <View className="gap-3" testID="billing-lab">
      <Heading size="sm" className="mt-2 text-foreground">
        Billing (simulated store + mock backend)
      </Heading>

      <View className="gap-2 rounded-2xl border border-border bg-card p-4">
        <Text className="text-base font-medium text-foreground">Next store purchase</Text>
        <Choices
          options={[
            { label: 'Succeeds', value: 'succeed' as const, testID: 'lab-store-succeed' },
            { label: 'Fails', value: 'fail' as const, testID: 'lab-store-fail' },
            { label: 'User cancels', value: 'cancel' as const, testID: 'lab-store-cancel' },
          ]}
          value={store.nextOutcome}
          onChange={(nextOutcome) => store.set({ nextOutcome })}
        />
      </View>

      <View className="gap-2 rounded-2xl border border-border bg-card p-4">
        <Text className="text-base font-medium text-foreground">Backend confirmation</Text>
        <Choices
          options={[
            ...DELAYS.map((delay) => ({
              label: delay.label,
              value: `${delay.ms}`,
              testID: `lab-confirm-${delay.ms}`,
            })),
            { label: 'Never', value: 'never', testID: 'lab-confirm-never' },
          ]}
          value={config.neverConfirm ? 'never' : `${config.confirmDelayMs}`}
          onChange={(value) =>
            updateConfig(
              value === 'never'
                ? { neverConfirm: true }
                : { neverConfirm: false, confirmDelayMs: Number(value) },
            )
          }
        />
        <Button
          size="sm"
          variant="outline"
          onPress={() => {
            billingServer.confirmPendingNow();
            refresh();
          }}
          testID="lab-confirm-now"
        >
          <ButtonText>Confirm pending purchases now</ButtonText>
        </Button>
      </View>

      <LabRow
        title="Purchase on another device"
        description="Same store account, not on this device yet — then use Restore."
      >
        <Button
          size="sm"
          variant="outline"
          onPress={() => {
            const purchase = simulatedStoreAccount.addPurchaseFromAnotherDevice();
            billingServer.confirmPurchase('another-device', { ...purchase, restored: false });
            billingServer.confirmPendingNow();
            setLog(`Store purchase ${purchase.transactionId} made on another device.`);
          }}
          testID="lab-other-device"
        >
          <ButtonText>Add</ButtonText>
        </Button>
      </LabRow>

      <View className="gap-2 rounded-2xl border border-border bg-card p-4">
        <Text className="text-base font-medium text-foreground">Store events (webhooks)</Text>
        <View className="flex-row flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onPress={() => sendEvent('CANCELLATION')}
            testID="lab-event-cancel"
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={() => sendEvent('EXPIRATION')}
            testID="lab-event-expire"
          >
            <ButtonText>Expire</ButtonText>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={() => sendEvent('REFUND')}
            testID="lab-event-refund"
          >
            <ButtonText>Refund</ButtonText>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={replay}
            disabled={!lastEvent}
            testID="lab-event-replay"
          >
            <ButtonText>Replay last ×3</ButtonText>
          </Button>
        </View>
        {log ? (
          <Text className="text-xs text-muted-foreground" testID="lab-billing-log">
            {log}
          </Text>
        ) : null}
      </View>

      <LabRow
        title="Reinstall app"
        description="New app user id, same store account. Access comes back only via Restore."
      >
        <Button
          size="sm"
          variant="outline"
          onPress={() => {
            simulatedStoreAccount.reinstall();
            setLog('Reinstalled: restart the app, then Restore purchases.');
          }}
          testID="lab-reinstall"
        >
          <ButtonText>Reinstall</ButtonText>
        </Button>
      </LabRow>
    </View>
  );
}
