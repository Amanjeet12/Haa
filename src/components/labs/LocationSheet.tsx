import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Clock3 from 'lucide-react-native/icons/clock-3';
import MapPin from 'lucide-react-native/icons/map-pin';
import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

export type LabLocation = { name: string; detail: string; availability: string };
const locations: LabLocation[] = [
  { name: 'Rajbagh, Srinagar', detail: 'Rajbagh and nearby areas', availability: '5 labs available within 6 km' },
  { name: 'Indiranagar, Bengaluru', detail: 'Indiranagar, Domlur and nearby areas', availability: 'Labs and delivery available' },
  { name: 'Koramangala, Bengaluru', detail: 'Koramangala, HSR Layout and Ejipura', availability: 'Labs and delivery available' },
  { name: 'Whitefield, Bengaluru', detail: 'Whitefield, Brookefield and Marathahalli', availability: 'Labs available today' },
  { name: 'Jayanagar, Bengaluru', detail: 'Jayanagar, JP Nagar and Banashankari', availability: 'Labs and delivery available' },
  { name: 'Hebbal, Bengaluru', detail: 'Hebbal, Yelahanka and Thanisandra', availability: 'Labs available today' },
];

type Props = { visible: boolean; selected: string; onClose: () => void; onSelect: (location: LabLocation) => void };
export function LocationSheet({ visible, selected, onClose, onSelect }: Props) {
  const { theme } = useAppTheme();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => locations.filter(item => `${item.name} ${item.detail}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <Modal animationType="slide" transparent statusBarTranslucent visible={visible} onRequestClose={onClose}>
    <View style={styles.modal}><Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
        <View style={styles.header}><View><AppText style={styles.title} weight="800">Choose your location</AppText><AppText color={theme.colors.textMuted} style={styles.subtitle}>Areas where Haa Health is available</AppText></View><Pressable onPress={onClose} style={[styles.close, { backgroundColor: theme.colors.surfaceMuted }]}><X color={theme.colors.text} size={20} /></Pressable></View>
        <View style={[styles.search, { backgroundColor: theme.colors.surfaceMuted }]}><Search color={theme.colors.textMuted} size={18} /><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search area or neighbourhood" placeholderTextColor={theme.colors.textMuted} style={[styles.input, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular }]} /></View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{filtered.map(item => {
          const active = selected === item.name;
          return <Pressable key={item.name} onPress={() => { onSelect(item); setQuery(''); }} style={[styles.row, { borderBottomColor: theme.colors.border }]}><View style={[styles.pin, { backgroundColor: active ? theme.colors.primary : theme.colors.primarySoft }]}><MapPin color={active ? '#FFFFFF' : theme.colors.primary} size={17} /></View><View style={styles.copy}><AppText style={styles.name} weight="700">{item.name}</AppText><AppText color={theme.colors.textMuted} style={styles.detail}>{item.detail}</AppText><View style={styles.available}><Clock3 color="#078A73" size={11} /><AppText color="#078A73" style={styles.availableText} weight="600">{item.availability}</AppText></View></View><ChevronRight color={theme.colors.textMuted} size={18} /></Pressable>;
        })}</ScrollView>
      </SafeAreaView>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: 'flex-end' }, backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(2,6,23,.5)' }, sheet: { maxHeight: '88%', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 16 }, handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 }, title: { fontSize: 21, lineHeight: 26 }, subtitle: { fontSize: 10, lineHeight: 14 }, close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, search: { height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, marginBottom: 8 }, input: { flex: 1, height: '100%', fontSize: 12 }, row: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 }, pin: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, name: { fontSize: 12, lineHeight: 16 }, detail: { fontSize: 8, lineHeight: 11 }, available: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }, availableText: { fontSize: 8, lineHeight: 10 },
});
