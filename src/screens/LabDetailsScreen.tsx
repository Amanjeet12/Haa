import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Search from 'lucide-react-native/icons/search';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getLabTests, LabTestItem, LabTestType } from '../api/labTests';
import { LabsPage } from '../api/labs';
import { AppText } from '../components';
import { LabDetailsHero, LabTestCard, TestDetailsSheet, TestTypeTabs } from '../components/labDetails';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'LabDetails'>;

export function LabDetailsScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { lab } = route.params;
  const [type, setType] = useState<LabTestType>('individual_test');
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

  const loadFirst = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await getLabTests(Number(lab.id), type);
      setItems(response.data); setMeta(response.meta);
      setTotals(current => ({ ...current, [type]: response.meta.total }));
    } catch (nextError) {
      setItems([]); setError(nextError instanceof Error ? nextError.message : 'Unable to load tests.');
    } finally { setLoading(false); }
  }, [lab.id, type]);

  const loadMore = useCallback(async () => {
    if (!meta?.hasMore || meta.nextStart === null || meta.nextEnd === null || moreLoading) return;
    setMoreLoading(true);
    try {
      const response = await getLabTests(Number(lab.id), type, meta.nextStart, meta.nextEnd);
      setItems(current => { const known = new Set(current.map(item => item.lab_test_id)); return [...current, ...response.data.filter(item => !known.has(item.lab_test_id))]; });
      setMeta(response.meta);
    } finally { setMoreLoading(false); }
  }, [lab.id, meta, moreLoading, type]);

  useEffect(() => { loadFirst(); }, [loadFirst]);
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
  const visibleItems = useMemo(() => { const value = query.trim().toLowerCase(); return value ? items.filter(item => `${item.test.test_name} ${item.test.test_code} ${item.test.tags?.join(' ')}`.toLowerCase().includes(value)) : items; }, [items, query]);
  const heading = type === 'individual_test' ? 'Individual Tests' : 'Health Packages';

  return <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
    <FlatList
      data={visibleItems}
      keyExtractor={item => String(item.lab_test_id)}
      renderItem={({ item }) => <View style={styles.testWrap}><LabTestCard item={item} onPress={() => setSelectedTest(item)} /></View>}
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 86, 100) }]}
      ListHeaderComponent={<><LabDetailsHero lab={lab} onBack={navigation.goBack} /><View style={styles.body}><AppText style={styles.chooseTitle} weight="800">Choose what you need</AppText><AppText color={theme.colors.textMuted} style={styles.chooseText}>Book one standalone diagnostic test, or choose a broader health package containing multiple tests.</AppText><TestTypeTabs value={type} individualCount={totals.individual_test} packageCount={totals.health_package} onChange={setType} /><View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Search color={theme.colors.textMuted} size={20} /><TextInput value={query} onChangeText={setQuery} placeholder={`Search within ${lab.name}`} placeholderTextColor={theme.colors.textMuted} style={[styles.input, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular }]} /></View><View style={styles.heading}><View><AppText style={styles.headingTitle} weight="800">{heading}</AppText><AppText color={theme.colors.textMuted} style={styles.headingSubtitle}>{type === 'individual_test' ? 'One focused diagnostic test per booking.' : 'Multiple preventive tests in one package.'}</AppText></View><AppText color={theme.colors.primary} style={styles.available} weight="700">{meta?.total ?? items.length} available</AppText></View></View></>}
      ListEmptyComponent={loading ? <View style={styles.state}><ActivityIndicator color={theme.colors.primary} size="large" /><AppText color={theme.colors.textMuted} style={styles.stateText}>Loading {heading.toLowerCase()}…</AppText></View> : error ? <View style={styles.state}><AppText style={styles.stateTitle} weight="700">Could not load tests</AppText><AppText color={theme.colors.textMuted} style={styles.stateText}>{error}</AppText><Pressable onPress={loadFirst} style={[styles.retry, { backgroundColor: theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.retryText} weight="700">Try again</AppText></Pressable></View> : <View style={styles.state}><AppText style={styles.stateTitle} weight="700">No {heading.toLowerCase()} found</AppText><AppText color={theme.colors.textMuted} style={styles.stateText}>Try another search or check the other category.</AppText></View>}
      ListFooterComponent={moreLoading ? <ActivityIndicator color={theme.colors.primary} style={styles.more} /> : items.length ? <View style={styles.tip}><ShieldCheck color="#8DD8C8" size={16} /><View><AppText color="#FFFFFF" style={styles.tipTitle} weight="700">Clear before you book</AppText><AppText color="#C9D6E0" style={styles.tipText}>Every card shows test type, costs, sample, fasting and report timing.</AppText></View></View> : undefined}
    />
    <View style={[styles.bottomBar, { bottom: Math.max(insets.bottom, 48), backgroundColor: theme.colors.text }]}><View><AppText color="#C9D6E0" style={styles.from}>Tests starting from</AppText><AppText color="#FFFFFF" style={styles.bottomPrice} weight="800">₹{lab.price}</AppText></View><Pressable style={[styles.catalogue, { backgroundColor: theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.catalogueText} weight="800">BROWSE CATALOGUE</AppText></Pressable></View>
    <TestDetailsSheet item={selectedTest} lab={lab} onClose={() => setSelectedTest(null)} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { paddingBottom: 100 }, body: { paddingHorizontal: 18 }, testWrap: { paddingHorizontal: 18 }, chooseTitle: { fontSize: 20, lineHeight: 25 }, chooseText: { marginTop: 5, marginBottom: 15, fontSize: 10, lineHeight: 15 }, search: { height: 54, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginTop: 14 }, input: { flex: 1, height: '100%', paddingVertical: 0, fontSize: 11 }, heading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18, marginBottom: 11 }, headingTitle: { fontSize: 17, lineHeight: 21 }, headingSubtitle: { marginTop: 3, fontSize: 9, lineHeight: 12 }, available: { fontSize: 9, lineHeight: 12 }, state: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 28 }, stateTitle: { fontSize: 14, lineHeight: 18 }, stateText: { marginTop: 6, textAlign: 'center', fontSize: 10, lineHeight: 14 }, retry: { marginTop: 12, paddingHorizontal: 17, paddingVertical: 9, borderRadius: 9 }, retryText: { fontSize: 9, lineHeight: 12 }, more: { marginVertical: 16 }, tip: { flexDirection: 'row', gap: 8, padding: 13, marginHorizontal: 16, marginTop: 8, borderRadius: 13, backgroundColor: '#08233D' }, tipTitle: { fontSize: 10, lineHeight: 13 }, tipText: { marginTop: 2, fontSize: 7, lineHeight: 10 }, bottomBar: { position: 'absolute', left: 10, right: 10, bottom: 0, minHeight: 68, borderTopLeftRadius: 19, borderTopRightRadius: 19, paddingHorizontal: 15, paddingTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 12 }, from: { fontSize: 7, lineHeight: 9 }, bottomPrice: { fontSize: 16, lineHeight: 19 }, catalogue: { height: 40, borderRadius: 11, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' }, catalogueText: { fontSize: 8, lineHeight: 10 } });
