import type { ReactElement, ReactNode } from 'react';
import { Pressable, View } from 'react-native';

type Props<T> = {
  data: readonly T[];
  renderItem: (info: { item: T; index: number }) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  ListHeaderComponent?: ReactElement | null;
  ListEmptyComponent?: ReactElement | null;
  testID?: string;
  onStartReached?: () => void;
};

/** Jest stand-in for LegendList: renders every row (no virtualization/layout in tests). */
export function LegendList<T>({
  data,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListEmptyComponent,
  testID,
  onStartReached,
}: Props<T>) {
  return (
    <View testID={testID}>
      {/* Lets tests simulate scrolling to the top. */}
      {onStartReached ? (
        <Pressable testID={`${testID}-start-reached`} onPress={onStartReached} />
      ) : null}
      {ListHeaderComponent}
      {data.length === 0
        ? ListEmptyComponent
        : data.map((item, index) => (
            <View key={keyExtractor ? keyExtractor(item, index) : String(index)}>
              {renderItem({ item, index })}
            </View>
          ))}
    </View>
  );
}
