import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleQuestionMark from 'lucide-react-native/icons/circle-question-mark';
import Clock3 from 'lucide-react-native/icons/clock-3';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import Globe from 'lucide-react-native/icons/globe';
import MapPin from 'lucide-react-native/icons/map-pin';
import Search from 'lucide-react-native/icons/search';
import ShoppingBasket from 'lucide-react-native/icons/shopping-basket';
import Sparkles from 'lucide-react-native/icons/sparkles';
import X from 'lucide-react-native/icons/x';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { images } from '../assets/images';
import { AppText, Screen } from '../components';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchZones, setSelectedZone } from '../store/zonesSlice';
import { zoneAvailabilityLabel } from '../api/zones';

type ServiceLocation = {
  id: string;
  name: string;
  detail: string;
  eta: string;
};

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'HomeLanding'>;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const zones = useAppSelector(state => state.zones.items);
  const selectedZone = useAppSelector(state => state.zones.selected);
  const zonesStatus = useAppSelector(state => state.zones.status);
  const locationsError = useAppSelector(state => state.zones.error);
  const [locationOpen, setLocationOpen] = useState(false);
  const serviceLocations = useMemo(
    () =>
      zones.map(zone => ({
        id: String(zone.zone_id),
        name: zone.zone_name,
        detail: `Haa Health service zone #${zone.zone_id}`,
        eta: zoneAvailabilityLabel(zone),
      })),
    [zones],
  );
  const selectedLocation = serviceLocations.find(
    item => item.id === String(selectedZone?.zone_id),
  );
  const locationsLoading = zonesStatus === 'loading' || zonesStatus === 'idle';
  const filteredLocations = serviceLocations;

  const loadZones = useCallback(() => {
    dispatch(fetchZones());
  }, [dispatch]);

  useEffect(() => {
    if (zonesStatus === 'idle') loadZones();
  }, [loadZones, zonesStatus]);

  const chooseLocation = (location: ServiceLocation) => {
    const zone = zones.find(item => String(item.zone_id) === location.id);
    if (zone) dispatch(setSelectedZone(zone));
    setLocationOpen(false);
  };

  return (
    <>
      <LinearGradient
        colors={[
          theme.colors.gradientStart,
          theme.isDark ? theme.colors.background : '#FBF8F6',
          theme.colors.gradientEnd,
        ]}
        locations={[0, 0.48, 1]}
        style={styles.screenGradient}
      >
        <Screen
          backgroundColor="transparent"
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <Image
              resizeMode="contain"
              source={images.logo}
              style={styles.logo}
            />
            <Pressable
              onPress={() => setLocationOpen(true)}
              style={[
                styles.helpButton,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <CircleQuestionMark color={theme.colors.primary} size={15} />
              <AppText
                color={theme.colors.primary}
                style={styles.helpText}
                weight="700"
              >
                Need help?
              </AppText>
            </Pressable>
          </View>

          <Pressable
            accessibilityHint="Shows available service locations"
            accessibilityRole="button"
            onPress={() => setLocationOpen(true)}
            style={({ pressed }) => [
              styles.addressRow,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.addressIcon,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <MapPin color={theme.colors.primary} size={18} />
            </View>
            <View style={styles.addressCopy}>
              <AppText
                color={theme.colors.textMuted}
                style={styles.addressLabel}
                weight="700"
              >
                CARE AT YOUR ADDRESS
              </AppText>
              <AppText
                numberOfLines={1}
                style={styles.addressTitle}
                weight="800"
              >
                {selectedLocation?.name ?? 'Choose your location'}
              </AppText>
              <AppText
                color={theme.colors.textMuted}
                numberOfLines={1}
                style={styles.addressDetail}
              >
                {selectedLocation?.eta ?? 'Select an available service zone'}
              </AppText>
            </View>
            <ChevronDown color={theme.colors.textMuted} size={18} />
          </Pressable>

          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <Search color={theme.colors.textMuted} size={18} />
            <AppText
              color={theme.colors.textMuted}
              style={styles.searchPlaceholder}
            >
              Search tests, products and care
            </AppText>
          </View>

          <LinearGradient
            colors={['#102A46', '#1B3550', '#7E4548']}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroGlow} />
            <AppText color="#FF8690" style={styles.eyebrow} weight="800">
              — DIAGNOSTICS, DONE DIFFERENTLY
            </AppText>
            <AppText color="#FFFFFF" style={styles.heroTitle} weight="800">
              The same test.{`\n`}
              <AppText color="#FF7884" style={styles.heroTitle} weight="800">
                Clearer choices.
              </AppText>
            </AppText>
            <AppText color="#D7E0E8" style={styles.heroBody}>
              Compare trusted labs on price, parameters and report time.
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Labs')}
              style={[
                styles.heroButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <AppText
                color="#FFFFFF"
                style={styles.heroButtonText}
                weight="700"
              >
                Book a test
              </AppText>
              <ChevronRight color="#FFFFFF" size={14} />
            </Pressable>
            <View style={styles.heroArt}>
              <FlaskConical
                color="rgba(255,255,255,0.3)"
                size={82}
                strokeWidth={1.2}
              />
            </View>
          </LinearGradient>

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle} weight="800">
              Choose your care
            </AppText>
            <AppText
              color={theme.colors.primary}
              style={styles.viewAll}
              weight="700"
            >
              View all
            </AppText>
          </View>
          <LinearGradient
            colors={['#092943', '#0A2035']}
            style={styles.careCard}
          >
            <View style={styles.careCopy}>
              <AppText color="#FF8B94" style={styles.eyebrow} weight="800">
                AT-HOME LABS
              </AppText>
              <AppText color="#FFFFFF" style={styles.careTitle} weight="800">
                Book your test,{`\n`}your way.
              </AppText>
              <AppText color="#C9D6E0" style={styles.careBody}>
                6 accredited labs serve this address.
              </AppText>
              <View style={styles.availablePill}>
                <AppText color="#087C67" style={styles.pillText} weight="700">
                  Available today
                </AppText>
              </View>
            </View>
            <View style={styles.careArt}>
              <FlaskConical color="#9FB5C7" size={62} strokeWidth={1.3} />
              <Sparkles color="#FF6675" size={24} />
            </View>
          </LinearGradient>

          <View style={styles.serviceRow}>
            <ServiceCard
              icon={<ShoppingBasket color={theme.colors.text} size={18} />}
              eyebrow="QUICK COMMERCE"
              title="Essentials nearby."
              status="15–25 min"
              gradient={['#FFFFFF', '#E9FAF6']}
              statusBackground="#D7F6EC"
              statusColor="#087C67"
            />
            <ServiceCard
              icon={<Globe color={theme.colors.text} size={18} />}
              eyebrow="GLOBAL STORE"
              title="Always available."
              status="Across India"
              gradient={['#FFFFFF', '#FFF0F4']}
              statusBackground={theme.colors.primarySoft}
              statusColor={theme.colors.primary}
            />
          </View>

          <AppText
            style={[styles.sectionTitle, styles.wellnessHeading]}
            weight="800"
          >
            Make time for you
          </AppText>
          <View
            style={[
              styles.wellnessCard,
              {
                backgroundColor: theme.colors.primarySoft,
                borderColor: '#F7CBD1',
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <AppText
              color={theme.colors.primary}
              style={styles.eyebrow}
              weight="800"
            >
              A 60-SECOND CHECK-IN
            </AppText>
            <AppText style={styles.wellnessTitle} weight="800">
              How are you feeling{`\n`}today?
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.wellnessBody}>
              Share a little about your energy, sleep and stress for a gentler
              next step.
            </AppText>
            <View style={styles.checkinRow}>
              <View
                style={[
                  styles.arrowButton,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <ChevronRight color="#FFFFFF" size={17} />
              </View>
              <AppText style={styles.checkinText} weight="700">
                Start your check-in
              </AppText>
            </View>
            <View style={styles.ringOuter}>
              <View style={styles.ringInner} />
            </View>
          </View>
        </Screen>
      </LinearGradient>

      <Modal
        animationType="slide"
        onRequestClose={() => setLocationOpen(false)}
        statusBarTranslucent
        transparent
        visible={locationOpen}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Close locations"
            onPress={() => setLocationOpen(false)}
            style={styles.modalBackdrop}
          />
          <SafeAreaView
            edges={['bottom']}
            style={[
              styles.locationSheet,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View
              style={[
                styles.sheetHandle,
                { backgroundColor: theme.colors.border },
              ]}
            />
            <View style={styles.sheetHeader}>
              <View>
                <AppText style={styles.sheetTitle} weight="800">
                  Choose your location
                </AppText>
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.sheetSubtitle}
                >
                  Areas where Haa Health is available
                </AppText>
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={() => setLocationOpen(false)}
                style={[
                  styles.closeButton,
                  { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <X color={theme.colors.text} size={20} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => {
                setLocationOpen(false);
                navigation.navigate('CitySearch');
              }}
              style={[
                styles.locationSearch,
                { backgroundColor: theme.colors.surfaceMuted },
              ]}
            >
              <Search color={theme.colors.textMuted} size={18} />
              <AppText
                color={theme.colors.textMuted}
                style={styles.locationInput}
              >
                Search city name
              </AppText>
            </Pressable>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {locationsLoading ? (
                <View style={styles.locationState}>
                  <ActivityIndicator color={theme.colors.primary} />
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.locationStateText}
                  >
                    Loading available zones…
                  </AppText>
                </View>
              ) : null}
              {locationsError ? (
                <View style={styles.locationState}>
                  <AppText style={styles.noLocationsTitle} weight="700">
                    Could not load locations
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.locationStateText}
                  >
                    {locationsError}
                  </AppText>
                  <Pressable
                    onPress={loadZones}
                    style={[
                      styles.retryButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <AppText color="#FFFFFF" style={styles.retryText} weight="700">
                      Try again
                    </AppText>
                  </Pressable>
                </View>
              ) : null}
              {!locationsLoading && !locationsError
                ? filteredLocations.map(location => {
                const selected = location.id === selectedLocation?.id;
                return (
                  <Pressable
                    key={location.id}
                    onPress={() => chooseLocation(location)}
                    style={({ pressed }) => [
                      styles.locationOption,
                      { borderBottomColor: theme.colors.border },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.locationOptionIcon,
                        {
                          backgroundColor: selected
                            ? theme.colors.primary
                            : theme.colors.primarySoft,
                        },
                      ]}
                    >
                      <MapPin
                        color={selected ? '#FFFFFF' : theme.colors.primary}
                        size={18}
                      />
                    </View>
                    <View style={styles.locationOptionCopy}>
                      <AppText
                        style={styles.locationName}
                        weight={selected ? '800' : '700'}
                      >
                        {location.name}
                      </AppText>
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.locationDetail}
                      >
                        {location.detail}
                      </AppText>
                      <View style={styles.availabilityRow}>
                        <Clock3 color="#087C67" size={12} />
                        <AppText
                          color="#087C67"
                          style={styles.availabilityText}
                          weight="600"
                        >
                          {location.eta}
                        </AppText>
                      </View>
                    </View>
                    <ChevronRight color={theme.colors.textMuted} size={18} />
                  </Pressable>
                );
                  })
                : null}
              {!locationsLoading &&
              !locationsError &&
              !filteredLocations.length ? (
                <View style={styles.noLocations}>
                  <MapPin color={theme.colors.textMuted} size={28} />
                  <AppText style={styles.noLocationsTitle} weight="700">
                    No service area found
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.noLocationsBody}
                  >
                    Try another service zone.
                  </AppText>
                </View>
              ) : null}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

type ServiceCardProps = {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  status: string;
  gradient: string[];
  statusBackground: string;
  statusColor: string;
};
function ServiceCard(props: ServiceCardProps) {
  const { theme } = useAppTheme();
  return (
    <LinearGradient
      colors={props.gradient}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={[
        styles.serviceCard,
        {
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.serviceIcon}>{props.icon}</View>
      <AppText
        color={theme.colors.textMuted}
        style={styles.serviceEyebrow}
        weight="700"
      >
        {props.eyebrow}
      </AppText>
      <AppText style={styles.serviceTitle} weight="800">
        {props.title}
      </AppText>
      <View
        style={[styles.statusPill, { backgroundColor: props.statusBackground }]}
      >
        <AppText color={props.statusColor} style={styles.pillText} weight="700">
          {props.status}
        </AppText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screenGradient: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 74, height: 40 },
  helpButton: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  helpText: { fontSize: 11, lineHeight: 14 },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingVertical: 5,
  },
  addressIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCopy: { flex: 1 },
  addressLabel: { fontSize: 8, lineHeight: 10, letterSpacing: 0.5 },
  addressTitle: { fontSize: 14, lineHeight: 18 },
  addressDetail: { fontSize: 9, lineHeight: 12 },
  pressed: { opacity: 0.65 },
  searchBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  searchPlaceholder: { flex: 1, fontSize: 12, lineHeight: 16 },
  hero: {
    minHeight: 188,
    overflow: 'hidden',
    marginTop: 14,
    borderRadius: 20,
    padding: 17,
  },
  heroGlow: {
    position: 'absolute',
    right: -40,
    bottom: -60,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  eyebrow: { fontSize: 9, lineHeight: 12, letterSpacing: 0.6 },
  heroTitle: {
    marginTop: 12,
    fontSize: 23,
    lineHeight: 22,
    letterSpacing: -0.7,
  },
  heroBody: { width: '58%', marginTop: 8, fontSize: 10, lineHeight: 14 },
  heroButton: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 13,
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  heroButtonText: { fontSize: 10, lineHeight: 13 },
  heroArt: {
    position: 'absolute',
    right: 23,
    bottom: 23,
    transform: [{ rotate: '-18deg' }],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 7,
  },
  sectionTitle: { fontSize: 16, lineHeight: 21, letterSpacing: -0.4 },
  viewAll: { fontSize: 10, lineHeight: 14 },
  careCard: {
    minHeight: 132,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 18,
    padding: 15,
  },
  careCopy: { flex: 1, zIndex: 1 },
  careTitle: { marginTop: 7, fontSize: 19, lineHeight: 19 },
  careBody: { marginTop: 7, fontSize: 9, lineHeight: 12 },
  availablePill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#D7F6EC',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pillText: { fontSize: 8, lineHeight: 10 },
  careArt: {
    width: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  serviceRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  serviceCard: {
    flex: 1,
    minHeight: 125,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  serviceIcon: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  serviceEyebrow: {
    marginTop: 10,
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0.4,
  },
  serviceTitle: { marginTop: 3, fontSize: 13, lineHeight: 17 },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  wellnessHeading: { marginTop: 15, marginBottom: 7 },
  wellnessCard: {
    minHeight: 170,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 17,
    elevation: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  wellnessTitle: {
    marginTop: 10,
    fontSize: 21,
    lineHeight: 20,
    letterSpacing: -0.5,
  },
  wellnessBody: { width: '60%', marginTop: 8, fontSize: 9, lineHeight: 13 },
  checkinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 13,
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinText: { fontSize: 10, lineHeight: 13 },
  ringOuter: {
    position: 'absolute',
    right: -30,
    bottom: -65,
    width: 165,
    height: 165,
    borderRadius: 83,
    borderWidth: 20,
    borderColor: 'rgba(223,31,45,0.13)',
  },
  ringInner: {
    position: 'absolute',
    top: 17,
    left: 17,
    right: 17,
    bottom: 17,
    borderRadius: 62,
    borderWidth: 14,
    borderColor: 'rgba(8,35,61,0.1)',
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.52)',
  },
  locationSheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    alignSelf: 'center',
    marginTop: 9,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 17,
    paddingBottom: 15,
  },
  sheetTitle: { fontSize: 21, lineHeight: 26 },
  sheetSubtitle: { marginTop: 2, fontSize: 12, lineHeight: 16 },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  locationSearch: {
    height: 47,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 13,
    paddingHorizontal: 13,
    marginBottom: 8,
  },
  locationInput: { flex: 1, fontSize: 13, lineHeight: 17 },
  locationOption: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  locationOptionIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  locationOptionCopy: { flex: 1 },
  locationName: { fontSize: 14, lineHeight: 18 },
  locationDetail: { marginTop: 2, fontSize: 10, lineHeight: 14 },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  availabilityText: { fontSize: 9, lineHeight: 12 },
  noLocations: { alignItems: 'center', paddingVertical: 38 },
  noLocationsTitle: { marginTop: 10, fontSize: 15, lineHeight: 20 },
  noLocationsBody: { marginTop: 2, fontSize: 11, lineHeight: 15 },
  locationState: { alignItems: 'center', paddingVertical: 38 },
  locationStateText: {
    marginTop: 7,
    paddingHorizontal: 24,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
  retryButton: {
    marginTop: 13,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryText: { fontSize: 10, lineHeight: 13 },
});
