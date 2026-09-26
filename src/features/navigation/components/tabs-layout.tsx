import { Tabs } from 'expo-router/js-tabs';

import { INITIAL_TAB, TABS } from '../tabs';
import { TabBarIcon } from './tab-bar-icon';

export function TabsLayout() {
  return (
    <Tabs
      initialRouteName={INITIAL_TAB}
      screenOptions={{ headerShown: false, animation: 'shift', tabBarShowLabel: false }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarButtonTestID: `tab-${tab.name}`,
            tabBarIcon: ({ focused }) => <TabBarIcon tab={tab} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}
