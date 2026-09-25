import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { ApiLab, getLabsByZone, LabsPage } from '../api/labs';
import { zoneAvailabilityLabel } from '../api/zones';
import { AppText } from '../components';
import {
  Lab,
  LabCard,
  LabFilters,
  LabFilterSheet,
  LabFilterValues,
  LabLocation,
  LabsHeader,
  LocationSheet,
} from '../components/labs';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchZones, setSelectedZone } from '../store/zonesSlice';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'Labs'>;

function toLab(item: ApiLab): Lab {
  const minimumTest = item.minimum_price_test;
  const specialties = Array.from(
    new Set(
      [
        minimumTest?.test?.category?.category_name,
        ...(minimumTest?.test?.tags ?? []),
      ].filter((value): value is string => Boolean(value)),
    ),
  ).slice(0, 3);
  const price =
    minimumTest?.final_price ??
    Number(minimumTest?.offer_price ?? minimumTest?.normal_price ?? 0);
  return {
    id: String(item.lab_id),
    name: item.lab_name,
    rating: Number(item.avg_rating ?? 0),
    reviews: item.rating_count ?? 0,
    price,
    reportTime: minimumTest?.test_timing ?? 'Contact lab',
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

export function LabsScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const zones = useAppSelector(state => state.zones.items);
  const selectedZone = useAppSelector(state => state.zones.selected);
  const zonesStatus = useAppSelector(state => state.zones.status);
  const locationsError = useAppSelector(state => state.zones.error);
  const [query, setQuery] = useState('');
  const [certification, setCertification] = useState('All labs');
  const [locationOpen, setLocationOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<LabFilterValues>({
    sort: 'none',
    price: 'all',
  });
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pageMeta, setPageMeta] = useState<LabsPage['meta'] | null>(null);
  const [labsLoading, setLabsLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [labsError, setLabsError] = useState<string | null>(null);

  const locations = useMemo<LabLocation[]>(
    () =>
      zones.map(zone => ({
        id: zone.zone_id,
        name: zone.zone_name,
        detail: `Haa Health service zone #${zone.zone_id}`,
        availability: zoneAvailabilityLabel(zone),
      })),
    [zones],
  );
  const location = selectedZone?.zone_name ?? 'Choose your location';
  const locationsLoading = zonesStatus === 'idle' || zonesStatus === 'loading';
  const appliedCount =
    Number(advancedFilters.sort !== 'none') +
    Number(advancedFilters.price !== 'all');

  const loadFirstPage = useCallback(async () => {
    if (!selectedZone) return;
    setLabsLoading(true);
    setLabsError(null);
    try {
      const page = await getLabsByZone(selectedZone.zone_id);
      setLabs(page.data.map(toLab));
      setPageMeta(page.meta);
    } catch (error) {
      setLabs([]);
      setLabsError(
        error instanceof Error ? error.message : 'Unable to load labs.',
      );
    } finally {
      setLabsLoading(false);
    }
  }, [selectedZone]);

  const loadMore = useCallback(async () => {
    if (
      !selectedZone ||
      !pageMeta?.hasMore ||
      pageMeta.nextStart === null ||
      pageMeta.nextEnd === null ||
      moreLoading
    )
      return;
    setMoreLoading(true);
    try {
      const page = await getLabsByZone(
        selectedZone.zone_id,
        pageMeta.nextStart,
        pageMeta.nextEnd,
      );
      setLabs(current => {
        const known = new Set(current.map(item => item.id));
        return [
          ...current,
          ...page.data.map(toLab).filter(item => !known.has(item.id)),
        ];
      });
      setPageMeta(page.meta);
    } finally {
      setMoreLoading(false);
    }
  }, [moreLoading, pageMeta, selectedZone]);

  useEffect(() => {
    if (zonesStatus === 'idle') dispatch(fetchZones());
  }, [dispatch, zonesStatus]);
  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const visibleLabs = useMemo(
    () =>
      labs
        .filter(lab => {
          const searchable = `${lab.name} ${lab.specialties.join(' ')} ${
            lab.address ?? ''
          }`.toLowerCase();
          const matchesQuery = searchable.includes(query.trim().toLowerCase());
          const matchesCertification =
            certification === 'All labs' ||
            lab.certifications.includes(certification);
          const matchesPrice =
            advancedFilters.price === 'all' ||
            (advancedFilters.price === 'under400' && lab.price < 400) ||
            (advancedFilters.price === '400to500' &&
              lab.price >= 400 &&
              lab.price <= 500) ||
            (advancedFilters.price === 'above500' && lab.price > 500);
          return matchesQuery && matchesCertification && matchesPrice;
        })
        .sort((a, b) =>
          advancedFilters.sort === 'az'
            ? a.name.localeCompare(b.name)
            : advancedFilters.sort === 'za'
            ? b.name.localeCompare(a.name)
            : 0,
        ),
    [advancedFilters, certification, labs, query],
  );

  const chooseLocation = (item: LabLocation) => {
    const zone = zones.find(candidate => candidate.zone_id === item.id);
    if (zone) dispatch(setSelectedZone(zone));
    setLocationOpen(false);
  };
  const applyFilters = (value: LabFilterValues) => {
    setAdvancedFilters(value);
    setFiltersOpen(false);
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <LabsHeader
        location={location}
        labCount={pageMeta?.total ?? null}
        loadingLabs={labsLoading}
        onBack={navigation.goBack}
        onChangeLocation={() => setLocationOpen(true)}
      />
      <LabFilters
        query={query}
        selected={certification}
        appliedCount={appliedCount}
        onFilterPress={() => setFiltersOpen(true)}
        onQueryChange={setQuery}
        onSearchPress={() => navigation.navigate('Search')}
        onSelect={setCertification}
      />
      {labsLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText color={theme.colors.textMuted} style={styles.stateText}>
            Loading labs in {location}…
          </AppText>
        </View>
      ) : labsError ? (
        <View style={styles.state}>
          <AppText style={styles.emptyTitle} weight="700">
            Could not load labs
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.stateText}>
            {labsError}
          </AppText>
          <Pressable
            onPress={loadFirstPage}
            style={[styles.retry, { backgroundColor: theme.colors.primary }]}
          >
            <AppText color="#FFFFFF" style={styles.retryText} weight="700">
              Try again
            </AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleLabs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <LabCard
              lab={item}
              onPress={() => navigation.navigate('LabDetails', { lab: item })}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom + 24, 36) },
          ]}
          ListHeaderComponent={
            <View style={styles.heading}>
              <AppText style={styles.title} weight="800">
                All labs
              </AppText>
              <AppText
                color={theme.colors.primary}
                style={styles.count}
                weight="700"
              >
                {pageMeta?.total ?? visibleLabs.length} lab
                {(pageMeta?.total ?? visibleLabs.length) === 1 ? '' : 's'}{' '}
                nearby
              </AppText>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <AppText style={styles.emptyTitle} weight="700">
                No labs found
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.emptyText}>
                Try a different lab name or filter.
              </AppText>
            </View>
          }
          ListFooterComponent={
            moreLoading ? (
              <ActivityIndicator
                color={theme.colors.primary}
                style={styles.moreLoader}
              />
            ) : undefined
          }
        />
      )}
      <LocationSheet
        visible={locationOpen}
        selected={location}
        locations={locations}
        loading={locationsLoading}
        error={locationsError}
        onClose={() => setLocationOpen(false)}
        onSearchPress={() => {
          setLocationOpen(false);
          navigation.navigate('CitySearch');
        }}
        onRetry={() => dispatch(fetchZones())}
        onSelect={chooseLocation}
      />
      <LabFilterSheet
        visible={filtersOpen}
        value={advancedFilters}
        onClose={() => setFiltersOpen(false)}
        onApply={applyFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { paddingHorizontal: 16 },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 9,
  },
  title: { fontSize: 17, lineHeight: 22 },
  count: { fontSize: 9, lineHeight: 12 },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  stateText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 15,
  },
  empty: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 15, lineHeight: 20 },
  emptyText: { marginTop: 4, fontSize: 11, lineHeight: 15 },
  retry: {
    marginTop: 14,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryText: { fontSize: 10, lineHeight: 13 },
  moreLoader: { marginVertical: 16 },
});
