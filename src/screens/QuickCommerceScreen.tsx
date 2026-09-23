import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Bandage from 'lucide-react-native/icons/bandage';
import HeartPulse from 'lucide-react-native/icons/heart-pulse';
import PackageCheck from 'lucide-react-native/icons/package-check';
import Pill from 'lucide-react-native/icons/pill';
import Search from 'lucide-react-native/icons/search';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Zap from 'lucide-react-native/icons/zap';
import React, { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { images } from '../assets/images';
import { AppText } from '../components';
import { LabFilterSheet, LabFilterValues } from '../components/labs';
import { FrequentlyBoughtSection } from '../components/quickCommerce/FrequentlyBoughtSection';
import { FirstAidWellnessSection } from '../components/quickCommerce/FirstAidWellnessSection';
import { QuickCommerceCartBar } from '../components/quickCommerce/QuickCommerceCartBar';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'QuickCommerce'>;
const initialFilters: LabFilterValues = { sort: 'none', price: 'all' };
const categories = [
  { label: 'All', icon: HeartPulse, colors: ['#08BED1', '#8FE7E7'] },
  { label: 'Protection', icon: PackageCheck, colors: ['#BDE2E3', '#E8F3F4'] },
  { label: 'First aid', icon: Bandage, colors: ['#07B9CE', '#8BE7E7'] },
  { label: 'Wellness', icon: Pill, colors: ['#F4A3B0', '#FBE6EA'] },
  { label: 'Personal care', icon: Sparkles, colors: ['#E7D8F4', '#F7F0FA'] },
] as const;

export function QuickCommerceScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const selectedZone = useAppSelector(state => state.zones.selected);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<LabFilterValues>(initialFilters);
  const appliedCount = Number(filters.sort !== 'none') + Number(filters.price !== 'all');

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Pressable accessibilityLabel="Go back" hitSlop={8} onPress={navigation.goBack} style={[styles.back, { borderColor: theme.colors.border }]}>
          <ArrowLeft color={theme.colors.text} size={21} />
        </Pressable>
        <AppText style={styles.title} weight="800">Quick Commerce</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 104 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.delivery, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.deliveryIcon, { backgroundColor: theme.colors.primarySoft }]}>
            <Zap color={theme.colors.primary} fill={theme.colors.primary} size={19} />
          </View>
          <View style={styles.deliveryCopy}>
            <AppText color={theme.colors.textMuted} style={styles.deliveryLabel} weight="700">DELIVERING TO</AppText>
            <AppText numberOfLines={1} style={styles.deliveryPlace} weight="800">{selectedZone?.zone_name ?? 'Rajbagh, Srinagar'}</AppText>
          </View>
          <AppText color={theme.colors.success} style={styles.etaText} weight="800">18–25 min</AppText>
        </View>

        <View style={styles.controls}>
          <Pressable accessibilityHint="Product search will open on a separate page" accessibilityLabel="Search medicines and health essentials" accessibilityRole="button" style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}>
            <Search color={theme.colors.text} size={19} />
            <AppText color={theme.colors.textMuted} style={styles.searchText}>Search medicines & health essentials</AppText>
          </Pressable>
          <Pressable accessibilityLabel={`Filter products. ${appliedCount} filters applied`} onPress={() => setFiltersOpen(true)} style={[styles.filter, { backgroundColor: theme.colors.text, borderColor: theme.colors.text }]}>
            <SlidersHorizontal color="#FFFFFF" size={16} />
            <AppText color="#FFFFFF" style={styles.filterText} weight="700">Filter</AppText>
            <View style={styles.filterCount}><AppText color={theme.colors.primary} style={styles.countText} weight="800">{appliedCount}</AppText></View>
          </Pressable>
        </View>

        <ImageBackground imageStyle={styles.bannerImage} resizeMode="cover" source={images.onboardingCards} style={styles.banner}>
          <LinearGradient colors={['rgba(5,31,53,.94)', 'rgba(5,31,53,.64)', 'rgba(5,31,53,.14)']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.bannerOverlay}>
            <AppText color="#FFFFFF" style={styles.brand} weight="800">haå</AppText>
            <AppText color="#FFFFFF" style={styles.bannerTitle} weight="800">Health essentials.{`\n`}<AppText color="#FF6674" style={styles.bannerTitle} weight="800">Delivered in minutes.</AppText></AppText>
            <AppText color="#DFE8EE" style={styles.bannerBody}>Quick. Reliable. Right to your doorstep.</AppText>
            <View style={styles.orderPill}><Zap color="#FFFFFF" size={12} /><AppText color="#FFFFFF" style={styles.orderText} weight="700">Order now</AppText></View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.sectionHeading}>
          <AppText style={styles.sectionTitle} weight="800">Categories</AppText>
          <AppText color={theme.colors.textMuted} style={styles.swipeText}>Swipe to explore</AppText>
        </View>
        <ScrollView contentContainerStyle={styles.categories} horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(({ label, icon: Icon, colors }, index) => (
            <View key={label} style={styles.category}>
              <LinearGradient colors={[...colors]} style={[styles.categoryArt, index === 0 && { borderColor: theme.colors.primary }]}>
                <Icon color={theme.colors.text} size={30} strokeWidth={1.8} />
              </LinearGradient>
              <AppText color={index === 0 ? theme.colors.primary : theme.colors.text} style={styles.categoryLabel} weight="700">{label}</AppText>
            </View>
          ))}
        </ScrollView>
        <FrequentlyBoughtSection
          onGroupPress={category => navigation.navigate('FrequentlyBought', { category })}
          onSeeAll={() => navigation.navigate('FrequentlyBought')}
        />
        <FirstAidWellnessSection onSeeAll={() => navigation.navigate('FirstAid')} />
      </ScrollView>

      <QuickCommerceCartBar bottom={Math.max(insets.bottom, 8)} />

      <LabFilterSheet visible={filtersOpen} value={filters} onClose={() => setFiltersOpen(false)} onApply={value => { setFilters(value); setFiltersOpen(false); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  back: { width: 40, height: 40, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 20, lineHeight: 25 },
  headerSpacer: { width: 40 },
  content: { paddingBottom: 28 },
  delivery: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 20 },
  deliveryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deliveryCopy: { flex: 1 },
  deliveryLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 0.4 },
  deliveryPlace: { marginTop: 2, fontSize: 13, lineHeight: 17 },
  etaText: { fontSize: 12, lineHeight: 15 },
  controls: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 14 },
  search: { flex: 1, height: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, elevation: 2, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  searchText: { flex: 1, fontSize: 11, lineHeight: 14 },
  filter: { height: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  filterText: { fontSize: 11, lineHeight: 14 },
  filterCount: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 9, lineHeight: 11 },
  banner: { height: 185, marginHorizontal: 18, marginTop: 13, overflow: 'hidden', borderRadius: 18 },
  bannerImage: { borderRadius: 18 },
  bannerOverlay: { flex: 1, padding: 15 },
  brand: { fontSize: 20, lineHeight: 23, letterSpacing: -0.8 },
  bannerTitle: { marginTop: 7, fontSize: 20, lineHeight: 21 },
  bannerBody: { marginTop: 7, fontSize: 8, lineHeight: 11 },
  orderPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, marginTop: 13, borderRadius: 9, backgroundColor: '#DF1F2D', paddingHorizontal: 10, paddingVertical: 6 },
  orderText: { fontSize: 9, lineHeight: 11 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 19, lineHeight: 23 },
  swipeText: { fontSize: 10, lineHeight: 13 },
  categories: { gap: 9, paddingHorizontal: 18 },
  category: { width: 76, alignItems: 'center' },
  categoryArt: { width: 76, height: 78, borderWidth: 2, borderColor: 'transparent', borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { marginTop: 7, textAlign: 'center', fontSize: 10, lineHeight: 12 },
});
