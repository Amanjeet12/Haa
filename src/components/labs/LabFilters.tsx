import Search from 'lucide-react-native/icons/search';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

type Props = { query: string; selected: string; appliedCount: number; onFilterPress: () => void; onQueryChange: (value: string) => void; onSelect: (value: string) => void };
const filters = ['All labs', 'NABL Accredited', 'ISO Certified', 'ICMR Approved', 'CAP Accredited', 'NABH Certified'];

export function LabFilters({ query, selected, appliedCount, onFilterPress, onQueryChange, onSelect }: Props) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.root}>
      <View style={styles.searchRow}>
        <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Search color={theme.colors.textMuted} size={17} />
          <TextInput value={query} onChangeText={onQueryChange} placeholder="Search lab name or disease" placeholderTextColor={theme.colors.textMuted} style={[styles.input, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular }]} />
        </View>
        <Pressable
          onPress={onFilterPress}
          style={[
            styles.filterButton,
            {
              backgroundColor: appliedCount
                ? theme.colors.primary
                : theme.isDark
                ? theme.colors.surfaceMuted
                : theme.colors.text,
              borderColor: appliedCount
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
        >
          <SlidersHorizontal color="#FFFFFF" size={13} />
          <AppText color="#FFFFFF" style={styles.filterText} weight="700">Filter</AppText>
          {appliedCount > 0 && <View style={styles.count}><AppText color={theme.colors.primary} style={styles.countText} weight="800">{appliedCount}</AppText></View>}
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {filters.map(filter => {
          const active = filter === selected;
          return <Pressable key={filter} onPress={() => onSelect(filter)} style={[styles.chip, { backgroundColor: active ? theme.colors.primary : theme.colors.surface, borderColor: active ? theme.colors.primary : theme.colors.border }]}><AppText color={active ? '#FFFFFF' : theme.colors.text} style={styles.chipText} weight="700">{filter}</AppText></Pressable>;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 10 }, searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  search: { flex: 1, height: 42, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  input: { flex: 1, height: '100%', fontSize: 11, paddingVertical: 0 },
  filterButton: { height: 42, paddingHorizontal: 11, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterText: { fontSize: 10, lineHeight: 13 }, count: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, countText: { fontSize: 8, lineHeight: 10 },
  chips: { gap: 7, paddingHorizontal: 16, paddingVertical: 10 }, chip: { height: 27, paddingHorizontal: 11, borderRadius: 14, borderWidth: 1, justifyContent: 'center' }, chipText: { fontSize: 8, lineHeight: 10 },
});
