import { formatINR } from '../utils/currency';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Search from 'lucide-react-native/icons/search';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { getLabTests, LabTestItem, LabTestType } from '../api/labTests';
import { LabsPage } from '../api/labs';
import { AppText } from '../components';
import {
  LabDetailsHero,
  LabTestCard,
  TestDetailsSheet,
  TestTypeTabs,
} from '../components/labDetails';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../store';
import {
  addTestToCart,
  removeTestForBeneficiary,
  removeTestFromCart,
} from '../store/cartSlice';

type Props = NativeStackScreenProps<HomeStackParamList, 'LabDetails'>;

export function LabDetailsScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const cart = useAppSelector(state => state.cart);
  const insets = useSafeAreaInsets();
  const { lab, highlightTest } = route.params;
  const listRef = useRef<FlatList<LabTestItem>>(null);
  const hasAutoScrolledRef = useRef(false);
  const triedAlternateTypeRef = useRef(false);
  const scrollRetryRef = useRef(0);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [listReady, setListReady] = useState(false);
  const [type, setType] = useState<LabTestType>(
    highlightTest?.testType ?? 'individual_test',
  );
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<LabTestItem[]>([]);
  const [meta, setMeta] = useState<LabsPage['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Record<LabTestType, number | null>>({
    individual_test: null,
    health_package: null,
  });
  const [selectedTest, setSelectedTest] = useState<LabTestItem | null>(null);
  const [highlightedLabTestId, setHighlightedLabTestId] = useState<
    number | null
  >(null);

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLabTests(Number(lab.id), type);
      setItems(response.data);
      setMeta(response.meta);
      setTotals(current => ({ ...current, [type]: response.meta.total }));
    } catch (nextError) {
      setItems([]);
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to load tests.',
      );
    } finally {
      setLoading(false);
    }
  }, [lab.id, type]);

  const loadMore = useCallback(async () => {
    if (
      !meta?.hasMore ||
      meta.nextStart === null ||
      meta.nextEnd === null ||
      moreLoading
    )
      return;
    setMoreLoading(true);
    try {
      const response = await getLabTests(
        Number(lab.id),
        type,
        meta.nextStart,
        meta.nextEnd,
      );
      setItems(current => {
        const known = new Set(current.map(item => item.lab_test_id));
        return [
          ...current,
          ...response.data.filter(item => !known.has(item.lab_test_id)),
        ];
      });
      setMeta(response.meta);
    } finally {
      setMoreLoading(false);
    }
  }, [lab.id, meta, moreLoading, type]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);
  useEffect(() => {
    getLabTests(Number(lab.id), 'health_package')
      .then(response =>
        setTotals(current => ({
          ...current,
          health_package: response.meta.total,
        })),
      )
      .catch(() => undefined);
  }, [lab.id]);
  const visibleItems = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value
      ? items.filter(item =>
          `${item.test.test_name} ${item.test.test_code} ${item.test.tags?.join(
            ' ',
          )}`
            .toLowerCase()
            .includes(value),
        )
      : items;
  }, [items, query]);

  const highlightedIndex = useMemo(() => {
    if (!highlightTest) return -1;
    return visibleItems.findIndex(item => {
      if (highlightTest.testId !== undefined) {
        return item.test.test_id === highlightTest.testId;
      }
      if (highlightTest.labTestId !== undefined) {
        return item.lab_test_id === highlightTest.labTestId;
      }
      return item.test.test_name
        .trim()
        .toLocaleLowerCase()
        .replace(/\s+/g, ' ')
        .includes(
          highlightTest.testName
            .trim()
            .toLocaleLowerCase()
            .replace(/\s+/g, ' '),
        );
    });
  }, [highlightTest, visibleItems]);

  useEffect(() => {
    if (
      !highlightTest ||
      hasAutoScrolledRef.current ||
      loading ||
      moreLoading
    ) {
      return;
    }

    if (highlightedIndex >= 0 && listReady) {
      const matchedItem = visibleItems[highlightedIndex];
      hasAutoScrolledRef.current = true;
      setHighlightedLabTestId(matchedItem.lab_test_id);
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index: highlightedIndex,
          animated: true,
          viewPosition: 0.25,
        });
      });
      highlightTimerRef.current = setTimeout(
        () => setHighlightedLabTestId(null),
        2600,
      );
      return;
    }

    if (meta?.hasMore) {
      loadMore().catch(() => undefined);
      return;
    }

    if (!triedAlternateTypeRef.current) {
      triedAlternateTypeRef.current = true;
      setQuery('');
      setType(current =>
        current === 'individual_test' ? 'health_package' : 'individual_test',
      );
    }
  }, [
    highlightTest,
    highlightedIndex,
    listReady,
    loadMore,
    loading,
    meta?.hasMore,
    moreLoading,
    visibleItems,
  ]);

  useEffect(
    () => () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    },
    [],
  );
  const heading =
    type === 'individual_test' ? 'Individual Tests' : 'Health Packages';
  const cartTotal = cart.items.reduce(
    (total, entry) =>
      total +
      Number(entry.labTest.offer_price) *
        Math.max(entry.beneficiaryIds.length, 1),
    0,
  );
  const cartCount = cart.items.reduce(
    (count, entry) => count + Math.max(entry.beneficiaryIds.length, 1),
    0,
  );
  const isSelectedForTarget = (labTestId: number) =>
    cart.items.some(
      entry =>
        entry.labTest.lab_test_id === labTestId &&
        (!cart.targetBeneficiaryId ||
          entry.beneficiaryIds.includes(cart.targetBeneficiaryId)),
    );
  const addToCart = (test: LabTestItem) => {
    const alreadySelected = isSelectedForTarget(test.lab_test_id);
    if (alreadySelected) {
      if (cart.targetBeneficiaryId) {
        dispatch(
          removeTestForBeneficiary({
            labTestId: test.lab_test_id,
            beneficiaryId: cart.targetBeneficiaryId,
          }),
        );
      } else {
        dispatch(removeTestFromCart(test.lab_test_id));
      }
      setSelectedTest(null);
      return;
    }
    const add = () => {
      dispatch(addTestToCart({ labName: lab.name, test }));
      setSelectedTest(null);
    };
    if (cart.labId !== null && cart.labId !== test.lab_id) {
      Alert.alert(
        'Replace tests from another lab?',
        `Your cart contains tests from ${cart.labName}. Continuing will clear those tests.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear and add', style: 'destructive', onPress: add },
        ],
      );
    } else add();
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        ref={listRef}
        data={visibleItems}
        keyExtractor={item => String(item.lab_test_id)}
        renderItem={({ item }) => (
          <View style={styles.testWrap}>
            <LabTestCard
              item={item}
              selected={isSelectedForTarget(item.lab_test_id)}
              highlighted={highlightedLabTestId === item.lab_test_id}
              onPress={() => setSelectedTest(item)}
              onBook={() => addToCart(item)}
            />
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        onLayout={() => setListReady(true)}
        onScrollToIndexFailed={info => {
          if (scrollRetryRef.current >= 2) return;
          scrollRetryRef.current += 1;
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
          requestAnimationFrame(() =>
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.25,
            }),
          );
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 86, 100) },
        ]}
        ListHeaderComponent={
          <>
            <LabDetailsHero lab={lab} onBack={navigation.goBack} />
            <View style={styles.body}>
              <AppText style={styles.chooseTitle} weight="800">
                Choose what you need
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.chooseText}>
                Book one standalone diagnostic test, or choose a broader health
                package containing multiple tests.
              </AppText>
              <TestTypeTabs
                value={type}
                individualCount={totals.individual_test}
                packageCount={totals.health_package}
                onChange={setType}
              />
              <View
                style={[
                  styles.search,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Search color={theme.colors.textMuted} size={20} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={`Search within ${lab.name}`}
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontFamily.regular,
                    },
                  ]}
                />
              </View>
              <View style={styles.heading}>
                <View>
                  <AppText style={styles.headingTitle} weight="800">
                    {heading}
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.headingSubtitle}
                  >
                    {type === 'individual_test'
                      ? 'One focused diagnostic test per booking.'
                      : 'Multiple preventive tests in one package.'}
                  </AppText>
                </View>
                <AppText
                  color={theme.colors.primary}
                  style={styles.available}
                  weight="700"
                >
                  {meta?.total ?? items.length} available
                </AppText>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <AppText color={theme.colors.textMuted} style={styles.stateText}>
                Loading {heading.toLowerCase()}…
              </AppText>
            </View>
          ) : error ? (
            <View style={styles.state}>
              <AppText style={styles.stateTitle} weight="700">
                Could not load tests
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.stateText}>
                {error}
              </AppText>
              <Pressable
                onPress={loadFirst}
                style={[
                  styles.retry,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <AppText
                  color={theme.colors.onPrimary}
                  style={styles.retryText}
                  weight="700"
                >
                  Try again
                </AppText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.state}>
              <AppText style={styles.stateTitle} weight="700">
                No {heading.toLowerCase()} found
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.stateText}>
                Try another search or check the other category.
              </AppText>
            </View>
          )
        }
        ListFooterComponent={
          moreLoading ? (
            <ActivityIndicator
              color={theme.colors.primary}
              style={styles.more}
            />
          ) : items.length ? (
            <View style={styles.tip}>
              <ShieldCheck color="#8DD8C8" size={16} />
              <View>
                <AppText color="#FFFFFF" style={styles.tipTitle} weight="700">
                  Clear before you book
                </AppText>
                <AppText color="#C9D6E0" style={styles.tipText}>
                  Every card shows test type, costs, sample, fasting and report
                  timing.
                </AppText>
              </View>
            </View>
          ) : undefined
        }
      />
      {cart.items.length > 0 && (
        <View
          style={[
            styles.bottomBar,
            {
              bottom: insets.bottom,
              backgroundColor: theme.isDark ? '#121C2D' : theme.colors.text,
              borderColor: theme.isDark ? '#3B4A62' : 'transparent',
            },
          ]}
        >
          <View style={styles.thumbnailGroup}>
            {cart.items.slice(0, 3).map((entry, index) => (
              <Image
                key={entry.labTest.lab_test_id}
                resizeMode="cover"
                source={{
                  uri:
                    entry.labTest.test.images?.[0] ?? lab.banner ?? lab.image,
                }}
                style={[
                  styles.cartThumbnail,
                  index > 0 && styles.overlappingThumbnail,
                ]}
              />
            ))}
            {cart.items.length > 3 && (
              <View style={[styles.moreCount, styles.overlappingThumbnail]}>
                <AppText
                  color="#FFFFFF"
                  style={styles.moreCountText}
                  weight="800"
                >
                  +{cart.items.length - 3}
                </AppText>
              </View>
            )}
          </View>
          <View style={styles.cartSummary}>
            <AppText color="#FFFFFF" style={styles.cartTitle} weight="800">
              View cart
            </AppText>
            <AppText color="#C9D6E0" style={styles.cartMeta} weight="600">
              {cartCount} item{cartCount === 1 ? '' : 's'} ·{' '}
              {formatINR(cartTotal)}
            </AppText>
            <AppText
              color="#94A3B8"
              numberOfLines={1}
              style={styles.cartLabName}
              weight="600"
            >
              {cart.labName}
            </AppText>
          </View>
          <Pressable
            onPress={() => navigation.navigate('ReviewBooking')}
            style={[
              styles.catalogue,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <AppText
              color={theme.colors.onPrimary}
              style={styles.viewCartText}
              weight="800"
            >
              VIEW CART
            </AppText>
          </Pressable>
        </View>
      )}
      <TestDetailsSheet
        item={selectedTest}
        lab={lab}
        cartCount={cartCount}
        cartTotal={cartTotal}
        selected={
          selectedTest ? isSelectedForTarget(selectedTest.lab_test_id) : false
        }
        onClose={() => setSelectedTest(null)}
        onBook={addToCart}
        onViewCart={() => {
          setSelectedTest(null);
          navigation.navigate('ReviewBooking');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 100 },
  body: { paddingHorizontal: 18 },
  testWrap: { paddingHorizontal: 18 },
  chooseTitle: { fontSize: 20, lineHeight: 25 },
  chooseText: { marginTop: 5, marginBottom: 15, fontSize: 10, lineHeight: 15 },
  search: {
    height: 54,
    borderWidth: 1,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  input: { flex: 1, height: '100%', paddingVertical: 0, fontSize: 11 },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 11,
  },
  headingTitle: { fontSize: 17, lineHeight: 21 },
  headingSubtitle: { marginTop: 3, fontSize: 9, lineHeight: 12 },
  available: { fontSize: 9, lineHeight: 12 },
  state: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 28 },
  stateTitle: { fontSize: 14, lineHeight: 18 },
  stateText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
  retry: {
    marginTop: 12,
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 9,
  },
  retryText: { fontSize: 9, lineHeight: 12 },
  more: { marginVertical: 16 },
  tip: {
    flexDirection: 'row',
    gap: 8,
    padding: 13,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 13,
    backgroundColor: '#08233D',
  },
  tipTitle: { fontSize: 10, lineHeight: 13 },
  tipText: { marginTop: 2, fontSize: 7, lineHeight: 10 },
  bottomBar: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 0,
    height: 68,
    borderRadius: 21,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumbnailGroup: { flexDirection: 'row', alignItems: 'center' },
  cartThumbnail: {
    width: 38,
    height: 42,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  overlappingThumbnail: { marginLeft: -12 },
  moreCount: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreCountText: { fontSize: 9, lineHeight: 12 },
  cartSummary: { flex: 1, marginLeft: 9 },
  cartTitle: { fontSize: 12, lineHeight: 15 },
  cartMeta: { marginTop: 1, fontSize: 9, lineHeight: 11 },
  cartLabName: { marginTop: 1, fontSize: 7, lineHeight: 9 },
  catalogue: {
    minWidth: 76,
    height: 42,
    borderRadius: 13,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewCartText: { fontSize: 8, lineHeight: 10 },
});
