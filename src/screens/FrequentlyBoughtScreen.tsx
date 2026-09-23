import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Clock3 from 'lucide-react-native/icons/clock-3';
import Zap from 'lucide-react-native/icons/zap';
import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { images } from '../assets/images';
import { AppText } from '../components';
import { QuickCommerceCartBar } from '../components/quickCommerce/QuickCommerceCartBar';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

// Demo catalogue until the commerce API is connected.
const products = [
  { id: 'sunscreen', category: 'Your favourites', name: 'Daily Sunscreen SPF 50', detail: '50 g', time: 23, price: 399, bought: 3, seller: 'MediQuick · 3 prices', image: images.homeBanner },
  { id: 'wash', category: 'Personal care', name: 'Gentle Daily Body Wash', detail: '250 ml', time: 21, price: 279, bought: 4, seller: 'CarePoint · 4 prices', image: images.onboardingCards },
  { id: 'wipes', category: 'Personal care', name: 'Gentle Intimate Wipes', detail: '20 wipes', time: 18, price: 149, oldPrice: 162, bought: 6, seller: 'CarePoint · 4 prices', image: images.onboardingCards },
  { id: 'ors', category: 'Daily wellness', name: 'ORS Hydration Sachets', detail: 'Pack of 5', time: 20, price: 170, bought: 5, seller: 'WellMart · 2 prices', image: images.careImage },
  { id: 'protection', category: 'Your favourites', name: 'Ultra Thin Protection', detail: '10 units', time: 9, price: 249, oldPrice: 265, bought: 2, seller: 'MediQuick · 3 prices', image: images.careImage },
  { id: 'first-aid', category: 'Daily wellness', name: 'Everyday First Aid Kit', detail: '6 essential items', time: 9, price: 299, oldPrice: 349, bought: 3, seller: 'MediQuick · 3 prices', image: images.careImage },
  { id: 'spray', category: 'Daily wellness', name: 'Fast-Acting Relief Spray', detail: '55 g', time: 9, price: 189, oldPrice: 210, bought: 2, seller: 'WellMart · 2 prices', image: images.homeBanner },
  { id: 'lubricant', category: 'Personal care', name: 'Water-Based Personal Lubricant', detail: '50 ml', time: 9, price: 299, bought: 2, seller: 'WellMart · 2 prices', image: images.onboardingCards },
];

type Props = NativeStackScreenProps<HomeStackParamList, 'FrequentlyBought'>;

