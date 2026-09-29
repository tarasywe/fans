import { Heading } from '@ui/heading';
import { Text } from '@ui/text';
import { View } from 'react-native';

import type { Product } from '../types/product';

export function ProductCard({ product }: { product: Product }) {
  return (
    <View className="gap-1 rounded-2xl border border-primary bg-accent p-4" testID="product-card">
      <Heading size="md" className="text-foreground">
        {product.title}
      </Heading>
      <Text className="text-sm text-muted-foreground">{product.description}</Text>
      <Text className="mt-2 text-2xl font-bold text-foreground" testID="product-price">
        {product.priceString}
        <Text className="text-base font-normal text-muted-foreground"> / {product.period}</Text>
      </Text>
    </View>
  );
}
