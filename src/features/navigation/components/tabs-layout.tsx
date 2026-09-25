import { Icon } from '@ui/icon';
import { Tabs } from 'expo-router/js-tabs';
import { INITIAL_TAB, TABS } from '../tabs';

export function TabsLayout() {
  return (
    <Tabs initialRouteName={INITIAL_TAB} screenOptions={{ headerShown: false, animation: 'shift' }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarButtonTestID: `tab-${tab.name}`,
            tabBarIcon: ({ color }) => (
              <Icon as={tab.icon} size="xl" color={typeof color === 'string' ? color : undefined} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
