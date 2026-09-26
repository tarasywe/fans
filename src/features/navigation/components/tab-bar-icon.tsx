import { Icon } from '@ui/icon';
import { View } from 'react-native';

import type { TabDefinition } from '../tabs';

type TabBarIconProps = { tab: TabDefinition; focused: boolean };

export function TabBarIcon({ tab, focused }: TabBarIconProps) {
  if (tab.featured) {
    return (
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${focused ? 'bg-primary' : 'bg-secondary'}`}
      >
        <Icon
          as={tab.icon}
          className={`h-5 w-5 ${focused ? 'text-primary-foreground' : 'text-secondary-foreground'}`}
        />
      </View>
    );
  }
  return (
    <Icon
      as={tab.icon}
      className={`h-6 w-6 ${focused ? 'text-foreground' : 'text-muted-foreground'}`}
    />
  );
}
