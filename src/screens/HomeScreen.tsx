import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Clock3 from 'lucide-react-native/icons/clock-3';
import Globe from 'lucide-react-native/icons/globe';
import MapPin from 'lucide-react-native/icons/map-pin';
import Search from 'lucide-react-native/icons/search';
import ShoppingBasket from 'lucide-react-native/icons/shopping-basket';
import X from 'lucide-react-native/icons/x';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ImageBackground,
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
import { AppText, BottomTabHeader, Screen } from '../components';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import { HomeStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchZones, setSelectedZone } from '../store/zonesSlice';
import { zoneAvailabilityLabel } from '../api/zones';
import { getLabsByZone } from '../api/labs';

type ServiceLocation = {
  id: string;
  name: string;
  detail: string;
  eta: string;
};

type HomeScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  'HomeLanding'
>;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const zones = useAppSelector(state => state.zones.items);
  const selectedZone = useAppSelector(state => state.zones.selected);
  const zonesStatus = useAppSelector(state => state.zones.status);
  const locationsError = useAppSelector(state => state.zones.error);
  const [locationOpen, setLocationOpen] = useState(false);
  const [accreditedLabCount, setAccreditedLabCount] = useState<number | null>(
    null,
  );
  const [labCountError, setLabCountError] = useState(false);
  const [labCountZoneId, setLabCountZoneId] = useState<number | null>(null);
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

  useEffect(() => {
    let active = true;

    if (!selectedZone?.zone_id) {
      setAccreditedLabCount(null);
      setLabCountError(false);
      return () => {
        active = false;
      };
    }

    setAccreditedLabCount(null);
    setLabCountError(false);
    setLabCountZoneId(selectedZone.zone_id);
    getLabsByZone(selectedZone.zone_id, 0, 19)
      .then(page => {
        if (!Number.isInteger(page.meta?.total) || page.meta.total < 0) {
          throw new Error('Invalid lab total');
        }
        if (active) setAccreditedLabCount(page.meta.total);
      })
      .catch(() => {
        if (active) setLabCountError(true);
      });

    return () => {
      active = false;
    };
  }, [selectedZone?.zone_id]);

  const currentLabCount =
    labCountZoneId === selectedZone?.zone_id ? accreditedLabCount : null;
  const currentLabCountError =
    labCountZoneId === selectedZone?.zone_id && labCountError;
  const labCountLabel = !selectedZone
    ? 'Choose your location'
    : currentLabCountError
    ? 'Lab availability unavailable'
    : currentLabCount === null
    ? 'Checking nearby labs...'
    : `${currentLabCount} ${currentLabCount === 1 ? 'lab' : 'labs'} available`;
  const nearbyLabsLabel =
    currentLabCount === null
      ? labCountLabel
      : `${currentLabCount} ${currentLabCount === 1 ? 'lab' : 'labs'} near you`;

  const chooseLocation = (location: ServiceLocation) => {
    const zone = zones.find(item => String(item.zone_id) === location.id);
    if (zone) dispatch(setSelectedZone(zone));
    setLocationOpen(false);
  };

  return (
    <>
      <LinearGradient
        colors={screenGradientColors(theme)}
        end={{ x: 0, y: 1 }}
        locations={screenGradientLocations}
        start={{ x: 0, y: 0 }}
        style={styles.screenGradient}
      >
        <Screen
          backgroundColor="transparent"
          contentContainerStyle={styles.content}
        >
          <BottomTabHeader />

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

          <Pressable
            accessibilityLabel="Search tests and labs"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Search')}
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
          </Pressable>

          <LinearGradient
            colors={['#102A46', '#1B3550', '#7E4548']}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            style={styles.hero}
          >
            <ImageBackground
              source={images.homeBanner}
              resizeMode="cover"
              style={styles.heroImage}
              imageStyle={styles.heroImageCorners}
            />
            <LinearGradient
              colors={[
                'rgba(5,23,43,0.9)',
                'rgba(10,37,62,0.54)',
                'rgba(93,37,47,0.22)',
              ]}
              end={{ x: 1, y: 0.5 }}
              locations={[0, 0.56, 1]}
              start={{ x: 0, y: 0.5 }}
              style={styles.heroImageOverlay}
            />
            <AppText color="#FFA6B2" style={styles.eyebrow} weight="800">
              — {nearbyLabsLabel.toUpperCase()}
            </AppText>
            <AppText color="#FFFFFF" style={styles.heroTitle} weight="500">
              Compare first.{' '}
              <AppText color="#FFA6B2" style={styles.heroTitle} weight="500">
                Book{`\n`}with confidence.
              </AppText>
            </AppText>
            <AppText color="#D7E0E8" style={styles.heroBody}>
              See accreditation, report time and the complete price.
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
                Find labs
              </AppText>
              <ArrowRight color="#FFFFFF" size={14} />
            </Pressable>
          </LinearGradient>

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle} weight="600">
              Available for you
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Find home collection labs. ${labCountLabel}`}
            onPress={() => navigation.navigate('Labs')}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <LinearGradient
              colors={['#071F35', '#123B50', '#6A3543']}
              end={{ x: 1, y: 0.5 }}
              start={{ x: 0, y: 0.5 }}
              style={styles.careCard}
            >
              <ImageBackground
                source={images.careImage}
                resizeMode="cover"
                style={styles.careImage}
                imageStyle={styles.careImageCorners}
              />
              <LinearGradient
                colors={[
                  'rgba(4,25,43,0.96)',
                  'rgba(6,35,56,0.72)',
                  'rgba(40,23,35,0.2)',
                ]}
                end={{ x: 1, y: 0.5 }}
                locations={[0, 0.58, 1]}
                start={{ x: 0, y: 0.5 }}
                style={styles.careImageOverlay}
              />
              <View style={styles.careCopy}>
                <AppText color="#FFA6B2" style={styles.eyebrow} weight="800">
                  AT-HOME LABS
                </AppText>
                <AppText color="#FFFFFF" style={styles.careTitle} weight="800">
                  Home collection in{`\n`}your zone.
                </AppText>
                <AppText color="#C9D6E0" style={styles.careBody}>
                  Slots available tomorrow morning.
                </AppText>
                <View style={styles.availablePill}>
                  <AppText color="#087C67" style={styles.pillText} weight="700">
                    {currentLabCount !== null && currentLabCount > 0
                      ? '● '
                      : ''}
                    {labCountLabel}
                  </AppText>
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          <View style={styles.serviceRow}>
            <ServiceCard
              icon={<ShoppingBasket color="#08233D" size={18} />}
              eyebrow="QUICK COMMERCE"
              title="Essentials nearby."
              status="Join waitlist"
              gradient={
                theme.isDark
                  ? [theme.colors.surface, '#14282A']
                  : ['#FFFFFF', '#E9FAF6']
              }
              statusBackground={theme.colors.surfaceMuted}
              statusColor={theme.colors.textMuted}
              disabled
            />
            <ServiceCard
              icon={<Globe color="#08233D" size={18} />}
              eyebrow="GLOBAL STORE"
              title="Always available."
              status="Coming soon"
              gradient={
                theme.isDark
                  ? [theme.colors.surface, '#291A24']
                  : ['#FFFFFF', '#D9DADD']
              }
              statusBackground={theme.colors.surfaceMuted}
              statusColor={theme.colors.textMuted}
              disabled
            />
          </View>

          <AppText
            style={[styles.sectionTitle, styles.wellnessHeading]}
            weight="600"
          >
            Make time for you
          </AppText>
          <View
            style={[
              styles.wellnessCard,
              {
                backgroundColor: theme.colors.primarySoft2,
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
                  styles.checkinIcon,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <ArrowRight color="#FFFFFF" size={18} />
              </View>
              <AppText style={styles.checkinText} weight="800">
                Coming soon
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
                    <AppText
                      color="#FFFFFF"
                      style={styles.retryText}
                      weight="700"
                    >
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
                        <ChevronRight
                          color={theme.colors.textMuted}
                          size={18}
                        />
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
  disabled?: boolean;
};
function ServiceCard(props: ServiceCardProps) {
  const { theme } = useAppTheme();
  const gradientColors = props.disabled
    ? theme.isDark
      ? [theme.colors.surfaceMuted, theme.colors.surface]
      : ['#F7F7F5', '#FBFBF9']
    : props.gradient;

  return (
    <LinearGradient
      colors={gradientColors}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={[
        styles.serviceCard,
        props.disabled && styles.serviceCardDisabled,
        {
          borderColor: theme.colors.border,
          shadowColor: props.disabled ? 'transparent' : theme.colors.shadow,
        },
      ]}
    >
      <View
        style={[
          styles.serviceIcon,
          props.disabled && {
            backgroundColor: theme.isDark
              ? theme.colors.surfaceMuted
              : '#FFFFFF',
          },
        ]}
      >
        {props.icon}
      </View>
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
        style={[
          styles.statusPill,
          {
            backgroundColor: props.disabled
              ? theme.isDark
                ? theme.colors.surfaceMuted
                : '#ECEDEB'
              : props.statusBackground,
          },
        ]}
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
  heroImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  heroImageCorners: { borderRadius: 20 },
  heroImageOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  eyebrow: { fontSize: 9, lineHeight: 12, letterSpacing: 1.15 },
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
  sectionTitle: { fontSize: 18, lineHeight: 21, letterSpacing: -0.4 },
  careCard: {
    minHeight: 132,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 18,
    padding: 15,
  },
  careImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  careImageCorners: { borderRadius: 18 },
  careImageOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  serviceRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  serviceCard: {
    flex: 1,
    minHeight: 150,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    elevation: 4,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  serviceCardDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  serviceEyebrow: {
    marginTop: 14,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.8,
  },
  serviceTitle: { marginTop: 5, fontSize: 15, lineHeight: 19 },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  wellnessHeading: { marginTop: 15, marginBottom: 7 },
  wellnessCard: {
    minHeight: 190,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 22,
    padding: 21,
    elevation: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  wellnessTitle: {
    marginTop: 12,
    fontSize: 22,
    lineHeight: 23,
    letterSpacing: -0.5,
  },
  wellnessBody: { width: '67%', marginTop: 10, fontSize: 10, lineHeight: 15 },
  checkinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  checkinIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinText: { fontSize: 12, lineHeight: 15 },
  ringOuter: {
    position: 'absolute',
    right: -18,
    bottom: -70,
    width: 185,
    height: 185,
    borderRadius: 93,
    borderWidth: 22,
    borderColor: 'rgba(223,31,45,0.13)',
  },
  ringInner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderRadius: 72,
    borderWidth: 16,
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
