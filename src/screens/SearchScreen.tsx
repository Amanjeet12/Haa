import { formatINR } from '../utils/currency';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Clock3 from 'lucide-react-native/icons/clock-3';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Search from 'lucide-react-native/icons/search';
import Star from 'lucide-react-native/icons/star';
import X from 'lucide-react-native/icons/x';
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
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { ApiLab, getLabsByZone } from '../api/labs';
import { AppText } from '../components';
import { Lab } from '../components/labs';
import { readJson, writeJson } from '../storage/storage';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'Search'>;
const RECENT_SEARCHES_KEY = '@haa/recent-lab-searches';

function toLab(item: ApiLab): Lab {
  const minimum = item.minimum_price_test;
  const specialties = [minimum?.test?.test_name, ...(minimum?.test?.tags ?? [])]
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
  return {
    id: String(item.lab_id),
    name: item.lab_name,
    rating: Number(item.avg_rating ?? 0),
    reviews: item.rating_count ?? 0,
    price:
      minimum?.final_price ??
      Number(minimum?.offer_price ?? minimum?.normal_price ?? 0),
    reportTime: minimum?.test_timing ?? 'Contact lab',
    certifications: item.certifications ?? [],
    specialties: specialties.length ? specialties : ['Diagnostics'],
    verified: item.tags?.includes('top_rated'),
    partner: item.tags?.includes('premium_partner'),
    accent: '#DCE8E4',
    image: item.image,
    banner: item.banner?.mobile?.url ?? item.banner?.desktop?.url,
    address: item.address?.address_line_1 ?? item.address?.city,
  };
}

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function matchedTestForQuery(item: ApiLab, query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return undefined;

  // A lab-name match should retain the normal Lab Details behavior.
  if (normalizeSearchValue(item.lab_name).includes(normalizedQuery)) {
    return undefined;
  }

  const match = item.minimum_price_test;
  const testName = match?.test?.test_name;
  if (!testName || !normalizeSearchValue(testName).includes(normalizedQuery)) {
    // Search can match another test while this summary still contains the
    // lab's minimum-price test. Resolve the query against the loaded catalogue.
    return { testName: query.trim() };
  }

  return {
    testId: match.test?.test_id ?? match.test_id,
    labTestId: match.lab_test_id,
    testName,
    testType: match.test?.test_type ?? match.test?.category?.category_type,
  };
}

