import React from 'react';
import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Product } from '../../api/products';
import { images } from '../../assets/images';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

type Props = {
  title: string;
  description?: string | null;
  products: Product[];
  quantities: Record<number, number>;
  onAdd: (product: Product) => void;
  onRemove: (product: Product) => void;
  onProductPress: (product: Product) => void;
};

function money(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function WomensHormonalSection({ title, description, products, quantities, onAdd, onRemove, onProductPress }: Props) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 36 - 10) / 2;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText style={styles.heading} weight="800">{title}</AppText>
          {description ? <AppText color={theme.colors.textMuted} style={styles.subtitle}>{description}</AppText> : null}
        </View>
      </View>

      <View style={styles.grid}>
        {products.map(product => {
          const listPrice = Number(product.price);
          const finalPrice = Number(product.final_price ?? product.offer_price ?? product.price);
          const delivery = product.attributes?.estimated_delivery;
          const brand = product.attributes?.brand || product.vendor?.business_name || 'HAA HEALTH';
          const quantity = quantities[product.product_id] ?? 0;

          return (
            <Pressable accessibilityRole="button" key={product.product_id} onPress={() => onProductPress(product)} style={[styles.card, { width: cardWidth, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}>
              <View style={styles.art}>
                <Image source={product.images[0]?.url ? { uri: product.images[0].url } : images.careImage} resizeMode="cover" style={styles.image} />
                {product.discount_percentage > 0 ? <View style={styles.badge}><AppText style={styles.badgeText} weight="800">{Math.round(product.discount_percentage)}% OFF</AppText></View> : null}
              </View>
              <View style={styles.body}>
                <AppText color={theme.colors.primary} style={styles.brand} numberOfLines={1} weight="800">{brand.toUpperCase()}</AppText>
                <AppText style={styles.name} numberOfLines={2} weight="800">{product.product_name}</AppText>
                <AppText color={theme.colors.textMuted} style={styles.detail} numberOfLines={1}>{product.short_description || product.description || product.unit}</AppText>
                <View style={styles.priceRow}>
                  <View style={styles.prices}>
                    <AppText style={styles.price} weight="800">{money(finalPrice)}</AppText>
                    {listPrice > finalPrice ? <AppText color={theme.colors.textMuted} style={styles.oldPrice}>{money(listPrice)}</AppText> : null}
                  </View>
                  {delivery ? <View><AppText color={theme.colors.textMuted} style={styles.arrivalLabel}>Arrives in</AppText><AppText color={theme.colors.textMuted} style={styles.arrival} weight="700">{delivery}</AppText></View> : null}
                </View>
                {quantity > 0 ? (
                  <View style={[styles.stepper, { backgroundColor: theme.colors.primarySoft }]}>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove one ${product.product_name}`} onPress={event => { event.stopPropagation(); onRemove(product); }} style={({ pressed }) => [styles.stepperButton, { opacity: pressed ? 0.6 : 1 }]}>
                      <View style={[styles.stepperIcon, { backgroundColor: theme.colors.surface }]}><Minus color={theme.colors.primary} size={18} strokeWidth={2.5} /></View>
                    </Pressable>
                    <View style={styles.quantityCopy} accessibilityLiveRegion="polite">
                      <AppText style={styles.quantity} weight="800">{quantity}</AppText>
                      <AppText color={theme.colors.textMuted} style={styles.quantityCaption} weight="600">in bag</AppText>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Add one ${product.product_name}`} onPress={event => { event.stopPropagation(); onAdd(product); }} style={({ pressed }) => [styles.stepperButton, { opacity: pressed ? 0.6 : 1 }]}>
                      <View style={[styles.stepperIcon, { backgroundColor: theme.colors.primary }]}><Plus color="#FFFFFF" size={18} strokeWidth={2.5} /></View>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable disabled={!product.is_in_stock} onPress={() => onAdd(product)} style={[styles.add, { borderColor: product.is_in_stock ? theme.colors.primary : theme.colors.border }]}>
                    <AppText color={product.is_in_stock ? theme.colors.primary : theme.colors.textMuted} style={styles.addText} weight="800">{product.is_in_stock ? 'ADD TO BAG' : 'OUT OF STOCK'}</AppText>
                  </Pressable>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 20 },
  header: { paddingHorizontal: 18, marginBottom: 10 }, headerCopy: { flex: 1 },
  heading: { fontSize: 19, lineHeight: 23, letterSpacing: -0.4 }, subtitle: { marginTop: 3, fontSize: 9, lineHeight: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 18 },
  card: { overflow: 'hidden', borderWidth: 1, borderRadius: 16, elevation: 2, shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  art: { aspectRatio: 1.25, overflow: 'hidden', backgroundColor: '#F5E8EC' }, image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', left: 6, top: 6, maxWidth: '68%', borderRadius: 7, backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 4 }, badgeText: { fontSize: 6, lineHeight: 8 },
  body: { flex: 1, minHeight: 141, padding: 8 }, brand: { fontSize: 7, lineHeight: 9, letterSpacing: 0.35 }, name: { marginTop: 3, fontSize: 11, lineHeight: 14 }, detail: { marginTop: 4, fontSize: 7, lineHeight: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }, prices: { flexDirection: 'row', alignItems: 'baseline', gap: 4 }, price: { fontSize: 12, lineHeight: 15 }, oldPrice: { fontSize: 7, lineHeight: 10, textDecorationLine: 'line-through' }, arrivalLabel: { textAlign: 'right', fontSize: 6, lineHeight: 8 }, arrival: { textAlign: 'right', fontSize: 7, lineHeight: 9 },
  add: { height: 38, marginTop: 'auto', borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, addText: { fontSize: 10, lineHeight: 14 },
  stepper: { height: 38, marginTop: 'auto', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperButton: { width: 40, height: 38, alignItems: 'center', justifyContent: 'center' },
  stepperIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  quantityCopy: { flex: 1, alignItems: 'center' },
  quantity: { fontSize: 13, lineHeight: 16, fontVariant: ['tabular-nums'] },
  quantityCaption: { fontSize: 7, lineHeight: 9 },
});
