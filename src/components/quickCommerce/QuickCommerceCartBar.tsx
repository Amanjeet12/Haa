import ShoppingCart from 'lucide-react-native/icons/shopping-cart';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { useAppSelector } from '../../store';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

type Props = { bottom: number; onPress?: () => void };

export function QuickCommerceCartBar({ bottom, onPress }: Props) {
  const { theme } = useAppTheme();
  const items = useAppSelector(state => state.commerceCart.items);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!items.length) return null;

  return (
    <Pressable
      accessibilityLabel={`View cart, ${count} items, ₹${total}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.bar, { bottom, shadowColor: theme.colors.shadow }]}
    >
      <View style={styles.thumbnails}>
        {items.slice(0, 2).map((item, index) => (
          <Image key={item.id} resizeMode="cover" source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={[styles.thumbnail, index > 0 && styles.overlap]} />
        ))}
      </View>
      <View style={styles.summary}>
        <AppText color="#FFFFFF" style={styles.title} weight="800">View cart</AppText>
        <AppText color="#C9D6E0" style={styles.meta} weight="600">{count} item{count === 1 ? '' : 's'} · ₹{total.toLocaleString('en-IN')}</AppText>
      </View>
      <View style={[styles.button, { backgroundColor: theme.colors.primary }]}>
        <ShoppingCart color="#FFFFFF" size={20} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 14, right: 14, height: 68, borderRadius: 21, backgroundColor: '#061F36', borderWidth: StyleSheet.hairlineWidth, borderColor: '#173A58', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, elevation: 14, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  thumbnails: { width: 74, height: 46, flexDirection: 'row', alignItems: 'center' },
  thumbnail: { width: 42, height: 42, borderRadius: 11, borderWidth: 2, borderColor: '#FFFFFF' },
  overlap: { marginLeft: -14 },
  summary: { flex: 1, marginLeft: 2 },
  title: { fontSize: 12, lineHeight: 15 },
  meta: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  button: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
