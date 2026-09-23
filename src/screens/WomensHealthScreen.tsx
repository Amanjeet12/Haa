import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Clock3 from 'lucide-react-native/icons/clock-3';
import Search from 'lucide-react-native/icons/search';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import Zap from 'lucide-react-native/icons/zap';
import React, { useState } from 'react';
import { FlatList, Image, ImageBackground, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { images } from '../assets/images';
import { AppText } from '../components';
import { LabFilterSheet, LabFilterValues } from '../components/labs';
import { QuickCommerceCartBar } from '../components/quickCommerce/QuickCommerceCartBar';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

const products = [
  { id: 'balance', name: 'Advanced Hormone Balance Complex', detail: '60 capsules', price: 2499, oldPrice: 2799, discount: '11% OFF', seller: 'Evera Wellness · Global', image: images.onboardingCards },
  { id: 'comfort', name: 'Electric Menstrual Comfort Belt', detail: 'USB-C device', price: 3299, oldPrice: 3699, discount: '10% OFF', seller: 'Nova Femme · Global', image: images.homeBanner },
  { id: 'tracking', name: 'Fertility Tracking Sensor Kit', detail: 'Reusable sensor', price: 5999, oldPrice: 6499, discount: '8% OFF', seller: 'Ovia Tech · United States', image: images.careImage },
  { id: 'microbiome', name: 'Daily Intimate Microbiome Care', detail: '30 capsules', price: 2199, oldPrice: 2499, discount: '12% OFF', seller: 'Flora Care · Canada', image: images.homeBanner },
  { id: 'sleep', name: 'Women’s Rest & Sleep Support', detail: '45 capsules', price: 1899, oldPrice: 2099, discount: '9% OFF', seller: 'Evera Wellness · Global', image: images.onboardingCards },
  { id: 'recovery', name: 'Postpartum Recovery Essentials', detail: 'Care kit', price: 3499, oldPrice: 3899, discount: '10% OFF', seller: 'Nova Femme · Global', image: images.careImage },
] as const;

type Props = NativeStackScreenProps<HomeStackParamList, 'WomensHealth'>;
const initialFilters: LabFilterValues = { sort: 'none', price: 'all' };

export function WomensHealthScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const zone = useAppSelector(state => state.zones.selected);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<LabFilterValues>(initialFilters);
  const cardWidth = (width - 28 - 12) / 3;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}><Pressable onPress={navigation.goBack} style={[styles.back, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><ArrowLeft size={18} color={theme.colors.text} /></Pressable><AppText style={styles.title} weight="800">Women’s Health</AppText><View style={styles.spacer} /></View>
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        ListHeaderComponent={<>
          <View style={[styles.delivery, { backgroundColor: theme.colors.surface }]}><View style={[styles.deliveryIcon, { backgroundColor: theme.colors.primarySoft }]}><Zap size={17} color={theme.colors.primary} /></View><View style={styles.deliveryCopy}><AppText color={theme.colors.textMuted} style={styles.deliveryLabel} weight="700">GLOBAL DELIVERY TO</AppText><AppText style={styles.location} weight="800">{zone?.zone_name ?? 'Rajbagh, Srinagar'}</AppText></View><AppText color={theme.colors.primary} style={styles.eta} weight="800">4–10 days</AppText></View>
          <View style={styles.controls}><Pressable style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Search size={17} color={theme.colors.textMuted} /><AppText color={theme.colors.textMuted} style={styles.searchText}>Search women’s health products</AppText></Pressable><Pressable onPress={() => setFiltersOpen(true)} style={[styles.filter, { backgroundColor: theme.colors.text }]}><SlidersHorizontal size={17} color="#FFFFFF" /></Pressable></View>
          <ImageBackground source={images.homeBanner} resizeMode="cover" imageStyle={styles.bannerCorners} style={styles.banner}><LinearGradient colors={['rgba(67,7,31,.96)', 'rgba(139,36,67,.72)', 'rgba(223,120,145,.30)']} style={styles.bannerOverlay}><AppText color="#F9C6D3" style={styles.bannerEyebrow} weight="800">SPECIALIST WOMEN’S CARE</AppText><AppText color="#FFFFFF" style={styles.bannerTitle} weight="800">Everyday hormonal support, from trusted global brands.</AppText><AppText color="#F7DDE4" style={styles.bannerBody}>Thoughtfully selected wellbeing, comfort and tracking essentials.</AppText></LinearGradient></ImageBackground>
          <View style={styles.headingRow}><View><AppText style={styles.heading} weight="800">Women’s & hormonal health</AppText><AppText color={theme.colors.textMuted} style={styles.count}>{products.length} specialist products</AppText></View><AppText color={theme.colors.primary} style={styles.popular} weight="800">Popular</AppText></View>
        </>}
        renderItem={({ item }) => <Pressable onPress={() => navigation.navigate('ProductDetails', { product: item })} style={[styles.card, { width: cardWidth, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}><View style={styles.art}><Image source={item.image} resizeMode="cover" style={styles.image} /><View style={[styles.discount, { backgroundColor: theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.discountText} weight="800">{item.discount}</AppText></View></View><AppText style={styles.name} numberOfLines={2} weight="800">{item.name}</AppText><View style={styles.meta}><AppText color={theme.colors.textMuted} style={styles.metaText}>{item.detail}</AppText><Clock3 size={8} color={theme.colors.textMuted} /><AppText color={theme.colors.textMuted} style={styles.metaText}>4–10 d</AppText></View><AppText color={theme.colors.success} style={styles.seller} numberOfLines={1} weight="700">● {item.seller}</AppText><View style={styles.purchase}><View style={styles.prices}><AppText style={styles.price} weight="800">₹{item.price.toLocaleString('en-IN')}</AppText><AppText color={theme.colors.textMuted} style={styles.oldPrice}>₹{item.oldPrice.toLocaleString('en-IN')}</AppText></View><View style={[styles.add, { backgroundColor: theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.addText} weight="800">ADD</AppText></View></View></Pressable>}
      />
      <QuickCommerceCartBar bottom={Math.max(insets.bottom, 8)} />
      <LabFilterSheet visible={filtersOpen} value={filters} onClose={() => setFiltersOpen(false)} onApply={value => { setFilters(value); setFiltersOpen(false); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth }, back: { width: 36, height: 36, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, title: { flex: 1, textAlign: 'center', fontSize: 17 }, spacer: { width: 36 },
  delivery: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 }, deliveryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, deliveryCopy: { flex: 1 }, deliveryLabel: { fontSize: 7 }, location: { fontSize: 10 }, eta: { fontSize: 8 },
  controls: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 12 }, search: { flex: 1, height: 43, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }, searchText: { fontSize: 9 }, filter: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  banner: { height: 142, marginHorizontal: 14, marginTop: 10, overflow: 'hidden', borderRadius: 16 }, bannerCorners: { borderRadius: 16 }, bannerOverlay: { flex: 1, justifyContent: 'center', padding: 15 }, bannerEyebrow: { fontSize: 7, letterSpacing: 0.7 }, bannerTitle: { width: '70%', marginTop: 6, fontSize: 15, lineHeight: 18 }, bannerBody: { width: '65%', marginTop: 7, fontSize: 7, lineHeight: 10 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: 14, marginBottom: 8 }, heading: { fontSize: 16 }, count: { marginTop: 2, fontSize: 8 }, popular: { fontSize: 9 }, row: { gap: 6, paddingHorizontal: 14, marginBottom: 8 },
  card: { flexGrow: 0, flexShrink: 0, padding: 4, borderWidth: 1, borderRadius: 12, elevation: 2, shadowOpacity: 0.07, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }, art: { aspectRatio: 1.18, overflow: 'hidden', borderRadius: 8 }, image: { width: '100%', height: '100%' }, discount: { position: 'absolute', top: 5, left: 5, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 3 }, discountText: { fontSize: 6 }, name: { minHeight: 29, marginTop: 5, fontSize: 9, lineHeight: 11 }, meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2 }, metaText: { fontSize: 6 }, seller: { marginTop: 2, fontSize: 6 }, purchase: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 }, prices: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 2 }, price: { fontSize: 9 }, oldPrice: { fontSize: 6, textDecorationLine: 'line-through' }, add: { width: '40%', height: 27, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, addText: { fontSize: 7 },
});
