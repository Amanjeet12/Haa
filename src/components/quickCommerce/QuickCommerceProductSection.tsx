import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Product } from '../../api/products';
import { images } from '../../assets/images';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

type Props = {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  products: Product[];
  quantities: Record<number, number>;
  onAdd: (product: Product) => void;
  onRemove: (product: Product) => void;
  onProductPress: (product: Product) => void;
  onSeeAll: () => void;
};

function money(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function QuickCommerceProductSection({ title, description, imageUrl, products, quantities, onAdd, onRemove, onProductPress, onSeeAll }: Props) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(136, (width - 36 - 18) / 3);

  return <View style={styles.root}>
    <View style={styles.header}>
      <View style={styles.headerCopy}><AppText style={styles.title} weight="800">{title}</AppText>{description ? <AppText color={theme.colors.textMuted} style={styles.subtitle}>{description}</AppText> : null}</View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {products.map(product => {
        const price = Number(product.final_price ?? product.offer_price ?? product.price);
        const listPrice = Number(product.price);
        const quantity = quantities[product.product_id] ?? 0;
        return <Pressable key={product.product_id} onPress={() => onProductPress(product)} style={[styles.card, { width: cardWidth, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}>
          <View style={styles.art}>
            <Image source={product.images[0]?.url ? { uri: product.images[0].url } : images.careImage} resizeMode="cover" style={styles.image} />
            {product.discount_percentage > 0 ? <View style={[styles.discount, { backgroundColor: theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.discountText} weight="800">{Math.round(product.discount_percentage)}% OFF</AppText></View> : null}
            {quantity > 0 ? (
              <View style={[styles.imageStepper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove one ${product.product_name}`} onPress={event => { event.stopPropagation(); onRemove(product); }} style={styles.stepperButton}><Minus color={theme.colors.primary} size={15} strokeWidth={2.5} /></Pressable>
                <AppText style={styles.quantity} weight="800">{quantity}</AppText>
                <Pressable accessibilityRole="button" accessibilityLabel={`Add one ${product.product_name}`} onPress={event => { event.stopPropagation(); onAdd(product); }} style={styles.stepperButton}><Plus color={theme.colors.primary} size={15} strokeWidth={2.5} /></Pressable>
              </View>
            ) : <Pressable accessibilityRole="button" accessibilityLabel={`Add ${product.product_name} to bag`} disabled={!product.is_in_stock} onPress={event => { event.stopPropagation(); onAdd(product); }} style={[styles.imageAdd, { backgroundColor: theme.colors.surface, borderColor: product.is_in_stock ? theme.colors.primary : theme.colors.border }]}><Plus color={product.is_in_stock ? theme.colors.primary : theme.colors.textMuted} size={19} strokeWidth={2.5} /></Pressable>}
          </View>
          <View style={styles.body}>
            <AppText color={theme.colors.textMuted} numberOfLines={1} style={styles.brand} weight="700">{(product.attributes?.brand || product.vendor?.business_name || 'HAA HEALTH').toUpperCase()}</AppText>
            <AppText numberOfLines={2} style={styles.name} weight="800">{product.product_name}</AppText>
            <AppText color={theme.colors.textMuted} numberOfLines={1} style={styles.detail}>{product.unit}{product.attributes?.estimated_delivery ? ` · ${product.attributes.estimated_delivery}` : ''}</AppText>
            {product.vendor?.business_name ? <AppText color={theme.colors.success} numberOfLines={1} style={styles.vendor} weight="700">● {product.vendor.business_name}</AppText> : null}
            <View style={styles.purchase}>
              <View style={styles.prices}><AppText style={styles.price} weight="800">{money(price)}</AppText>{listPrice > price ? <AppText color={theme.colors.textMuted} style={styles.oldPrice}>{money(listPrice)}</AppText> : null}</View>
            </View>
          </View>
        </Pressable>;
      })}
    </ScrollView>
    <Pressable onPress={onSeeAll} style={[styles.seeAll, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Image source={imageUrl ? { uri: imageUrl } : images.careImage} resizeMode="cover" style={styles.thumb} /><AppText numberOfLines={1} style={styles.seeAllText} weight="800">See all {title}</AppText><ChevronRight color={theme.colors.text} size={16} /></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  root: { paddingTop: 23 }, header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, paddingHorizontal: 18, marginBottom: 10 }, headerCopy: { flex: 1 }, title: { fontSize: 19, lineHeight: 23, letterSpacing: -0.35 }, subtitle: { marginTop: 3, fontSize: 9, lineHeight: 12 }, viewAll: { fontSize: 9, lineHeight: 12 },
  row: { gap: 10, paddingHorizontal: 18, paddingBottom: 5 }, card: { alignSelf: 'flex-start', padding: 6, borderWidth: 1, borderRadius: 16, elevation: 2, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, art: { aspectRatio: 1.4, overflow: 'hidden', borderRadius: 11, backgroundColor: '#E8F1F3' }, image: { width: '100%', height: '100%' }, discount: { position: 'absolute', left: 5, top: 5, borderRadius: 7, paddingHorizontal: 5, paddingVertical: 3 }, discountText: { fontSize: 7, lineHeight: 9 }, imageAdd: { position: 'absolute', right: 4, bottom: 4, width: 33, height: 33, borderWidth: 1.5, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, imageStepper: { position: 'absolute', right: 4, bottom: 4, height: 33, borderWidth: 1.5, borderRadius: 9, flexDirection: 'row', alignItems: 'center' }, stepperButton: { width: 29, height: 31, alignItems: 'center', justifyContent: 'center' }, quantity: { minWidth: 17, textAlign: 'center', fontSize: 11, lineHeight: 14 },
  body: { paddingTop: 8 }, brand: { fontSize: 8, lineHeight: 10 }, name: { marginTop: 3, fontSize: 12, lineHeight: 15 }, detail: { marginTop: 4, fontSize: 8, lineHeight: 11 }, vendor: { marginTop: 3, fontSize: 8, lineHeight: 11 }, purchase: { paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 3 }, prices: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 3 }, price: { fontSize: 13, lineHeight: 16 }, oldPrice: { fontSize: 8, lineHeight: 10, textDecorationLine: 'line-through' },
  seeAll: { height: 46, marginHorizontal: 18, marginTop: 11, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 }, thumb: { width: 48, height: 28, borderRadius: 8 }, seeAllText: { flexShrink: 1, fontSize: 10, lineHeight: 13 },
});
