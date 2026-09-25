import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Clock3 from 'lucide-react-native/icons/clock-3';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { images } from '../../assets/images';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

const products = [
  {
    brand: 'HAA CARE',
    name: 'Everyday First Aid\nKit',
    detail: '6 essential items',
    discount: '15% OFF',
    price: '₹299',
    oldPrice: '₹349',
    image: images.careImage,
    seller: 'MediQuick · 3 prices',
  },
  {
    brand: 'DAILY WELLNESS',
    name: 'ORS Hydration\nSachets',
    detail: 'Pack of 5',
    discount: '',
    price: '₹170',
    oldPrice: '',
    image: images.onboardingCards,
    seller: 'CarePoint · 4 prices',
  },
  {
    brand: 'PAIN RELIEF',
    name: 'Fast-Acting Relief\nSpray',
    detail: '55 g',
    discount: '10% OFF',
    price: '₹189',
    oldPrice: '₹210',
    image: images.homeBanner,
    seller: 'WellMart · 2 prices',
  },
] as const;

export function FirstAidWellnessSection({
  onSeeAll,
  onAdd,
}: {
  onSeeAll: () => void;
  onAdd: (product: (typeof products)[number]) => void;
}) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const productCardWidth = (width - 36 - 18) / 3;
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText style={styles.heading} weight="800">
            First aid & wellness
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            Daily health essentials
          </AppText>
        </View>
        <Pressable onPress={onSeeAll}>
          <AppText
            color={theme.colors.primary}
            style={styles.viewAll}
            weight="800"
          >
            View all
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.productRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {products.map(product => (
          <View
            key={product.name}
            style={[
              styles.card,
              {
                width: productCardWidth,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <View style={styles.art}>
              <Image
                resizeMode="cover"
                source={product.image}
                style={styles.image}
              />
              {product.discount ? (
                <View
                  style={[
                    styles.discount,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <AppText
                    color="#FFFFFF"
                    style={styles.discountText}
                    weight="800"
                  >
                    {product.discount}
                  </AppText>
                </View>
              ) : null}
            </View>
            <View style={styles.body}>
              <AppText
                color={theme.colors.textMuted}
                style={styles.brand}
                weight="700"
              >
                {product.brand}
              </AppText>
              <AppText numberOfLines={2} style={styles.name} weight="800">
                {product.name}
              </AppText>
              <View style={styles.metaRow}>
                <AppText color={theme.colors.textMuted} style={styles.meta}>
                  {product.detail}
                </AppText>
                <Clock3 color={theme.colors.textMuted} size={9} />
                <AppText color={theme.colors.textMuted} style={styles.meta}>
                  9 min
                </AppText>
              </View>
              <AppText
                color={theme.colors.success}
                numberOfLines={1}
                style={styles.seller}
                weight="700"
              >
                ● {product.seller}
              </AppText>
              <View style={styles.purchaseRow}>
                <View style={styles.priceRow}>
                  <AppText style={styles.price} weight="800">
                    {product.price}
                  </AppText>
                  {product.oldPrice ? (
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.oldPrice}
                    >
                      {product.oldPrice}
                    </AppText>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => onAdd(product)}
                  style={[
                    styles.add,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <AppText color="#FFFFFF" style={styles.addText} weight="800">
                    ADD
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable
        onPress={onSeeAll}
        style={[
          styles.seeAll,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.thumb}>
          <Image
            resizeMode="cover"
            source={images.careImage}
            style={styles.image}
          />
        </View>
        <AppText style={styles.seeAllText} weight="800">
          See all First aid & wellness
        </AppText>
        <ChevronRight color={theme.colors.text} size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 24, paddingBottom: 6 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerCopy: { flex: 1 },
  heading: {
    paddingHorizontal: 18,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.45,
  },
  subtitle: {
    paddingHorizontal: 18,
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
  },
  viewAll: {
    paddingHorizontal: 18,
    paddingBottom: 1,
    fontSize: 11,
    lineHeight: 14,
  },
  productRow: { gap: 9, paddingHorizontal: 18, paddingBottom: 5 },
  card: {
    padding: 5,
    borderWidth: 1,
    borderRadius: 16,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  art: {
    aspectRatio: 1.52,
    overflow: 'hidden',
    borderRadius: 11,
    backgroundColor: '#DCECEF',
  },
  image: { width: '100%', height: '100%' },
  discount: {
    position: 'absolute',
    left: 8,
    top: 8,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  discountText: { fontSize: 8, lineHeight: 10 },
  body: { flex: 1, paddingHorizontal: 1, paddingTop: 7, paddingBottom: 2 },
  brand: { fontSize: 7, lineHeight: 9, letterSpacing: 0.4 },
  name: {
    minHeight: 32,
    marginTop: 3,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: -0.35,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 3,
    marginTop: 5,
  },
  meta: { fontSize: 7, lineHeight: 9 },
  seller: { marginTop: 4, fontSize: 7, lineHeight: 9 },
  purchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 3,
    marginTop: 'auto',
    paddingTop: 8,
  },
  priceRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 3,
  },
  price: { fontSize: 12, lineHeight: 15 },
  oldPrice: { fontSize: 7, lineHeight: 9, textDecorationLine: 'line-through' },
  add: {
    width: '41%',
    minWidth: 36,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#DF1F2D',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  addText: { fontSize: 9, lineHeight: 11 },
  seeAll: {
    height: 48,
    marginHorizontal: 18,
    marginTop: 11,
    borderWidth: 1,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 14,
  },
  thumb: { width: 50, height: 28, overflow: 'hidden', borderRadius: 9 },
  seeAllText: { flexShrink: 1, fontSize: 11, lineHeight: 14 },
});
