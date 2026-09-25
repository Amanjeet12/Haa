import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import Search from 'lucide-react-native/icons/search';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  Product,
  getProductsPage,
  getQuickCommerceProductsPage,
} from '../api/products';
import { images } from '../assets/images';
import { AppText } from '../components';
import { CategoryProductsFilterSheet } from '../components/globalStore/CategoryProductsFilterSheet';
import { QuickCommerceCartBar } from '../components/quickCommerce/QuickCommerceCartBar';
import { useAppDispatch, useAppSelector } from '../store';
import {
  addCommerceItem,
  setCommerceItemQuantity,
} from '../store/commerceCartSlice';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';
import { toProductDetails } from '../utils/productDetails';

type Props = NativeStackScreenProps<HomeStackParamList, 'CategoryProducts'>;
type SortOrder = 'default' | 'low' | 'high';

function money(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function CategoryProductsScreen({ navigation, route }: Props) {
  const { category } = route.params;
  const isQuickCommerce = route.params.mode === 'quick';
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const cart = useAppSelector(state => state.commerceCart);
  const selectedZone = useAppSelector(state => state.zones.selected);
  const selectedZoneId = selectedZone?.zone_id;
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [subCategoryId, setSubCategoryId] = useState<number | null>(
    route.params.subCategoryId ?? null,
  );
  const [sort, setSort] = useState<SortOrder>('default');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const requestVersion = useRef(0);
  const cardWidth = (width - 28 - 10) / 2;
  const activeSubCategories = category.sub_categories.filter(
    item => item.isActive,
  );

  const loadProducts = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setProducts([]);
    setNextPage(null);
    try {
      if (isQuickCommerce && !selectedZoneId)
        throw new Error('Choose a delivery location to see products.');
      const page = isQuickCommerce
        ? await getQuickCommerceProductsPage(
            selectedZoneId!,
            category.category_id,
            subCategoryId ?? undefined,
          )
        : await getProductsPage(
            category.category_id,
            subCategoryId ?? undefined,
          );
      if (version !== requestVersion.current) return;
      setProducts(page.data);
      setNextPage(
        page.meta?.hasMore &&
          page.meta.nextStart !== null &&
          page.meta.nextEnd !== null
          ? { start: page.meta.nextStart, end: page.meta.nextEnd }
          : null,
      );
    } catch (cause) {
      if (version !== requestVersion.current) return;
      setProducts([]);
      setNextPage(null);
      setError(
        cause instanceof Error ? cause.message : 'Unable to load products.',
      );
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [category.category_id, isQuickCommerce, selectedZoneId, subCategoryId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const loadMore = useCallback(async () => {
    if (!nextPage || loadingMore || loading) return;
    const version = requestVersion.current;
    setLoadingMore(true);
    try {
      if (isQuickCommerce && !selectedZoneId) return;
      const page = isQuickCommerce
        ? await getQuickCommerceProductsPage(
            selectedZoneId!,
            category.category_id,
            subCategoryId ?? undefined,
            nextPage.start,
            nextPage.end,
          )
        : await getProductsPage(
            category.category_id,
            subCategoryId ?? undefined,
            nextPage.start,
            nextPage.end,
          );
      if (version !== requestVersion.current) return;
      setProducts(current => {
        const known = new Set(current.map(product => product.product_id));
        return [
          ...current,
          ...page.data.filter(product => !known.has(product.product_id)),
        ];
      });
      setNextPage(
        page.meta?.hasMore &&
          page.meta.nextStart !== null &&
          page.meta.nextEnd !== null
          ? { start: page.meta.nextStart, end: page.meta.nextEnd }
          : null,
      );
    } catch {
      if (version === requestVersion.current) setNextPage(null);
    } finally {
      if (version === requestVersion.current) setLoadingMore(false);
    }
  }, [
    category.category_id,
    isQuickCommerce,
    loading,
    loadingMore,
    nextPage,
    selectedZoneId,
    subCategoryId,
  ]);

  const visibleProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = products.filter(
      product =>
        (subCategoryId === null || product.sub_category_id === subCategoryId) &&
        (!search ||
          `${product.product_name} ${product.attributes?.brand ?? ''} ${
            product.short_description ?? ''
          }`
            .toLowerCase()
            .includes(search)),
    );
    if (sort === 'default') return filtered;
    return [...filtered].sort((a, b) =>
      sort === 'low'
        ? Number(a.final_price ?? a.offer_price ?? a.price) -
          Number(b.final_price ?? b.offer_price ?? b.price)
        : Number(b.final_price ?? b.offer_price ?? b.price) -
          Number(a.final_price ?? a.offer_price ?? a.price),
    );
  }, [products, query, sort, subCategoryId]);

  const addProduct = (product: Product) =>
    dispatch(
      addCommerceItem({
        source: isQuickCommerce ? 'ecommerce' : 'global',
        product: {
          id: String(product.product_id),
          name: product.product_name,
          price: Number(
            product.final_price ?? product.offer_price ?? product.price,
          ),
          image: product.images[0]?.url ?? images.careImage,
          detail: product.short_description ?? product.unit,
          brand: product.attributes?.brand,
          vendorName: product.vendor?.business_name,
          estimatedDelivery: product.attributes?.estimated_delivery,
          zoneId: isQuickCommerce ? selectedZoneId : undefined,
        },
      }),
    );

  const removeProduct = (product: Product) => {
    const item = cart.items.find(
      candidate => candidate.id === String(product.product_id),
    );
    if (item && cart.source === (isQuickCommerce ? 'ecommerce' : 'global'))
      dispatch(
        setCommerceItemQuantity({ id: item.id, quantity: item.quantity - 1 }),
      );
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Go back"
          onPress={navigation.goBack}
          style={[styles.back, { borderColor: theme.colors.border }]}
        >
          <ArrowLeft color={theme.colors.text} size={19} />
        </Pressable>
        <AppText numberOfLines={1} style={styles.headerTitle} weight="800">
          {category.category_name}
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={visibleProducts}
        keyExtractor={item => String(item.product_id)}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <>
            <View
              style={[
                styles.delivery,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View
                style={[
                  styles.deliveryIcon,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <AppText color={theme.colors.primary} weight="800">
                  ✦
                </AppText>
              </View>
              <View style={styles.deliveryCopy}>
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.deliveryEyebrow}
                  weight="700"
                >
                  {isQuickCommerce ? 'DELIVERING TO' : 'GLOBAL STORE'}
                </AppText>
                <AppText style={styles.deliveryTitle} weight="800">
                  {isQuickCommerce
                    ? selectedZone?.zone_name ?? 'Choose your location'
                    : 'Health essentials delivered to you'}
                </AppText>
              </View>
            </View>
            <View style={styles.controls}>
              <View
                style={[
                  styles.search,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Search color={theme.colors.textMuted} size={18} />
                <TextInput
                  accessibilityLabel={`Search ${category.category_name} products`}
                  placeholder={`Search ${category.category_name.toLowerCase()}`}
                  placeholderTextColor={theme.colors.textMuted}
                  value={query}
                  onChangeText={setQuery}
                  style={[styles.searchInput, { color: theme.colors.text }]}
                />
              </View>
              <Pressable
                accessibilityLabel="Filter products"
                onPress={() => setFiltersOpen(true)}
                style={[
                  styles.sortButton,
                  { backgroundColor: theme.colors.text },
                ]}
              >
                <SlidersHorizontal color={theme.colors.surface} size={17} />
                {subCategoryId !== null || sort !== 'default' ? (
                  <View
                    style={[
                      styles.filterDot,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                ) : null}
              </Pressable>
            </View>
            <ImageBackground
              source={
                category.image?.url
                  ? { uri: category.image.url }
                  : images.careImage
              }
              resizeMode="cover"
              style={styles.banner}
              imageStyle={styles.bannerImage}
            >
              <LinearGradient
                colors={[
                  'rgba(3,29,50,.92)',
                  'rgba(3,70,94,.76)',
                  'rgba(0,172,194,.25)',
                ]}
                style={styles.bannerOverlay}
              >
                <AppText
                  color="#9BE8EA"
                  style={styles.bannerEyebrow}
                  weight="800"
                >
                  {isQuickCommerce ? 'QUICK COMMERCE' : 'SHOP BY NEED'}
                </AppText>
                <AppText
                  color="#FFFFFF"
                  style={styles.bannerTitle}
                  weight="800"
                >
                  {category.category_name}
                </AppText>
                {category.description ? (
                  <AppText
                    color="#DFE8EE"
                    numberOfLines={2}
                    style={styles.bannerDescription}
                  >
                    {category.description}
                  </AppText>
                ) : null}
              </LinearGradient>
            </ImageBackground>
            <View style={styles.productsHeading}>
              <View>
                <AppText style={styles.sectionTitle} weight="800">
                  {subCategoryId === null
                    ? 'All products'
                    : activeSubCategories.find(
                        item => item.sub_category_id === subCategoryId,
                      )?.sub_category_name}
                </AppText>
                <AppText color={theme.colors.textMuted} style={styles.count}>
                  {visibleProducts.length} item
                  {visibleProducts.length === 1 ? '' : 's'}
                </AppText>
              </View>
              {sort !== 'default' ? (
                <AppText
                  color={theme.colors.primary}
                  style={styles.sortLabel}
                  weight="700"
                >
                  Price: {sort === 'low' ? 'low to high' : 'high to low'}
                </AppText>
              ) : null}
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={theme.colors.primary}
              style={styles.state}
            />
          ) : (
            <View style={styles.state}>
              <AppText style={styles.emptyTitle} weight="800">
                {error ? 'Could not load products' : 'No products found'}
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.emptyText}>
                {error ?? 'Try another subcategory or search.'}
              </AppText>
              {error ? (
                <Pressable
                  onPress={loadProducts}
                  style={[
                    styles.retry,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <AppText color="#FFFFFF" weight="800">
                    Try again
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              color={theme.colors.primary}
              style={styles.moreLoader}
            />
          ) : undefined
        }
        renderItem={({ item }) => {
          const price = Number(
            item.final_price ?? item.offer_price ?? item.price,
          );
          const listPrice = Number(item.price);
          const quantity =
            cart.source === (isQuickCommerce ? 'ecommerce' : 'global')
              ? cart.items.find(
                  candidate => candidate.id === String(item.product_id),
                )?.quantity ?? 0
              : 0;
          return (
            <Pressable
              onPress={() =>
                navigation.navigate('ProductDetails', {
                  product: toProductDetails(
                    item,
                    isQuickCommerce ? 'ecommerce' : 'global',
                  ),
                })
              }
              style={[
                styles.card,
                {
                  width: cardWidth,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow,
                },
              ]}
            >
              <View style={styles.art}>
                <Image
                  source={
                    item.images[0]?.url
                      ? { uri: item.images[0].url }
                      : images.careImage
                  }
                  style={styles.productImage}
                  resizeMode="cover"
                />
                {item.discount_percentage > 0 ? (
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
                      {Math.round(item.discount_percentage)}% OFF
                    </AppText>
                  </View>
                ) : null}
              </View>
              <View style={styles.cardBody}>
                <AppText
                  color={theme.colors.primary}
                  numberOfLines={1}
                  style={styles.brand}
                  weight="800"
                >
                  {(
                    item.attributes?.brand ??
                    item.vendor?.business_name ??
                    'HAA HEALTH'
                  ).toUpperCase()}
                </AppText>
                <AppText
                  numberOfLines={2}
                  style={styles.productName}
                  weight="800"
                >
                  {item.product_name}
                </AppText>
                <AppText
                  color={theme.colors.textMuted}
                  numberOfLines={1}
                  style={styles.productDetail}
                >
                  {item.short_description ?? item.unit}
                </AppText>
                <View style={styles.priceRow}>
                  <AppText style={styles.price} weight="800">
                    {money(price)}
                  </AppText>
                  {listPrice > price ? (
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.oldPrice}
                    >
                      {money(listPrice)}
                    </AppText>
                  ) : null}
                </View>
                <AppText color={theme.colors.textMuted} style={styles.eta}>
                  {item.attributes?.estimated_delivery
                    ? `Arrives in ${item.attributes.estimated_delivery}`
                    : 'Delivery estimate at checkout'}
                </AppText>
                {quantity > 0 ? (
                  <View
                    style={[
                      styles.quantityRow,
                      { backgroundColor: theme.colors.primarySoft },
                    ]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove one ${item.product_name}`}
                      onPress={event => {
                        event.stopPropagation();
                        removeProduct(item);
                      }}
                      style={styles.quantityButton}
                    >
                      <View
                        style={[
                          styles.quantityIcon,
                          { backgroundColor: theme.colors.surface },
                        ]}
                      >
                        <Minus
                          color={theme.colors.primary}
                          size={18}
                          strokeWidth={2.5}
                        />
                      </View>
                    </Pressable>
                    <View
                      style={styles.quantityCopy}
                      accessibilityLiveRegion="polite"
                    >
                      <AppText style={styles.quantityText} weight="800">
                        {quantity}
                      </AppText>
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.quantityCaption}
                        weight="600"
                      >
                        in bag
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Add one ${item.product_name}`}
                      onPress={event => {
                        event.stopPropagation();
                        addProduct(item);
                      }}
                      style={styles.quantityButton}
                    >
                      <View
                        style={[
                          styles.quantityIcon,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Plus color="#FFFFFF" size={18} strokeWidth={2.5} />
                      </View>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    disabled={!item.is_in_stock}
                    onPress={event => {
                      event.stopPropagation();
                      addProduct(item);
                    }}
                    style={[
                      styles.add,
                      {
                        borderColor: item.is_in_stock
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <AppText
                      color={
                        item.is_in_stock
                          ? theme.colors.primary
                          : theme.colors.textMuted
                      }
                      style={styles.addText}
                      weight="800"
                    >
                      {item.is_in_stock ? 'ADD TO BAG' : 'OUT OF STOCK'}
                    </AppText>
                  </Pressable>
                )}
              </View>
            </Pressable>
          );
        }}
      />
      <QuickCommerceCartBar
        bottom={Math.max(insets.bottom, 8)}
        onPress={() => navigation.getParent()?.navigate('Cart')}
      />
      <CategoryProductsFilterSheet
        visible={filtersOpen}
        subCategories={activeSubCategories}
        value={{ subCategoryId, sort }}
        onClose={() => setFiltersOpen(false)}
        onApply={value => {
          setSubCategoryId(value.subCategoryId);
          setSort(value.sort);
          setFiltersOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  back: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 23 },
  headerSpacer: { width: 38 },
  delivery: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 15,
  },
  deliveryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryCopy: { flex: 1 },
  deliveryEyebrow: { fontSize: 7, lineHeight: 10, letterSpacing: 0.4 },
  deliveryTitle: { marginTop: 1, fontSize: 10, lineHeight: 14 },
  controls: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  search: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
  },
  searchInput: { flex: 1, padding: 0, fontSize: 11 },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  banner: {
    height: 145,
    marginHorizontal: 14,
    marginTop: 11,
    overflow: 'hidden',
    borderRadius: 16,
  },
  bannerImage: { borderRadius: 16 },
  bannerOverlay: { flex: 1, justifyContent: 'center', padding: 15 },
  bannerEyebrow: { fontSize: 8, lineHeight: 11, letterSpacing: 0.6 },
  bannerTitle: { maxWidth: '78%', marginTop: 6, fontSize: 19, lineHeight: 23 },
  bannerDescription: {
    maxWidth: '76%',
    marginTop: 5,
    fontSize: 9,
    lineHeight: 13,
  },
  sectionTitle: { fontSize: 17, lineHeight: 22 },
  productsHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginHorizontal: 14,
    marginTop: 18,
    marginBottom: 10,
  },
  count: { marginTop: 2, fontSize: 8, lineHeight: 11 },
  sortLabel: { fontSize: 8, lineHeight: 11 },
  productRow: { gap: 10, paddingHorizontal: 14, marginBottom: 10 },
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 15,
    elevation: 2,
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  art: { aspectRatio: 1.45, overflow: 'hidden', backgroundColor: '#E8F1F3' },
  productImage: { width: '100%', height: '100%' },
  discount: {
    position: 'absolute',
    left: 7,
    top: 7,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  discountText: { fontSize: 7, lineHeight: 10 },
  cardBody: { flex: 1, minHeight: 145, padding: 9 },
  quickCardBody: { minHeight: 125 },
  brand: { fontSize: 7, lineHeight: 10, letterSpacing: 0.3 },
  productName: { marginTop: 3, fontSize: 11, lineHeight: 14 },
  productDetail: { marginTop: 4, fontSize: 8, lineHeight: 11 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 7,
  },
  price: { fontSize: 13, lineHeight: 16 },
  oldPrice: { fontSize: 8, lineHeight: 11, textDecorationLine: 'line-through' },
  eta: { marginTop: 3, fontSize: 7, lineHeight: 10 },
  quickAction: { marginTop: 'auto', paddingTop: 8, alignItems: 'flex-end' },
  quickAdd: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStepper: {
    height: 36,
    borderWidth: 1.5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStepperButton: {
    width: 31,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickQuantity: {
    minWidth: 19,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  add: {
    height: 38,
    marginTop: 'auto',
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { fontSize: 9, lineHeight: 12 },
  quantityRow: {
    height: 38,
    marginTop: 'auto',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityButton: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityCopy: { flex: 1, alignItems: 'center' },
  quantityText: { fontSize: 13, lineHeight: 16, fontVariant: ['tabular-nums'] },
  quantityCaption: { fontSize: 7, lineHeight: 9 },
  state: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyTitle: { fontSize: 14, lineHeight: 18 },
  emptyText: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
  retry: {
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  moreLoader: { marginVertical: 16 },
});
