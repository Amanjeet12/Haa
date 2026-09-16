import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Search from 'lucide-react-native/icons/search';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { AppText } from '../components';
import { LabTestCard, TestTypeTabs } from '../components/labDetails';
import { useAppDispatch, useAppSelector } from '../store';
import {
  addTestToCart,
  removeTestForBeneficiary,
  setCartBeneficiaryTarget,
} from '../store/cartSlice';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'AddPatientTests'>;

export function AddPatientTestsScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const cart = useAppSelector(state => state.cart);
  const { beneficiaryId } = route.params;
  const beneficiary = cart.beneficiaries.find(
    item => item.id === beneficiaryId,
  );
  const [type, setType] = useState<LabTestType>('individual_test');
  const [items, setItems] = useState<LabTestItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<LabTestType, number | null>>({
    individual_test: null,
    health_package: null,
  });

  const load = useCallback(async () => {
    if (cart.labId === null) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getLabTests(cart.labId, type);
      setItems(response.data);
      setCounts(current => ({ ...current, [type]: response.meta.total }));
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to load tests.',
      );
    } finally {
      setLoading(false);
    }
  }, [cart.labId, type]);

  useEffect(() => {
    dispatch(setCartBeneficiaryTarget(beneficiaryId));
  }, [beneficiaryId, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (cart.labId === null) return;
    const otherType: LabTestType =
      type === 'individual_test' ? 'health_package' : 'individual_test';
    if (counts[otherType] !== null) return;
    getLabTests(cart.labId, otherType)
      .then(response =>
        setCounts(current => ({
          ...current,
          [otherType]: response.meta.total,
        })),
      )
      .catch(() => undefined);
  }, [cart.labId, counts, type]);

  const visibleItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search
      ? items.filter(item =>
          `${item.test.test_name} ${item.test.test_code} ${item.test.tags?.join(
            ' ',
          )}`
            .toLowerCase()
            .includes(search),
        )
      : items;
  }, [items, query]);

  const selected = (labTestId: number) =>
    cart.items.some(
      item =>
        item.labTest.lab_test_id === labTestId &&
        item.beneficiaryIds.includes(beneficiaryId),
    );

  const toggleTest = (test: LabTestItem) => {
    if (selected(test.lab_test_id)) {
      dispatch(
        removeTestForBeneficiary({
          labTestId: test.lab_test_id,
          beneficiaryId,
        }),
      );
      return;
    }
    dispatch(
      addTestToCart({
        labName: cart.labName ?? 'Selected lab',
        test,
      }),
    );
  };

  const patientCount = cart.items.filter(item =>
    item.beneficiaryIds.includes(beneficiaryId),
  ).length;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          onPress={navigation.goBack}
          style={[styles.back, { backgroundColor: theme.colors.surface }]}
        >
          <ChevronLeft color={theme.colors.text} size={20} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText style={styles.title} weight="800">
            Add tests
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            For {beneficiary?.name ?? 'patient'} · {cart.labName}
          </AppText>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={visibleItems}
        keyExtractor={item => String(item.lab_test_id)}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 82, 104) },
        ]}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <LabTestCard
              item={item}
              selected={selected(item.lab_test_id)}
              onPress={() => toggleTest(item)}
              onBook={() => toggleTest(item)}
            />
          </View>
        )}
        ListHeaderComponent={
          <View>
            <AppText style={styles.heading} weight="800">
              Choose tests or packages
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.description}>
              Select multiple items for this patient.
            </AppText>
            <TestTypeTabs
              value={type}
              individualCount={counts.individual_test}
              packageCount={counts.health_package}
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
              <Search color={theme.colors.textMuted} size={18} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={`Search within ${cart.labName ?? 'lab'}`}
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, { color: theme.colors.text }]}
              />
            </View>
            <AppText style={styles.listTitle} weight="800">
              {type === 'individual_test'
                ? 'Individual Tests'
                : 'Health Packages'}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <AppText color={theme.colors.textMuted}>
                {error ?? 'No tests found.'}
              </AppText>
            )}
          </View>
        }
      />

      <View
        style={[
          styles.bottom,
          {
            bottom: Math.max(insets.bottom, 12),
            backgroundColor: theme.colors.text,
          },
        ]}
      >
        <View>
          <AppText color="#FFFFFF" style={styles.bottomTitle} weight="800">
            {patientCount} selected
          </AppText>
          <AppText color="#C9D6E0" style={styles.bottomName}>
            {beneficiary?.name}
          </AppText>
        </View>
        <Pressable
          onPress={navigation.goBack}
          style={[styles.done, { backgroundColor: theme.colors.primary }]}
        >
          <AppText color="#FFFFFF" style={styles.doneText} weight="800">
            DONE
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: 36 },
  title: { fontSize: 17, lineHeight: 21 },
  subtitle: { marginTop: 1, fontSize: 8, lineHeight: 10 },
  content: { paddingHorizontal: 14, paddingTop: 16 },
  heading: { fontSize: 20, lineHeight: 25 },
  description: { marginTop: 4, marginBottom: 14, fontSize: 10, lineHeight: 14 },
  search: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  input: { flex: 1, fontSize: 12, paddingVertical: 0 },
  listTitle: { marginTop: 17, marginBottom: 10, fontSize: 15, lineHeight: 19 },
  cardWrap: { marginBottom: 10 },
  empty: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
  bottom: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 66,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 12,
  },
  bottomTitle: { fontSize: 12, lineHeight: 15 },
  bottomName: { marginTop: 2, fontSize: 8, lineHeight: 10 },
  done: {
    height: 42,
    minWidth: 92,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { fontSize: 9, lineHeight: 12 },
});
