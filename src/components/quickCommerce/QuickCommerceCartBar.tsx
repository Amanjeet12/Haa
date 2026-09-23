import ShoppingCart from 'lucide-react-native/icons/shopping-cart';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { images } from '../../assets/images';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

type Props = { bottom: number; onPress?: () => void };

export function QuickCommerceCartBar({ bottom, onPress }: Props) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityLabel="View cart, 2 items, ₹398"
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.bar, { bottom, shadowColor: theme.colors.shadow }]}
    >
      <View style={styles.thumbnails}>
        <Image resizeMode="cover" source={images.careImage} style={styles.thumbnail} />
        <Image resizeMode="cover" source={images.onboardingCards} style={[styles.thumbnail, styles.overlap]} />
      </View>
      <View style={styles.summary}>
        <AppText color="#FFFFFF" style={styles.title} weight="800">View cart</AppText>
        <AppText color="#C9D6E0" style={styles.meta} weight="600">2 items · ₹398</AppText>
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
