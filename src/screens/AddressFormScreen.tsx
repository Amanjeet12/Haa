import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import LocateFixed from 'lucide-react-native/icons/locate-fixed';
import MapPin from 'lucide-react-native/icons/map-pin';
import Search from 'lucide-react-native/icons/search';
import Trash from 'lucide-react-native/icons/trash';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressInput, createCustomerAddress, deleteCustomerAddress, updateCustomerAddress } from '../api/addresses';
import { AppText } from '../components';
import { getCurrentLocation } from '../services/location';
import { createPlacesSessionToken, getPlaceDetails, getPlaceSuggestions, PlaceSuggestion } from '../services/places';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddressForm'>;
type Coordinate = { latitude: number; longitude: number };
const types = ['home', 'office', 'other'];

export function AddressFormScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const existing = route.params?.address;
  const value = existing?.billing_address;
  const location = value?.location;
  const savedLatitude = Number(location?.latitude ?? location?.lat);
  const savedLongitude = Number(location?.longitude ?? location?.lng);
  const initialCoordinate: Coordinate | null =
    Number.isFinite(savedLatitude) && Number.isFinite(savedLongitude)
      ? { latitude: savedLatitude, longitude: savedLongitude } : null;
  const [addressType, setAddressType] = useState((value?.addressType ?? value?.address_type ?? location?.type ?? 'home').toLowerCase());
  const [flatNo, setFlatNo] = useState(value?.flatNo ?? value?.flat_no ?? '');
  const [buildingName, setBuildingName] = useState(value?.buildingName ?? value?.building_name ?? '');
  const [landmark, setLandmark] = useState(value?.landmark ?? '');
  const [address, setAddress] = useState(value?.address ?? location?.address ?? '');
  const [city, setCity] = useState(location?.city ?? value?.city ?? '');
  const [pincode, setPincode] = useState(location?.pincode ?? value?.pincode ?? '');
  const [coordinate, setCoordinate] = useState<Coordinate | null>(initialCoordinate);
  const [locationQuery, setLocationQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [locating, setLocating] = useState(false);
  const [isDefault, setIsDefault] = useState(value?.isDefault ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const sessionTokenRef = useRef(createPlacesSessionToken());
  const suppressSearchRef = useRef(false);
  const revealFormFields = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  };

  useEffect(() => {
    const query = locationQuery.trim();
    if (suppressSearchRef.current) { suppressSearchRef.current = false; return; }
    if (!searchFocused || query.length < 3) { setSuggestions([]); setSearching(false); return; }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await getPlaceSuggestions(query, sessionTokenRef.current, controller.signal);
        setSuggestions(results.slice(0, 5));
      } catch {
        if (!controller.signal.aborted) setError('Location search is unavailable. Please try again.');
      } finally { if (!controller.signal.aborted) setSearching(false); }
    }, 350);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [locationQuery, searchFocused]);

  const selectLocation = async (suggestion: PlaceSuggestion) => {
    suppressSearchRef.current = true;
    setLocationQuery(suggestion.fullText); setSuggestions([]); setSearchFocused(false); setSearching(true); setError(null);
    Keyboard.dismiss();
    try {
      const place = await getPlaceDetails(suggestion.placeId, sessionTokenRef.current);
      const next = { latitude: place.latitude, longitude: place.longitude };
      setCoordinate(next); setAddress(place.address);
      if (place.city) setCity(place.city);
      if (place.pincode) setPincode(place.pincode);
      mapRef.current?.animateToRegion({ ...next, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 400);
      sessionTokenRef.current = createPlacesSessionToken();
    } catch { setError('We could not load that location. Please choose another one.'); }
    finally { setSearching(false); }
  };

  const locateCurrentPosition = async () => {
    setLocating(true); setError(null);
    try {
      const result = await getCurrentLocation();
      const next = { latitude: result.coords.latitude, longitude: result.coords.longitude };
      setCoordinate(next);
      mapRef.current?.animateToRegion({ ...next, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 350);
    } catch (locationError) {
      setError(locationError instanceof Error ? locationError.message : 'Unable to get your current location.');
    } finally { setLocating(false); }
  };

  useEffect(() => {
    if (!initialCoordinate) locateCurrentPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!token) return;
    if (!address.trim() || !city.trim() || !pincode.trim() || !coordinate) {
      setError('Enter the address, city and pincode, then choose its location on the map.');
      return;
    }
    const input: AddressInput = {
      billing_address: {
        isDefault, addressType, flatNo: flatNo.trim(), buildingName: buildingName.trim(),
        landmark: landmark.trim(), address: address.trim(),
        location: {
          title: city.trim(), city: city.trim(),
          type: addressType.charAt(0).toUpperCase() + addressType.slice(1),
          address: address.trim(), pincode: pincode.trim(),
          latitude: coordinate.latitude, longitude: coordinate.longitude,
        },
      },
      shipping_address: null,
    };
    setSaving(true); setError(null);
    try {
      if (existing) await updateCustomerAddress(token, existing.address_id, input);
      else await createCustomerAddress(token, input);
      navigation.goBack();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save address.');
    } finally { setSaving(false); }
  };

  const remove = () => {
    if (!token || !existing) return;
    Alert.alert('Delete address?', 'This saved collection address will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setSaving(true);
        try { await deleteCustomerAddress(token, existing.address_id); navigation.goBack(); }
        catch (deleteError) {
          setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete address.');
          setSaving(false);
        }
      } },
    ]);
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <Pressable onPress={navigation.goBack} style={[styles.back, { backgroundColor: theme.colors.surface }]}><ChevronLeft color={theme.colors.text} size={20} /></Pressable>
          <AppText style={styles.headerTitle} weight="800">{existing ? 'Edit address' : 'Add address'}</AppText>
          <View style={styles.headerSpacer} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
            <View style={[styles.form, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.field}>
                <AppText style={styles.label} weight="700">Pin location *</AppText>
                <View style={[styles.searchBox, { backgroundColor: theme.colors.surfaceMuted, borderColor: searchFocused ? theme.colors.primary : theme.colors.border }]}>
                  <Search color={theme.colors.textMuted} size={17} />
                  <TextInput value={locationQuery} onChangeText={next => { suppressSearchRef.current = false; setLocationQuery(next); setError(null); }} onFocus={() => setSearchFocused(true)} placeholder="Search area, street or landmark" placeholderTextColor={theme.colors.textMuted} style={[styles.searchInput, { color: theme.colors.text }]} returnKeyType="search" />
                  {searching && <ActivityIndicator color={theme.colors.primary} size="small" />}
                </View>
                {suggestions.length > 0 && <View style={[styles.suggestions, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>{suggestions.map((suggestion, index) => <Pressable key={suggestion.placeId} onPress={() => selectLocation(suggestion)} style={[styles.suggestion, index < suggestions.length - 1 && { borderBottomColor: theme.colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}><MapPin color={theme.colors.primary} size={16} /><View style={styles.suggestionCopy}><AppText style={styles.suggestionTitle} weight="700" numberOfLines={1}>{suggestion.primaryText}</AppText>{suggestion.secondaryText ? <AppText color={theme.colors.textMuted} style={styles.suggestionSubtitle} numberOfLines={1}>{suggestion.secondaryText}</AppText> : null}</View></Pressable>)}</View>}
                <View style={[styles.mapContainer, { borderColor: theme.colors.border }]}> 
                  <MapView
                    ref={mapRef}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    style={styles.map}
                    initialRegion={{ latitude: initialCoordinate?.latitude ?? 20.5937, longitude: initialCoordinate?.longitude ?? 78.9629, latitudeDelta: initialCoordinate ? 0.008 : 18, longitudeDelta: initialCoordinate ? 0.008 : 18 }}
                    onPress={event => setCoordinate(event.nativeEvent.coordinate)}>
                    {coordinate && <Marker coordinate={coordinate} draggable onDragEnd={event => setCoordinate(event.nativeEvent.coordinate)} pinColor={theme.colors.primary} />}
                  </MapView>
                  <Pressable disabled={locating} onPress={locateCurrentPosition} style={[styles.locateButton, { backgroundColor: theme.colors.surface }]}>
                    <LocateFixed color={theme.colors.primary} size={17} />
                    <AppText color={theme.colors.primary} style={styles.locateText} weight="800">{locating ? 'Locating…' : 'Use current location'}</AppText>
                  </Pressable>
                </View>
                <AppText color={theme.colors.textMuted} style={styles.mapHint}>{coordinate ? `Pinned at ${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}` : 'Tap the map to place the address pin.'}</AppText>
              </View>
              <AppText style={styles.label} weight="700">Address type</AppText>
              <View style={styles.types}>{types.map(type => (
                <Pressable key={type} onPress={() => setAddressType(type)} style={[styles.type, { borderColor: addressType === type ? theme.colors.primary : theme.colors.border, backgroundColor: addressType === type ? theme.colors.primarySoft : theme.colors.surface }]}>
                  <AppText color={addressType === type ? theme.colors.primary : theme.colors.textMuted} style={styles.typeText} weight="700">{type}</AppText>
                </Pressable>
              ))}</View>
              <Field label="Flat / house number" value={flatNo} onChangeText={setFlatNo} />
              <Field label="Building name" value={buildingName} onChangeText={setBuildingName} />
              <Field label="Landmark" value={landmark} onChangeText={setLandmark} />
              <Field label="Full address *" value={address} onChangeText={setAddress} multiline />
              <Field label="City *" value={city} onChangeText={setCity} onFocus={revealFormFields} />
              <Field label="Pincode *" value={pincode} onChangeText={next => setPincode(next.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" onFocus={revealFormFields} />
              <Pressable onPress={() => setIsDefault(current => !current)} style={styles.defaultRow}>
                <View style={[styles.checkbox, { borderColor: isDefault ? theme.colors.primary : theme.colors.border, backgroundColor: isDefault ? theme.colors.primary : theme.colors.surface }]}>{isDefault && <AppText color="#FFFFFF" weight="800">✓</AppText>}</View>
                <View><AppText style={styles.defaultTitle} weight="700">Make default address</AppText><AppText color={theme.colors.textMuted} style={styles.defaultText}>Preselect this for future collections.</AppText></View>
              </Pressable>
            </View>
            {error && <AppText color={theme.colors.danger} style={styles.error}>{error}</AppText>}
            <Pressable disabled={saving} onPress={save} style={[styles.save, { backgroundColor: saving ? theme.colors.border : theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.saveText} weight="800">{saving ? 'Saving…' : existing ? 'Save changes' : 'Add address'}</AppText></Pressable>
            {existing && <Pressable disabled={saving} onPress={remove} style={[styles.delete, { borderColor: theme.colors.primary }]}><Trash color={theme.colors.primary} size={16} /><AppText color={theme.colors.primary} style={styles.deleteText} weight="800">Delete address</AppText></Pressable>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({ label, value, onChangeText, onFocus, multiline, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; onFocus?: () => void; multiline?: boolean; keyboardType?: 'default' | 'number-pad' }) {
  const { theme } = useAppTheme();
  return <View style={styles.field}><AppText style={styles.label} weight="700">{label}</AppText><TextInput value={value} onChangeText={onChangeText} onFocus={onFocus} multiline={multiline} keyboardType={keyboardType} placeholder={`Enter ${label.replace(' *', '').toLowerCase()}`} placeholderTextColor={theme.colors.textMuted} style={[styles.input, multiline && styles.multiline, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted }]} /></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14 },
  back: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 21 },
  headerSpacer: { width: 36 },
  content: { padding: 16, paddingBottom: 34 },
  form: { borderWidth: 1, borderRadius: 18, padding: 13 },
  field: { marginBottom: 14 },
  label: { marginBottom: 7, fontSize: 11, lineHeight: 14 },
  input: { minHeight: 47, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 12 },
  multiline: { minHeight: 82, paddingTop: 12, textAlignVertical: 'top' },
  types: { flexDirection: 'row', gap: 7, marginBottom: 15 },
  type: { flex: 1, minHeight: 38, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeText: { fontSize: 9, lineHeight: 12, textTransform: 'capitalize' },
  searchBox: { minHeight: 47, marginBottom: 7, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, paddingVertical: 0, fontSize: 12 },
  suggestions: { marginBottom: 9, borderWidth: 1, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  suggestion: { minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  suggestionCopy: { flex: 1 },
  suggestionTitle: { fontSize: 11, lineHeight: 14 },
  suggestionSubtitle: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  mapContainer: { height: 220, overflow: 'hidden', borderWidth: 1, borderRadius: 14 },
  map: StyleSheet.absoluteFill,
  locateButton: { position: 'absolute', right: 10, bottom: 10, minHeight: 38, paddingHorizontal: 11, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 3 },
  locateText: { fontSize: 10, lineHeight: 13 },
  mapHint: { marginTop: 7, fontSize: 9, lineHeight: 13 },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 23, height: 23, borderWidth: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  defaultTitle: { fontSize: 10, lineHeight: 13 },
  defaultText: { marginTop: 2, fontSize: 8, lineHeight: 11 },
  error: { marginTop: 10, textAlign: 'center', fontSize: 10, lineHeight: 14 },
  save: { minHeight: 50, borderRadius: 14, marginTop: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 12, lineHeight: 16 },
  delete: { minHeight: 48, borderRadius: 14, borderWidth: 1, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  deleteText: { fontSize: 10, lineHeight: 13 },
});
