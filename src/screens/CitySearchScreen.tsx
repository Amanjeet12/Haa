import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Clock3 from 'lucide-react-native/icons/clock-3';
import MapPin from 'lucide-react-native/icons/map-pin';
import Search from 'lucide-react-native/icons/search';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { zoneAvailabilityLabel } from '../api/zones';
import { AppText } from '../components';
import { createPlacesSessionToken, getCitySuggestions, getPlaceDetails, PlaceSuggestion } from '../services/places';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchZones, setSelectedZone } from '../store/zonesSlice';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'CitySearch'>;

export function CitySearchScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const zones = useAppSelector(state => state.zones.items);
  const sessionToken = useRef(createPlacesSessionToken());
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const matchingZones = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? zones.filter(zone => zone.zone_name.toLowerCase().includes(value)) : zones;
  }, [query, zones]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 3) { setSuggestions([]); setSearching(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try { setSuggestions((await getCitySuggestions(value, sessionToken.current, controller.signal)).slice(0, 6)); }
      catch { if (!controller.signal.aborted) setMessage('City search is unavailable. Please try again.'); }
      finally { if (!controller.signal.aborted) setSearching(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    setChecking(suggestion.placeId); setMessage(null);
    try {
      const place = await getPlaceDetails(suggestion.placeId, sessionToken.current);
      const result = await dispatch(fetchZones({ lat: place.latitude, lng: place.longitude }));
      if (fetchZones.fulfilled.match(result) && result.payload.items.some(zone => zone.is_coordinate_in_zone)) navigation.goBack();
      else setMessage(`We don't deliver in ${suggestion.primaryText} yet. Services are coming soon.`);
    } catch { setMessage(`We don't deliver in ${suggestion.primaryText} yet. Services are coming soon.`); }
    finally { setChecking(null); sessionToken.current = createPlacesSessionToken(); }
  };

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
    <View style={styles.header}><Pressable onPress={navigation.goBack} style={[styles.back, { backgroundColor: theme.colors.surface }]}><ChevronLeft color={theme.colors.text} size={20} /></Pressable><View><AppText style={styles.title} weight="800">Search city</AppText><AppText color={theme.colors.textMuted} style={styles.subtitle}>Find labs and delivery near you</AppText></View></View>
    <View style={[styles.search, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Search color={theme.colors.textMuted} size={19} /><TextInput autoFocus value={query} onChangeText={value => { setQuery(value); setMessage(null); }} placeholder="Search city name" placeholderTextColor={theme.colors.textMuted} style={[styles.input, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular }]} />{searching && <ActivityIndicator color={theme.colors.primary} size="small" />}</View>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {matchingZones.length > 0 && <AppText color={theme.colors.textMuted} style={styles.sectionLabel} weight="700">AVAILABLE ZONES</AppText>}
      {matchingZones.map(zone => <Pressable key={zone.zone_id} onPress={() => { dispatch(setSelectedZone(zone)); navigation.goBack(); }} style={[styles.row, { borderBottomColor: theme.colors.border }]}><View style={[styles.pin, { backgroundColor: theme.colors.primarySoft }]}><MapPin color={theme.colors.primary} size={17} /></View><View style={styles.copy}><AppText style={styles.name} weight="700">{zone.zone_name}</AppText><View style={styles.status}><Clock3 color="#078A73" size={11} /><AppText color="#078A73" style={styles.statusText} weight="600">{zoneAvailabilityLabel(zone)}</AppText></View></View><ChevronRight color={theme.colors.textMuted} size={18} /></Pressable>)}
      {query.trim().length >= 3 && <AppText color={theme.colors.textMuted} style={styles.sectionLabel} weight="700">OTHER CITIES FROM GOOGLE</AppText>}
      {suggestions.filter(item => !zones.some(zone => zone.zone_name.toLowerCase() === item.primaryText.toLowerCase())).map(item => <Pressable key={item.placeId} onPress={() => selectSuggestion(item)} style={[styles.row, { borderBottomColor: theme.colors.border }]}><View style={[styles.pin, { backgroundColor: theme.colors.surfaceMuted }]}><MapPin color={theme.colors.textMuted} size={17} /></View><View style={styles.copy}><AppText style={styles.name} weight="700">{item.primaryText}</AppText><AppText color={theme.colors.textMuted} style={styles.secondary} numberOfLines={1}>{item.secondaryText}</AppText></View>{checking === item.placeId ? <ActivityIndicator color={theme.colors.primary} size="small" /> : <ChevronRight color={theme.colors.textMuted} size={18} />}</Pressable>)}
      {message && <View style={[styles.message, { backgroundColor: theme.colors.primarySoft }]}><MapPin color={theme.colors.primary} size={22} /><AppText color={theme.colors.primary} style={styles.messageText} weight="700">{message}</AppText></View>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, header: { height: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 }, back: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 }, title: { fontSize: 18, lineHeight: 22 }, subtitle: { fontSize: 9, lineHeight: 12 }, search: { height: 48, marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13 }, input: { flex: 1, height: '100%', fontSize: 13 }, content: { paddingHorizontal: 16, paddingBottom: 30 }, sectionLabel: { marginTop: 14, marginBottom: 4, fontSize: 8, lineHeight: 11, letterSpacing: 0.7 }, row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 }, pin: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, name: { fontSize: 13, lineHeight: 17 }, status: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }, statusText: { fontSize: 8, lineHeight: 10 }, secondary: { marginTop: 2, fontSize: 9, lineHeight: 12 }, message: { marginTop: 18, borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10 }, messageText: { flex: 1, fontSize: 11, lineHeight: 15 } });
