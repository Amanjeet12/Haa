import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Product, searchProducts } from '../api/products';
import { images } from '../assets/images';
import { AppText } from '../components';
import { readJson, writeJson } from '../storage/storage';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';
import { toProductDetails } from '../utils/productDetails';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProductSearch'>;

export function ProductSearchScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const zoneId = useAppSelector(state => state.zones.selected?.zone_id);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const requestId = useRef(0);
  const isQuick = route.params.mode === 'quick';
  const recentKey = `@haa/recent-product-searches-${route.params.mode}`;
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    readJson<string[]>(recentKey).then(value => setRecent(value ?? []));
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [recentKey]);

  useEffect(() => {
    if (trimmedQuery.length < 2 || (isQuick && !zoneId)) {
      requestId.current += 1;
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    const timer = setTimeout(async () => {
      const currentRequest = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const data = await searchProducts(
          trimmedQuery,
          isQuick ? 'quick_delivery' : 'ecommerce',
          isQuick ? zoneId : undefined,
        );
        if (currentRequest === requestId.current) setResults(data);
      } catch (caught) {
        if (currentRequest === requestId.current) {
          setResults([]);
          setError(caught instanceof Error ? caught.message : 'Unable to search products.');
        }
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [isQuick, trimmedQuery, zoneId]);

  const saveRecent = useCallback((value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setRecent(current => {
      const next = [clean, ...current.filter(item => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      void writeJson(recentKey, next);
      return next;
    });
  }, [recentKey]);

  const openProduct = (product: Product) => {
    saveRecent(trimmedQuery || product.product_name);
    Keyboard.dismiss();
    navigation.navigate('ProductDetails', {
      product: toProductDetails(product, isQuick ? 'ecommerce' : 'global'),
    });
  };

  const clearRecent = () => {
    setRecent([]);
    void writeJson(recentKey, []);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable accessibilityLabel="Go back" onPress={navigation.goBack} style={[styles.back, { backgroundColor: theme.colors.surface }]}>
          <ChevronLeft color={theme.colors.text} size={20} />
        </Pressable>
        <AppText style={styles.headerTitle} weight="800">Search products</AppText>
        <View style={styles.headerSpacer} />
      </View>
      <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: trimmedQuery ? theme.colors.primary : theme.colors.border }]}>
        <Search color={trimmedQuery ? theme.colors.primary : theme.colors.textMuted} size={19} />
        <TextInput
          ref={inputRef}
          accessibilityLabel="Search products"
          autoCorrect={false}
          onChangeText={setQuery}
          onSubmitEditing={() => saveRecent(trimmedQuery)}
          placeholder="Search medicines & health essentials"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          style={[styles.input, { color: theme.colors.text }]}
          value={query}
        />
        {query ? <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clearButton}><X color={theme.colors.textMuted} size={16} /></Pressable> : null}
      </View>

      {!trimmedQuery ? (
        <View style={styles.recentSection}>
          <View style={styles.sectionRow}>
            <AppText style={styles.sectionTitle} weight="800">Recent searches</AppText>
            {recent.length ? <Pressable onPress={clearRecent}><AppText color={theme.colors.primary} style={styles.clearText} weight="700">Clear all</AppText></Pressable> : null}
          </View>
          {recent.length ? recent.map(item => (
            <Pressable key={item} onPress={() => setQuery(item)} style={[styles.recentItem, { borderBottomColor: theme.colors.border }]}>
              <View style={[styles.historyIcon, { backgroundColor: theme.colors.surfaceMuted }]}><RotateCcw color={theme.colors.textMuted} size={17} /></View>
              <AppText style={styles.recentText}>{item}</AppText>
              <ChevronRight color={theme.colors.textMuted} size={17} />
            </Pressable>
          )) : (
            <View style={styles.emptyRecent}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primarySoft }]}><Search color={theme.colors.primary} size={24} /></View>
              <AppText style={styles.emptyTitle} weight="700">Search for a product</AppText>
              <AppText color={theme.colors.textMuted} style={styles.emptyBody}>Your recent searches will appear here.</AppText>
            </View>
          )}
        </View>
      ) : trimmedQuery.length < 2 ? (
        <StateText text="Type at least 2 characters to search." />
      ) : loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.primary} size="large" /><AppText color={theme.colors.textMuted} style={styles.loadingText}>Finding matching products…</AppText></View>
      ) : error ? (
        <View style={styles.center}><AppText style={styles.emptyTitle} weight="700">Search unavailable</AppText><AppText color={theme.colors.textMuted} style={styles.emptyBody}>{error}</AppText></View>
      ) : (
        <FlatList
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 20, 32) }]}
          data={results}
          keyExtractor={item => String(item.product_id)}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<AppText style={styles.resultsTitle} weight="800">{results.length} product{results.length === 1 ? '' : 's'} found</AppText>}
          ListEmptyComponent={<View style={styles.center}><AppText style={styles.emptyTitle} weight="700">No products found</AppText><AppText color={theme.colors.textMuted} style={styles.emptyBody}>Try a different product name.</AppText></View>}
          renderItem={({ item }) => <ProductResult product={item} onPress={() => openProduct(item)} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function StateText({ text }: { text: string }) {
  const { theme } = useAppTheme();
  return <View style={styles.center}><AppText color={theme.colors.textMuted}>{text}</AppText></View>;
}

function ProductResult({ product, onPress }: { product: Product; onPress: () => void }) {
  const { theme } = useAppTheme();
  const price = Number(product.final_price ?? product.offer_price ?? product.price);
  const listPrice = Number(product.price);
  const brand = product.attributes?.brand || product.vendor?.business_name || 'HAA HEALTH';
  return (
    <Pressable onPress={onPress} style={[styles.resultCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}>
      <Image source={product.images[0]?.url ? { uri: product.images[0].url } : images.careImage} resizeMode="cover" style={styles.productImage} />
      <View style={styles.resultCopy}>
        <AppText color={theme.colors.primary} numberOfLines={1} style={styles.brand} weight="800">{brand.toUpperCase()}</AppText>
        <AppText numberOfLines={2} style={styles.productName} weight="800">{product.product_name}</AppText>
        <AppText color={theme.colors.textMuted} numberOfLines={1} style={styles.detail}>{product.short_description || product.unit}</AppText>
        <View style={styles.priceRow}><AppText style={styles.price} weight="800">₹{price.toLocaleString('en-IN')}</AppText>{listPrice > price ? <AppText color={theme.colors.textMuted} style={styles.oldPrice}>₹{listPrice.toLocaleString('en-IN')}</AppText> : null}</View>
      </View>
      <ChevronRight color={theme.colors.textMuted} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16 },
  back: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 22 },
  headerSpacer: { width: 36 },
  searchBox: { height: 50, flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 16, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13 },
  input: { flex: 1, height: '100%', paddingVertical: 0, fontFamily: 'Geist-Regular', fontSize: 14 },
  clearButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  recentSection: { paddingHorizontal: 16, paddingTop: 24 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 17, lineHeight: 22 },
  clearText: { fontSize: 11 },
  recentItem: { height: 58, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  historyIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  recentText: { flex: 1, fontSize: 13 },
  emptyRecent: { alignItems: 'center', paddingTop: 65 },
  emptyIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  emptyTitle: { fontSize: 15, lineHeight: 20 },
  emptyBody: { marginTop: 4, textAlign: 'center', fontSize: 11, lineHeight: 16 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 65 },
  loadingText: { marginTop: 10, fontSize: 11 },
  list: { paddingHorizontal: 16, paddingTop: 19 },
  resultsTitle: { marginBottom: 11, fontSize: 16, lineHeight: 21 },
  resultCard: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, marginBottom: 10, borderWidth: 1, borderRadius: 16, elevation: 2, shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  productImage: { width: 72, height: 72, flexShrink: 0, borderRadius: 13 },
  resultCopy: { flex: 1, minWidth: 0 },
  brand: { fontSize: 8, lineHeight: 11, letterSpacing: 0.4 },
  productName: { marginTop: 3, fontSize: 13, lineHeight: 17 },
  detail: { marginTop: 3, fontSize: 9, lineHeight: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 7 },
  price: { fontSize: 14, lineHeight: 17 },
  oldPrice: { fontSize: 9, lineHeight: 11, textDecorationLine: 'line-through' },
});
