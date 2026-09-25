import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Globe from 'lucide-react-native/icons/globe';
import PackageCheck from 'lucide-react-native/icons/package-check';
import Search from 'lucide-react-native/icons/search';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import Zap from 'lucide-react-native/icons/zap';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { images } from '../assets/images';
import { getProductCategories, ProductCategory } from '../api/productCategories';
import { getProducts, Product } from '../api/products';
import { AppText } from '../components';
import { LabFilterSheet, LabFilterValues } from '../components/labs';
import { WomensHormonalSection } from '../components/globalStore/WomensHormonalSection';
import { QuickCommerceCartBar } from '../components/quickCommerce/QuickCommerceCartBar';
import { useAppDispatch, useAppSelector } from '../store';
import { addCommerceItem, setCommerceItemQuantity } from '../store/commerceCartSlice';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';
import { toProductDetails } from '../utils/productDetails';

type Props = NativeStackScreenProps<HomeStackParamList, 'GlobalStore'>;
const initialFilters: LabFilterValues = { sort: 'none', price: 'all' };
type ProductSection = {
  categoryId: number;
  subCategoryId: number;
  title: string;
  description: string | null;
  products: Product[];
};

export function GlobalStoreScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const selectedZone = useAppSelector(state => state.zones.selected);
  const commerceCart = useAppSelector(state => state.commerceCart);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<LabFilterValues>(initialFilters);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [productSections, setProductSections] = useState<ProductSection[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const appliedCount = Number(filters.sort !== 'none') + Number(filters.price !== 'all');
  const globalQuantities = commerceCart.source === 'global' ? Object.fromEntries(commerceCart.items.map(item => [Number(item.id), item.quantity])) : {};

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setProductsLoading(true);
    setCategoriesError(null);
    try {
      const nextCategories = await getProductCategories();
      setCategories(nextCategories);
      const selections = nextCategories.flatMap(category => {
        const subCategory = category.sub_categories.find(item => item.isActive);
        return subCategory ? [{ category, subCategory }] : [];
      });
      const sections = await Promise.all(selections.map(async ({ category, subCategory }) => {
        try {
          const products = await getProducts(category.category_id, subCategory.sub_category_id);
          return {
            categoryId: category.category_id,
            subCategoryId: subCategory.sub_category_id,
            title: subCategory.sub_category_name,
            description: subCategory.description,
            products,
          };
        } catch {
          return null;
        }
      }));
      setProductSections(sections.filter((section): section is ProductSection => Boolean(section?.products.length)));
    } catch (error) {
      setCategoriesError(error instanceof Error ? error.message : 'Unable to load categories.');
    } finally {
      setCategoriesLoading(false);
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Pressable accessibilityLabel="Go back" hitSlop={8} onPress={navigation.goBack} style={[styles.back, { borderColor: theme.colors.border }]}>
          <ArrowLeft color={theme.colors.text} size={21} />
        </Pressable>
        <AppText style={styles.title} weight="800">Global Store</AppText>
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

        <View style={styles.benefits}>
          <View style={[styles.benefitCard, { backgroundColor: theme.colors.surface }]}><ShieldCheck color={theme.colors.primary} size={20} /><AppText style={styles.benefitTitle} weight="800">Authenticity{`\n`}checked</AppText><AppText color={theme.colors.textMuted} style={styles.benefitText}>Verified before dispatch</AppText></View>
          <View style={[styles.benefitCard, { backgroundColor: theme.colors.surface }]}><Globe color={theme.colors.primary} size={20} /><AppText style={styles.benefitTitle} weight="800">Clear landed{`\n`}cost</AppText><AppText color={theme.colors.textMuted} style={styles.benefitText}>Duties shown upfront</AppText></View>
          <View style={[styles.benefitCard, { backgroundColor: theme.colors.surface }]}><PackageCheck color={theme.colors.primary} size={20} /><AppText style={styles.benefitTitle} weight="800">Protected{`\n`}delivery</AppText><AppText color={theme.colors.textMuted} style={styles.benefitText}>Tracked to your door</AppText></View>
        </View>

        <View style={styles.needHeader}><View><AppText style={styles.needTitle} weight="800">Shop by need</AppText><AppText color={theme.colors.textMuted} style={styles.needSubtitle}>Specialist care categories</AppText></View></View>
        {categoriesLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.categoriesState} />
        ) : categoriesError ? (
          <Pressable accessibilityRole="button" onPress={loadCategories} style={styles.categoriesState}>
            <AppText color={theme.colors.textMuted} style={styles.categoriesError}>Could not load categories. Tap to retry.</AppText>
          </Pressable>
        ) : (
          <ScrollView contentContainerStyle={styles.needRow} horizontal showsHorizontalScrollIndicator={false}>
            {categories.map(item => (
              <Pressable key={item.category_id} onPress={() => navigation.navigate('CategoryProducts', { category: item })} style={[styles.needCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <ImageBackground
                  accessibilityLabel={item.image?.alt || item.category_name}
                  source={item.image?.url ? { uri: item.image.url } : images.careImage}
                  resizeMode="cover"
                  style={styles.needImage}
                  imageStyle={styles.needImageCorners}
                />
                <AppText style={styles.needLabel} numberOfLines={2} weight="800">{item.category_name}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <ImageBackground source={images.homeBanner} resizeMode="cover" style={styles.lifestyle} imageStyle={styles.lifestyleCorners} />

        {productsLoading ? <ActivityIndicator color={theme.colors.primary} style={styles.productsLoader} /> : productSections.map(section => (
          <WomensHormonalSection
            description={section.description}
            key={`${section.categoryId}-${section.subCategoryId}`}
            onAdd={product => dispatch(addCommerceItem({
              source: 'global',
              product: {
                id: String(product.product_id),
                name: product.product_name,
                price: Number(product.final_price ?? product.offer_price ?? product.price),
                image: product.images[0]?.url ?? '',
                detail: product.short_description ?? product.unit,
                brand: product.attributes?.brand,
                vendorName: product.vendor?.business_name,
                estimatedDelivery: product.attributes?.estimated_delivery,
              },
            }))}
            onRemove={product => {
              const item = commerceCart.items.find(candidate => candidate.id === String(product.product_id));
              if (item) dispatch(setCommerceItemQuantity({ id: item.id, quantity: item.quantity - 1 }));
            }}
            onProductPress={product => navigation.navigate('ProductDetails', { product: toProductDetails(product) })}
            products={section.products}
            quantities={globalQuantities}
            title={section.title}
          />
        ))}

      </ScrollView>

      <QuickCommerceCartBar bottom={Math.max(insets.bottom, 8)} onPress={() => navigation.getParent()?.navigate('Cart')} />

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
  benefits: { flexDirection: 'row', gap: 9, paddingHorizontal: 18, marginTop: 14 },
  benefitCard: { flex: 1, minWidth: 0, minHeight: 103, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 10 },
  benefitTitle: { marginTop: 7, textAlign: 'center', fontSize: 11, lineHeight: 13 },
  benefitText: { marginTop: 5, textAlign: 'center', fontSize: 7, lineHeight: 10 },
  needHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginTop: 17, marginBottom: 9 },
  needTitle: { fontSize: 20, lineHeight: 24 }, needSubtitle: { marginTop: 3, fontSize: 9, lineHeight: 12 },
  categoriesState: { minHeight: 140, alignItems: 'center', justifyContent: 'center', marginHorizontal: 18 },
  categoriesError: { textAlign: 'center', fontSize: 10, lineHeight: 14 },
  productsLoader: { marginVertical: 34 },
  needRow: { gap: 10, paddingHorizontal: 18 },
  needCard: { width: 121, overflow: 'hidden', borderWidth: 1, borderRadius: 16 },
  needImage: { height: 96 }, needImageCorners: { borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  needLabel: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 10, fontSize: 11, lineHeight: 14 },
  lifestyle: { height: 150, marginHorizontal: 18, marginTop: 14, overflow: 'hidden', borderRadius: 18 }, lifestyleCorners: { borderRadius: 18 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 19, lineHeight: 23 },
  swipeText: { fontSize: 10, lineHeight: 13 },
  categories: { gap: 9, paddingHorizontal: 18 },
  category: { width: 76, alignItems: 'center' },
  categoryArt: { width: 76, height: 78, borderWidth: 2, borderColor: 'transparent', borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { marginTop: 7, textAlign: 'center', fontSize: 10, lineHeight: 12 },
});
