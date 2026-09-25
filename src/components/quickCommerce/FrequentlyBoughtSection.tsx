import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Clock3 from 'lucide-react-native/icons/clock-3';
import React from 'react';
import { Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { images } from '../../assets/images';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

type DemoImage = { source: ImageSourcePropType; position?: 'center' | 'top' | 'bottom' };
const groups: Array<{ title: string; more: string; colors: string[]; images: [DemoImage, DemoImage] }> = [
  { title: 'Your favourites', more: '+4 more', colors: ['#DDF7F4', '#F2FBFA'], images: [{ source: images.careImage, position: 'center' }, { source: images.onboardingCards, position: 'bottom' }] },
  { title: 'Daily wellness', more: '+6 more', colors: ['#E7F2FC', '#F3F8FD'], images: [{ source: images.onboardingCards, position: 'center' }, { source: images.careImage, position: 'top' }] },
  { title: 'Personal care', more: '+3 more', colors: ['#FDE8EE', '#FFF4F7'], images: [{ source: images.homeBanner, position: 'center' }, { source: images.onboardingCards, position: 'bottom' }] },
];

const products: Array<{ brand: string; name: string; detail: string; discount: string; price: string; oldPrice: string; image: DemoImage }> = [
  { brand: 'HAA INTIMATE', name: 'Ultra Thin\nProtection', detail: '10 units', discount: '12% OFF', price: '₹249', oldPrice: '₹265', image: { source: images.careImage, position: 'center' } },
  { brand: 'HAA CARE', name: 'Gentle Intimate\nWipes', detail: '20 wipes', discount: '8% OFF', price: '₹149', oldPrice: '₹162', image: { source: images.onboardingCards, position: 'bottom' } },
  { brand: 'INTIMATE CARE', name: 'Water-Based\nPersonal Lubricant', detail: '50 ml', discount: '', price: '₹299', oldPrice: '', image: { source: images.homeBanner, position: 'center' } },
];

export function FrequentlyBoughtSection({ onSeeAll, onGroupPress, onAdd }: { onSeeAll: () => void; onGroupPress: (category: string) => void; onAdd: (product: typeof products[number]) => void }) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const productCardWidth = (width - 36 - 18) / 3;
  return (
    <View style={styles.root}>
      <AppText style={styles.heading} weight="800">Frequently bought</AppText>
      <AppText color={theme.colors.textMuted} style={styles.subtitle}>Grouped from the items you purchase most</AppText>

      <View style={styles.groupRow}>
        {groups.map(({ title, more, colors, images: groupImages }) => (
          <Pressable key={title} onPress={() => onGroupPress(title)} style={[styles.groupCard, { backgroundColor: theme.isDark ? theme.colors.surface : colors[1], borderColor: theme.isDark ? theme.colors.border : colors[0] }]}>
            <View style={styles.groupArt}>
              <View style={[styles.miniTile, { backgroundColor: theme.colors.surface }]}><Image resizeMode="cover" source={groupImages[0].source} style={styles.demoImage} /></View>
              <View style={[styles.miniTile, styles.miniTileFront, { backgroundColor: theme.colors.surface }]}><Image resizeMode="cover" source={groupImages[1].source} style={styles.demoImage} /></View>
              <View style={styles.morePill}><AppText color={theme.colors.success} style={styles.moreText} weight="800">{more}</AppText></View>
            </View>
            <AppText numberOfLines={2} style={styles.groupTitle} weight="800">{title}</AppText>
          </Pressable>
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={onSeeAll} style={[styles.bottomAction, { backgroundColor: theme.isDark ? theme.colors.surfaceMuted : '#EAF7F4', borderColor: theme.isDark ? theme.colors.border : '#D5EAE7' }]}>
        <View style={styles.actionThumb}><Image resizeMode="cover" source={images.careImage} style={styles.demoImage} /></View>
        <AppText style={styles.actionText} weight="800">See all frequently bought</AppText>
        <ChevronRight color={theme.colors.text} size={16} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <AppText style={styles.heading} weight="800">Protection & intimate care</AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>Discreetly packed and delivered</AppText>
        </View>
        <Pressable><AppText color={theme.colors.primary} style={styles.viewAll} weight="800">View all</AppText></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.productRow} horizontal showsHorizontalScrollIndicator={false}>
        {products.map(product => (
          <View key={product.name} style={[styles.productCard, { width: productCardWidth, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}>
            <View style={styles.productArt}>
              <Image resizeMode="cover" source={product.image.source} style={styles.productImage} />
              {product.discount ? <View style={[styles.discount, { backgroundColor: theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.discountText} weight="800">{product.discount}</AppText></View> : null}
            </View>
            <View style={styles.productBody}>
              <AppText color={theme.colors.textMuted} style={styles.brand} weight="700">{product.brand}</AppText>
              <AppText numberOfLines={2} style={styles.productName} weight="800">{product.name}</AppText>
              <View style={styles.metaRow}>
                <AppText color={theme.colors.textMuted} style={styles.meta}>{product.detail}</AppText>
                <Clock3 color={theme.colors.textMuted} size={9} />
                <AppText color={theme.colors.textMuted} style={styles.meta}>9 min</AppText>
              </View>
              <AppText color={theme.colors.success} numberOfLines={1} style={styles.seller} weight="700">● MediQuick · 3 prices</AppText>
              <View style={styles.purchaseRow}>
                <View style={styles.priceRow}>
                  <AppText style={styles.price} weight="800">{product.price}</AppText>
                  {product.oldPrice ? <AppText color={theme.colors.textMuted} style={styles.oldPrice}>{product.oldPrice}</AppText> : null}
                </View>
                <Pressable onPress={() => onAdd(product)} style={[styles.addButton, { backgroundColor: theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.addText} weight="800">ADD</AppText></Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable style={[styles.bottomAction, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.bottomThumb}><Image resizeMode="cover" source={images.onboardingCards} style={styles.demoImage} /></View>
        <AppText style={styles.actionText} weight="800">See all Protection & intimate care</AppText>
        <ChevronRight color={theme.colors.text} size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 26 },
  heading: { paddingHorizontal: 18, fontSize: 20, lineHeight: 24, letterSpacing: -0.45 },
  subtitle: { paddingHorizontal: 18, marginTop: 4, fontSize: 10, lineHeight: 14 },
  groupRow: { flexDirection: 'row', gap: 9, paddingHorizontal: 18, paddingTop: 10 },
  groupCard: { flex: 1, minWidth: 0, minHeight: 132, borderWidth: 1, borderRadius: 18, paddingHorizontal: 9, paddingTop: 14, paddingBottom: 18 },
  groupArt: { width: '100%', aspectRatio: 1.5, marginBottom: 5 },
  miniTile: { position: 'absolute', left: 0, top: 0, width: '60%', height: '92%', overflow: 'hidden', borderRadius: 13, borderWidth: 2, borderColor: '#FFFFFF' },
  miniTileFront: { left: '40%' },
  demoImage: { width: '100%', height: '100%' },
  morePill: { position: 'absolute', right: -2, bottom: -2, borderRadius: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 3 },
  moreText: { fontSize: 8, lineHeight: 10 },
  groupTitle: { marginTop: 9, textAlign: 'center', fontSize: 11, lineHeight: 15 },
  actionThumb: { width: 50, height: 28, overflow: 'hidden', borderRadius: 9 },
  actionText: { flexShrink: 1, fontSize: 11, lineHeight: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  sectionCopy: { flex: 1 },
  viewAll: { paddingHorizontal: 18, paddingBottom: 1, fontSize: 11, lineHeight: 14 },
  productRow: { gap: 9, paddingHorizontal: 18, paddingBottom: 5 },
  productCard: { padding: 5, borderWidth: 1, borderRadius: 16, elevation: 2, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  productArt: { aspectRatio: 1.52, overflow: 'hidden', borderRadius: 11, backgroundColor: '#E8F1F3' },
  productImage: { width: '100%', height: '100%' },
  discount: { position: 'absolute', left: 8, top: 8, zIndex: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  discountText: { fontSize: 8, lineHeight: 10 },
  productBody: { flex: 1, paddingHorizontal: 1, paddingTop: 7, paddingBottom: 2 },
  brand: { fontSize: 7, lineHeight: 9, letterSpacing: 0.4 },
  productName: { minHeight: 32, marginTop: 3, fontSize: 12, lineHeight: 15, letterSpacing: -0.35 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 3, marginTop: 5 },
  meta: { fontSize: 7, lineHeight: 9 },
  seller: { marginTop: 4, fontSize: 7, lineHeight: 9 },
  purchaseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3, marginTop: 'auto', paddingTop: 8 },
  priceRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 3 },
  price: { fontSize: 12, lineHeight: 15 },
  oldPrice: { fontSize: 7, lineHeight: 9, textDecorationLine: 'line-through' },
  addButton: { width: '41%', minWidth: 36, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#DF1F2D', shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
  addText: { fontSize: 9, lineHeight: 11 },
  bottomAction: { height: 48, marginHorizontal: 18, marginTop: 11, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 14 },
  bottomThumb: { width: 50, height: 28, overflow: 'hidden', borderRadius: 9 },
});
