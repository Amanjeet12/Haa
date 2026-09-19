import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleQuestionMark from 'lucide-react-native/icons/circle-question-mark';
import FileText from 'lucide-react-native/icons/file-text';
import LogOut from 'lucide-react-native/icons/log-out';
import MapPin from 'lucide-react-native/icons/map-pin';
import Plus from 'lucide-react-native/icons/plus';
import Settings from 'lucide-react-native/icons/settings';
import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addressLine,
  CustomerAddress,
  getCustomerAddresses,
} from '../api/addresses';
import { CustomerBooking, getCustomerBookings } from '../api/bookings';
import { FamilyMember, getFamilyMembers } from '../api/familyMembers';
import { AppText, BottomTabHeader } from '../components';
import { useAppDispatch, useAppSelector } from '../store';
import { signOut } from '../store/authSlice';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import { MainTabParamList, RootStackParamList } from '../types/navigation';

export function ProfileScreen() {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const session = useAppSelector(state => state.auth.session);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);

  const loadProfile = useCallback(() => {
    if (!session?.token) return;
    Promise.all([
      getFamilyMembers(session.token),
      getCustomerAddresses(session.token),
      getCustomerBookings(session.token),
    ])
      .then(([family, savedAddresses, customerBookings]) => {
        setMembers(family);
        setAddresses(savedAddresses);
        setBookings(customerBookings);
      })
      .catch(() => undefined);
  }, [session?.token]);

  useFocusEffect(useCallback(() => loadProfile(), [loadProfile]));

  const customer = session?.customer;
  const selfMember = members.find(
    member => member.relation.trim().toLowerCase() === 'self',
  );
  const profileName = selfMember?.name ?? customer?.name ?? '';
  const profilePhone = selfMember?.phone ?? customer?.phone ?? '';
  const profilePhoto = selfMember?.profilePhoto ?? customer?.profilePhoto;
  const homeAddress =
    addresses.find(address => address.billing_address.isDefault) ??
    addresses[0];
  const readyReports = bookings.reduce(
    (count, booking) =>
      count +
      booking.members.filter(member =>
        Boolean(
          member.result_pdf || member.tests.some(test => test.result_pdf),
        ),
      ).length,
    0,
  );

  return (
    <LinearGradient
      colors={screenGradientColors(theme)}
      locations={screenGradientLocations}
      style={styles.flex}
    >
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <BottomTabHeader />
          <AppText
            color={theme.colors.primary}
            style={styles.eyebrow}
            weight="800"
          >
            — YOUR HAA HEALTH ACCOUNT
          </AppText>
          <AppText style={styles.title} weight="500">
            Your{' '}
            <AppText
              color={theme.colors.primary}
              style={styles.title}
              weight="500"
            >
              profile.
            </AppText>
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            Personal details, family care and privacy in one place.
          </AppText>

          {!customer ? (
            <View
              style={[
                styles.guestCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppText style={styles.guestTitle} weight="800">
                Log in to your profile
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.guestText}>
                Manage family profiles, bookings, reports and saved addresses.
              </AppText>
              <Pressable
                onPress={() =>
                  navigation
                    .getParent<NavigationProp<RootStackParamList>>()
                    ?.navigate('Login')
                }
                style={[
                  styles.login,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <AppText color="#FFFFFF" weight="800">
                  Login
                </AppText>
              </Pressable>
            </View>
          ) : (
            <>
              <LinearGradient
                colors={['#092943', '#153A5C', '#2D335B']}
                style={styles.memberCard}
              >
                <View style={styles.memberGlow} />
                <View style={styles.profilePhoto}>
                  {profilePhoto ? (
                    <Image
                      source={{ uri: profilePhoto }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <AppText
                      color={theme.colors.primary}
                      style={styles.initials}
                      weight="800"
                    >
                      {profileName
                        .split(' ')
                        .map(part => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AppText>
                  )}
                </View>
                <View style={styles.memberCopy}>
                  <AppText
                    color="#F58B96"
                    style={styles.memberEyebrow}
                    weight="800"
                  >
                    HAA HEALTH MEMBER
                  </AppText>
                  <AppText
                    color="#FFFFFF"
                    style={styles.customerName}
                    weight="800"
                  >
                    {profileName}
                  </AppText>
                  <AppText color="#C5D2DE" style={styles.phone}>
                    {profilePhone}
                    {selfMember
                      ? ` · ${selfMember.age} yrs · ${selfMember.gender}`
                      : ''}
                  </AppText>
                  <View style={styles.verified}>
                    <AppText
                      color="#72DCC4"
                      style={styles.verifiedText}
                      weight="700"
                    >
                      ✓ Phone verified
                    </AppText>
                  </View>
                </View>
              </LinearGradient>

              <Pressable
                onPress={() =>
                  navigation
                    .getParent<NavigationProp<RootStackParamList>>()
                    ?.navigate('Addresses')
                }
                style={[
                  styles.addressCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.addressIcon,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}
                >
                  <MapPin color={theme.colors.primary} size={17} />
                </View>
                <View style={styles.grow}>
                  <AppText style={styles.addressTitle} weight="800">
                    Home address
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.addressText}
                    numberOfLines={1}
                  >
                    {homeAddress
                      ? addressLine(homeAddress)
                      : 'No saved address'}
                  </AppText>
                </View>
                <AppText
                  color={theme.colors.primary}
                  style={styles.manage}
                  weight="800"
                >
                  Manage
                </AppText>
              </Pressable>

              <SectionTitle title="Family profiles" action="Manage" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.familyRow}
              >
                {members.map(member => (
                  <FamilyTile
                    key={member.member_id}
                    member={member}
                    onPress={() =>
                      navigation
                        .getParent<NavigationProp<RootStackParamList>>()
                        ?.navigate('FamilyMemberForm', { member })
                    }
                  />
                ))}
                <Pressable
                  onPress={() =>
                    navigation
                      .getParent<NavigationProp<RootStackParamList>>()
                      ?.navigate('FamilyMemberForm')
                  }
                  style={[
                    styles.familyTile,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.addCircle,
                      { borderColor: theme.colors.primary },
                    ]}
                  >
                    <Plus color={theme.colors.primary} size={16} />
                  </View>
                  <AppText style={styles.familyName} weight="700">
                    Add member
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.familyRelation}
                  >
                    Family care
                  </AppText>
                </Pressable>
              </ScrollView>
            </>
          )}

          <SectionTitle title="Your health and orders" />
          <View
            style={[
              styles.menuCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MenuRow
              icon={<FileText color="#D64A5B" size={17} />}
              color="#FFF0F2"
              title="Reports and health records"
              subtitle={`${readyReports} ready · ${Math.max(
                bookings.length - readyReports,
                0,
              )} processing`}
              count={readyReports}
              onPress={() => navigation.navigate('Reports')}
            />
            <MenuRow
              icon={<CalendarDays color="#D64A5B" size={17} />}
              color="#FFF0F2"
              title="Bookings"
              subtitle="Current and previous lab bookings"
              count={bookings.length}
              onPress={() => navigation.navigate('Bookings')}
            />
            {/* <MenuRow
                  icon={<PackageOpen color="#94A3B8" size={17} />}
                  color="#F1F3F5"
                  title="Order history"
                  subtitle="Coming soon"
                  count={0}
                  disabled
                  last
                /> */}
          </View>

          <SectionTitle title="Account settings" />
          <View
            style={[
              styles.menuCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <MenuRow
              icon={<Settings color="#D64A5B" size={17} />}
              color="#FFF0F2"
              title="Appearance and preferences"
              subtitle="Theme and app settings"
              onPress={() =>
                navigation
                  .getParent<NavigationProp<RootStackParamList>>()
                  ?.navigate('AppearancePreferences')
              }
            />
            <MenuRow
              icon={<CircleQuestionMark color="#D64A5B" size={17} />}
              color="#FFF0F2"
              title="Support and help"
              subtitle="View or create support requests"
              onPress={() =>
                navigation
                  .getParent<NavigationProp<RootStackParamList>>()
                  ?.navigate('Support')
              }
            />
            <Pressable
              onPress={() => dispatch(signOut())}
              style={styles.logoutRow}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <LogOut color={theme.colors.primary} size={17} />
              </View>
              <AppText
                color={theme.colors.primary}
                style={styles.menuTitle}
                weight="800"
              >
                Log out
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle} weight="800">
        {title}
      </AppText>
      {action && (
        <AppText
          color={theme.colors.primary}
          style={styles.manage}
          weight="800"
        >
          {action}
        </AppText>
      )}
    </View>
  );
}
function FamilyTile({
  member,
  onPress,
}: {
  member: FamilyMember;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.familyTile,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.familyAvatar,
          {
            backgroundColor:
              member.relation.toLowerCase() === 'self' ? '#001A31' : '#B8394B',
          },
        ]}
      >
        {member.profilePhoto ? (
          <Image
            source={{ uri: member.profilePhoto }}
            style={styles.familyPhoto}
            resizeMode="cover"
          />
        ) : (
          <AppText color="#FFFFFF" style={styles.familyInitials} weight="800">
            {member.name
              .split(' ')
              .map(part => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </AppText>
        )}
      </View>
      <AppText style={styles.familyName} weight="700" numberOfLines={1}>
        {member.name}
      </AppText>
      <AppText color={theme.colors.textMuted} style={styles.familyRelation}>
        {member.relation}
      </AppText>
    </Pressable>
  );
}
function MenuRow({
  icon,
  color,
  title,
  subtitle,
  count,
  last,
  onPress,
  disabled,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  subtitle: string;
  count?: number;
  last?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      disabled={disabled || !onPress}
      onPress={onPress}
      style={[
        styles.menuRow,
        disabled && styles.menuDisabled,
        !last && {
          borderBottomColor: theme.colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={[styles.menuIcon, { backgroundColor: color }]}>{icon}</View>
      <View style={styles.grow}>
        <AppText
          color={disabled ? theme.colors.textMuted : theme.colors.text}
          style={styles.menuTitle}
          weight="800"
        >
          {title}
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.menuSubtitle}>
          {subtitle}
        </AppText>
      </View>
      {count !== undefined && (
        <AppText color={theme.colors.textMuted} style={styles.menuCount}>
          {count}
        </AppText>
      )}
      {!disabled && <ChevronRight color={theme.colors.textMuted} size={14} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 110 },
  eyebrow: { fontSize: 9, lineHeight: 12, letterSpacing: 0.8, marginBottom: 4 },
  title: { fontSize: 25, lineHeight: 29, letterSpacing: -0.8 },
  subtitle: { marginTop: 4, maxWidth: 310, fontSize: 10, lineHeight: 14 },
  memberCard: {
    minHeight: 108,
    borderRadius: 18,
    marginTop: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  memberGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    right: -20,
    top: -16,
    backgroundColor: 'rgba(126,83,139,.28)',
  },
  profilePhoto: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: { width: '100%', height: '100%' },
  initials: { fontSize: 18, lineHeight: 22 },
  memberCopy: { flex: 1, marginLeft: 12 },
  memberEyebrow: { fontSize: 7, lineHeight: 9, letterSpacing: 0.8 },
  customerName: { marginTop: 2, fontSize: 17, lineHeight: 21 },
  phone: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 12,
    textTransform: 'capitalize',
  },
  verified: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(22,139,116,.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: { fontSize: 7, lineHeight: 9 },
  addressCard: {
    minHeight: 62,
    borderWidth: 1,
    borderRadius: 15,
    marginTop: 10,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flex: 1 },
  addressTitle: { fontSize: 12, lineHeight: 16 },
  addressText: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  manage: { fontSize: 9, lineHeight: 12 },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 15, lineHeight: 19 },
  familyRow: { gap: 8 },
  familyTile: {
    width: 104,
    minHeight: 94,
    borderWidth: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  familyAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  familyPhoto: { width: '100%', height: '100%' },
  familyInitials: { fontSize: 10, lineHeight: 13 },
  familyName: { marginTop: 6, maxWidth: 88, fontSize: 10, lineHeight: 13 },
  familyRelation: {
    marginTop: 2,
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'capitalize',
  },
  addCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCard: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  menuRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  menuDisabled: { opacity: 0.55 },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { fontSize: 11, lineHeight: 14 },
  menuSubtitle: { marginTop: 3, fontSize: 9, lineHeight: 12 },
  menuCount: { fontSize: 9, lineHeight: 12 },
  logoutRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  guestCard: {
    borderWidth: 1,
    borderRadius: 18,
    marginTop: 20,
    padding: 24,
    alignItems: 'center',
  },
  guestTitle: { fontSize: 15, lineHeight: 19 },
  guestText: { marginTop: 6, fontSize: 9, lineHeight: 13, textAlign: 'center' },
  login: {
    minWidth: 120,
    minHeight: 42,
    borderRadius: 11,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
