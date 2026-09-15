import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../components';
import { Lab, LabCard, LabFilters, LabFilterSheet, LabFilterValues, LabLocation, LabsHeader, LocationSheet } from '../components/labs';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

const labs: Lab[] = [
  { id: 'atulaya', name: 'Atulaya Path Labs', rating: 5, reviews: 9, price: 499, reportTime: 'same day', accreditations: ['NABL', 'CAP'], specialties: ['Pathology', 'Liver Profile'], partner: true, accent: '#DED5EF' },
  { id: 'kashmir', name: 'Kashmir Diagnostic Centre', rating: 5, reviews: 8, price: 349, reportTime: '12 hours', accreditations: ['NABL'], specialties: ['Diabetes', 'Heart Profile', 'Kidney Profile'], verified: true, accent: '#C9D9E5' },
  { id: 'medicare', name: 'Medicare Clinical Laboratory', rating: 4.8, reviews: 21, price: 399, reportTime: '24 hours', accreditations: ['NABL'], specialties: ['Thyroid', 'Full Body'], verified: true, accent: '#DCE8E4' },
];

type Props = NativeStackScreenProps<HomeStackParamList, 'Labs'>;

export function LabsScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All labs');
  const [location, setLocation] = useState('Rajbagh, Srinagar');
  const [locationOpen, setLocationOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<LabFilterValues>({ sort: 'none', price: 'all' });
  const appliedCount = Number(advancedFilters.sort !== 'none') + Number(advancedFilters.price !== 'all');
  const visibleLabs = useMemo(() => labs.filter(lab => {
    const matchesQuery = `${lab.name} ${lab.specialties.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === 'All labs' || (filter === 'NABL Accredited' && lab.accreditations.includes('NABL'));
    const matchesPrice = advancedFilters.price === 'all' || (advancedFilters.price === 'under400' && lab.price < 400) || (advancedFilters.price === '400to500' && lab.price >= 400 && lab.price <= 500) || (advancedFilters.price === 'above500' && lab.price > 500);
    return matchesQuery && matchesFilter && matchesPrice;
  }).sort((a, b) => advancedFilters.sort === 'az' ? a.name.localeCompare(b.name) : advancedFilters.sort === 'za' ? b.name.localeCompare(a.name) : 0), [advancedFilters, filter, query]);

  const chooseLocation = (item: LabLocation) => { setLocation(item.name); setLocationOpen(false); };
  const applyFilters = (value: LabFilterValues) => { setAdvancedFilters(value); setFiltersOpen(false); };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <LabsHeader location={location} onBack={navigation.goBack} onChangeLocation={() => setLocationOpen(true)} />
      <LabFilters query={query} selected={filter} appliedCount={appliedCount} onFilterPress={() => setFiltersOpen(true)} onQueryChange={setQuery} onSelect={setFilter} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Math.max(insets.bottom + 24, 36) },
        ]}
      >
        <View style={styles.heading}><AppText style={styles.title} weight="800">All labs</AppText><AppText color={theme.colors.primary} style={styles.count} weight="700">{visibleLabs.length} lab{visibleLabs.length === 1 ? '' : 's'} nearby</AppText></View>
        {visibleLabs.map(lab => <LabCard key={lab.id} lab={lab} />)}
        {!visibleLabs.length && <View style={styles.empty}><AppText style={styles.emptyTitle} weight="700">No labs found</AppText><AppText color={theme.colors.textMuted} style={styles.emptyText}>Try a different lab name or filter.</AppText></View>}
      </ScrollView>
      <LocationSheet visible={locationOpen} selected={location} onClose={() => setLocationOpen(false)} onSelect={chooseLocation} />
      <LabFilterSheet visible={filtersOpen} value={advancedFilters} onClose={() => setFiltersOpen(false)} onApply={applyFilters} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, list: { paddingHorizontal: 16, paddingBottom: 28 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, marginBottom: 9 }, title: { fontSize: 17, lineHeight: 22 }, count: { fontSize: 9, lineHeight: 12 }, empty: { alignItems: 'center', paddingVertical: 50 }, emptyTitle: { fontSize: 15, lineHeight: 20 }, emptyText: { marginTop: 4, fontSize: 11, lineHeight: 15 },
});