export function SearchScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const zone = useAppSelector(state => state.zones.selected);
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const requestId = useRef(0);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [results, setResults] = useState<ApiLab[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    readJson<string[]>(RECENT_SEARCHES_KEY).then(value =>
      setRecent(value ?? []),
    );
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!zone || trimmedQuery.length < 2) {
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
        const page = await getLabsByZone(zone.zone_id, 0, 19, trimmedQuery);
        if (currentRequest === requestId.current) setResults(page.data);
      } catch (caught) {
        if (currentRequest === requestId.current) {
          setResults([]);
          setError(
            caught instanceof Error ? caught.message : 'Unable to search labs.',
          );
        }
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [trimmedQuery, zone]);

  const saveRecent = useCallback((value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setRecent(current => {
      const next = [
        clean,
        ...current.filter(item => item.toLowerCase() !== clean.toLowerCase()),
      ].slice(0, 6);
      void writeJson(RECENT_SEARCHES_KEY, next);
      return next;
    });
  }, []);

  const chooseLab = (item: ApiLab) => {
    saveRecent(
      trimmedQuery || item.minimum_price_test?.test?.test_name || item.lab_name,
    );
    Keyboard.dismiss();
    navigation.navigate('LabDetails', {
      lab: toLab(item),
      highlightTest: matchedTestForQuery(item, trimmedQuery),
    });
  };

  const clearRecent = () => {
    setRecent([]);
    void writeJson(RECENT_SEARCHES_KEY, []);
  };

  const title = useMemo(() => {
    if (loading) return 'Searching nearby labs…';
    if (results.length)
      return `${results.length} lab${results.length === 1 ? '' : 's'} found`;
    return 'Search results';
  }, [loading, results.length]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={navigation.goBack}
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
        >
          <ChevronLeft color={theme.colors.text} size={20} />
        </Pressable>
        <AppText style={styles.headerTitle} weight="800">
          Search
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: trimmedQuery
              ? theme.colors.primary
              : theme.colors.border,
          },
        ]}
      >
        <Search
          color={trimmedQuery ? theme.colors.primary : theme.colors.textMuted}
          size={19}
        />
        <TextInput
          ref={inputRef}
          accessibilityLabel="Search tests and labs"
          autoCorrect={false}
          onChangeText={setQuery}
          onSubmitEditing={() => saveRecent(trimmedQuery)}
          placeholder="Search tests or labs"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          style={[styles.input, { color: theme.colors.text }]}
          value={query}
        />
        {query ? (
          <Pressable
            accessibilityLabel="Clear search"
            onPress={() => setQuery('')}
            style={styles.clearButton}
          >
            <X color={theme.colors.textMuted} size={16} />
          </Pressable>
        ) : null}
      </View>

      {!trimmedQuery ? (
        <View style={styles.recentSection}>
          <View style={styles.sectionRow}>
            <AppText style={styles.sectionTitle} weight="800">
              Recent searches
            </AppText>
            {recent.length ? (
              <Pressable onPress={clearRecent}>
                <AppText
                  color={theme.colors.primary}
                  style={styles.clearText}
                  weight="700"
                >
                  Clear all
                </AppText>
              </Pressable>
            ) : null}
          </View>
          {recent.length ? (
            recent.map(item => (
              <Pressable
                key={item}
                onPress={() => setQuery(item)}
                style={[
                  styles.recentItem,
                  { borderBottomColor: theme.colors.border },
                ]}
              >
                <View
                  style={[
                    styles.historyIcon,
                    { backgroundColor: theme.colors.surfaceMuted },
                  ]}
                >
                  <RotateCcw color={theme.colors.textMuted} size={17} />
                </View>
                <AppText style={styles.recentText}>{item}</AppText>
                <ChevronRight color={theme.colors.textMuted} size={17} />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyRecent}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <Search color={theme.colors.primary} size={24} />
              </View>
              <AppText style={styles.emptyTitle} weight="700">
                Search for a test or lab
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.emptyBody}>
                Your recent searches will appear here.
              </AppText>
            </View>
          )}
        </View>
      ) : trimmedQuery.length < 2 ? (
        <View style={styles.center}>
          <AppText color={theme.colors.textMuted}>
            Type at least 2 characters to search.
          </AppText>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText color={theme.colors.textMuted} style={styles.loadingText}>
            Finding the best matching labs…
          </AppText>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <AppText style={styles.emptyTitle} weight="700">
            Search unavailable
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom + 20, 32) },
          ]}
          data={results}
          keyExtractor={item => String(item.lab_id)}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <AppText style={styles.resultsTitle} weight="800">
              {title}
            </AppText>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText style={styles.emptyTitle} weight="700">
                No labs found
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.emptyBody}>
                Try a different test or lab name.
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <SearchResult lab={item} onPress={() => chooseLab(item)} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function SearchResult({ lab, onPress }: { lab: ApiLab; onPress: () => void }) {
  const { theme } = useAppTheme();
  const minimum = lab.minimum_price_test;
  const price =
    minimum?.final_price ??
    Number(minimum?.offer_price ?? minimum?.normal_price ?? 0);
  const oldPrice = Number(minimum?.normal_price ?? 0);
  const canRenderLogo = Boolean(
    lab.image && !lab.image.toLowerCase().endsWith('.svg'),
  );
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.resultCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View
        style={[styles.labLogo, { backgroundColor: theme.colors.surfaceMuted }]}
      >
        {canRenderLogo ? (
          <Image
            source={{ uri: lab.image }}
            resizeMode="contain"
            style={styles.logoImage}
          />
        ) : (
          <FlaskConical color={theme.colors.primary} size={25} />
        )}
      </View>
      <View style={styles.resultCopy}>
        <AppText numberOfLines={1} style={styles.labName} weight="800">
          {lab.lab_name}
        </AppText>
        <AppText
          color={theme.colors.textMuted}
          numberOfLines={1}
          style={styles.testName}
        >
          {minimum?.test?.test_name ?? 'Diagnostic tests available'}
        </AppText>
        <View style={styles.resultMeta}>
          <Star color="#D97706" fill="#D97706" size={12} />
          <AppText style={styles.metaText} weight="700">
            {Number(lab.avg_rating ?? 0).toFixed(1)}
          </AppText>
          <Clock3 color={theme.colors.textMuted} size={12} />
          <AppText color={theme.colors.textMuted} style={styles.metaText}>
            {minimum?.test_timing ?? 'Contact lab'}
          </AppText>
        </View>
      </View>
      <View style={styles.priceBlock}>
        <AppText color={theme.colors.textMuted} style={styles.fromText}>
          From
        </AppText>
        <AppText
          color={theme.colors.primary}
          style={styles.priceText}
          weight="800"
        >
          {formatINR(price)}
        </AppText>
        {oldPrice > price ? (
          <AppText color={theme.colors.textMuted} style={styles.oldPrice}>
            {formatINR(oldPrice)}
          </AppText>
        ) : null}
      </View>
      <ChevronRight color={theme.colors.textMuted} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 22 },
  headerSpacer: { width: 36 },
  searchBox: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: 'Geist-Regular',
    fontSize: 14,
  },
  clearButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentSection: { paddingHorizontal: 16, paddingTop: 24 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 17, lineHeight: 22 },
  clearText: { fontSize: 11 },
  recentItem: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentText: { flex: 1, fontSize: 13 },
  emptyRecent: { alignItems: 'center', paddingTop: 65 },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  emptyTitle: { fontSize: 15, lineHeight: 20 },
  emptyBody: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 65,
  },
  loadingText: { marginTop: 10, fontSize: 11 },
  errorText: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },
  list: { paddingHorizontal: 16, paddingTop: 19 },
  resultsTitle: { marginBottom: 11, fontSize: 16, lineHeight: 21 },
  resultCard: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 16,
    elevation: 2,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  labLogo: {
    width: 55,
    height: 55,
    flexShrink: 0,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: 46, height: 42 },
  resultCopy: { flex: 1, minWidth: 0, paddingRight: 4 },
  labName: { fontSize: 13, lineHeight: 17 },
  testName: { marginTop: 4, fontSize: 10, lineHeight: 14 },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
  },
  metaText: { marginRight: 5, fontSize: 9, lineHeight: 12 },
  priceBlock: { width: 62, flexShrink: 0, alignItems: 'flex-end' },
  fromText: { fontSize: 8, lineHeight: 10 },
  priceText: { marginTop: 2, fontSize: 16, lineHeight: 19 },
  oldPrice: {
    marginTop: 1,
    fontSize: 8,
    lineHeight: 10,
    textDecorationLine: 'line-through',
  },
});