export function FrequentlyBoughtScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const zone = useAppSelector(state => state.zones.selected);
  const category = route.params?.category;
  const visibleProducts = category ? products.filter(item => item.category === category) : products;
  const cardWidth = (width - 36 - 10) / 2;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={navigation.goBack} style={[styles.back, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <ArrowLeft size={18} color={theme.colors.text} />
        </Pressable>
        <AppText weight="800" style={styles.title}>Frequently Bought</AppText>
        <View style={styles.spacer} />
      </View>
      <FlatList
        data={visibleProducts}
        keyExtractor={item => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <>
            <View style={[styles.delivery, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.deliveryIcon, { backgroundColor: theme.isDark ? theme.colors.surfaceMuted : '#DEF5EF' }]}><Zap size={18} color="#078A73" /></View>
              <View style={styles.deliveryCopy}>
                <AppText color={theme.colors.textMuted} weight="700" style={styles.deliveryLabel}>DELIVERING TO</AppText>
                <AppText weight="800" numberOfLines={1} style={styles.location}>{zone?.zone_name ?? 'Rajbagh, Srinagar'}</AppText>
              </View>
              <AppText color={theme.colors.success} weight="800" style={styles.eta}>18–25 min</AppText>
            </View>
            <View style={styles.intro}>
              <AppText color={theme.colors.primary} weight="800" style={styles.eyebrow}>BASED ON YOUR RECENT ORDERS</AppText>
              <AppText weight="800" style={styles.heading}>{category ?? 'Your regular essentials'}</AppText>
              <AppText color={theme.colors.textMuted} style={styles.description}>A simple collection of the products you purchase most often.</AppText>
              <View style={styles.countRow}>
                <AppText weight="800" style={styles.count}>{visibleProducts.length} products</AppText>
                <AppText color={theme.colors.textMuted} style={styles.updated}>Updated from the last 90 days</AppText>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => {
          return (
            <Pressable onPress={() => navigation.navigate('ProductDetails', { product: item })} style={[styles.card, { width: cardWidth, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}>
              <View style={[styles.art, { backgroundColor: theme.colors.surfaceMuted }]}>
                <Image source={item.image} resizeMode="cover" style={styles.image} />
                <View style={styles.badge}><AppText color={theme.colors.primary} weight="800" style={styles.badgeText}>Bought {item.bought}×</AppText></View>
              </View>
              <AppText weight="800" style={styles.name}>{item.name}</AppText>
              <View style={styles.details}><AppText color={theme.colors.textMuted} style={styles.detail}>{item.detail}</AppText><Clock3 size={9} color={theme.colors.textMuted} /><AppText color={theme.colors.textMuted} style={styles.detail}>{item.time} min</AppText></View>
              <AppText color={theme.colors.success} weight="700" style={styles.seller}>● {item.seller}</AppText>
              <View style={styles.purchase}>
                <View style={styles.prices}><AppText weight="800" style={styles.price}>₹{item.price}</AppText>{item.oldPrice ? <AppText color={theme.colors.textMuted} style={styles.oldPrice}>₹{item.oldPrice}</AppText> : null}</View>
                <View style={[styles.add, { backgroundColor: theme.colors.primary }]}><AppText color="#FFFFFF" weight="800" style={styles.addText}>ADD</AppText></View>
              </View>
            </Pressable>
          );
        }}
      />
      <QuickCommerceCartBar bottom={Math.max(insets.bottom, 8)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  spacer: { width: 36 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 23 },
  delivery: { paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  deliveryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deliveryCopy: { flex: 1 },
  deliveryLabel: { fontSize: 7, lineHeight: 10, letterSpacing: 0.5 },
  location: { fontSize: 11, lineHeight: 15 },
  eta: { fontSize: 9, lineHeight: 12 },
  intro: { paddingHorizontal: 18, paddingTop: 14 },
  eyebrow: { fontSize: 8, lineHeight: 11, letterSpacing: 0.7 },
  heading: { marginTop: 4, fontSize: 22, lineHeight: 27, letterSpacing: -0.6 },
  description: { marginTop: 5, fontSize: 9, lineHeight: 14 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 },
  count: { fontSize: 12, lineHeight: 16 },
  updated: { fontSize: 8, lineHeight: 12 },
  row: { paddingHorizontal: 18, gap: 10, marginBottom: 12, alignItems: 'stretch' },
  card: { flexGrow: 0, flexShrink: 0, padding: 5, borderRadius: 13, borderWidth: 1, elevation: 2, shadowOpacity: 0.07, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
  art: { aspectRatio: 1.45, borderRadius: 9, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 5, left: 5, backgroundColor: '#FFFFFF', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 3 },
  badgeText: { fontSize: 7, lineHeight: 9 },
  name: { marginTop: 6, minHeight: 30, fontSize: 11, lineHeight: 13, letterSpacing: -0.2 },
  details: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 3 },
  detail: { fontSize: 8, lineHeight: 11 },
  seller: { fontSize: 7, lineHeight: 10, marginTop: 2, marginBottom: 6 },
  purchase: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 'auto', paddingTop: 3 },
  prices: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 3 },
  price: { fontSize: 11, lineHeight: 15 },
  oldPrice: { fontSize: 7, lineHeight: 10, textDecorationLine: 'line-through' },
  add: { width: '42%', height: 29, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 9, lineHeight: 12 },
});
