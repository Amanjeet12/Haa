import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Check from 'lucide-react-native/icons/check';
import FileText from 'lucide-react-native/icons/file-text';
import Plus from 'lucide-react-native/icons/plus';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import UserPlus from 'lucide-react-native/icons/user-plus';
import { useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';

import { AppText, HealthFlowHeader } from '../components';
import {
  FamilyMemberTestBooking,
  getFamilyMemberTestBookings,
  reportReadyFamilyBookings,
} from '../api/bookings';
import { FamilyMember, getFamilyMembers } from '../api/familyMembers';
import { useAppDispatch, useAppSelector } from '../store';
import { clearHealthViewLoginReturn } from '../store/authSlice';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import type {
  HomeStackParamList,
  RootStackParamList,
} from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'HealthReportSelection'>;

const pilotItems = [
  ['Reports trends', 'See how the same markers move across connected reports.'],
  [
    'Short health check-ins',
    'Add how you feel, so results have useful personal context.',
  ],
  [
    'Relevant HAA recommendations',
    'Explore appropriate lab tests and wellness products across HAA services.',
  ],
];

export function HealthViewScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  const stackFooter = width < 390 * fontScale;
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.auth.session?.token);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<FamilyMemberTestBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(false);
  const selectedBookingId = route.params?.bookingId ?? null;
  const [outsideReports, setOutsideReports] = useState<
    Array<{ uri: string; name: string }>
  >([]);

  const loadMembers = useCallback(async () => {
    if (!token) {
      setMembers([]);
      setSelectedMemberId(null);
      return;
    }
    setMembersLoading(true);
    setMembersError(null);
    try {
      const family = await getFamilyMembers(token);
      setMembers(family);
      setSelectedMemberId(current =>
        family.some(member => member.member_id === current)
          ? current
          : (
              family.find(member => member.member_id === route.params.memberId) ??
              family.find(
                member =>
                  member.isDefault || member.relation.toLowerCase() === 'self',
              ) ?? family[0]
            )?.member_id ?? null,
      );
    } catch {
      setMembersError('Unable to load family members.');
    } finally {
      setMembersLoading(false);
    }
  }, [token, route.params.memberId]);

  const loadBookings = useCallback(async () => {
    if (!token || selectedMemberId === null) {
      setBookings([]);
      return;
    }
    setBookingsLoading(true);
    setBookingsError(false);
    try {
      setBookings(await getFamilyMemberTestBookings(token, selectedMemberId));
    } catch {
      setBookingsError(true);
    } finally {
      setBookingsLoading(false);
    }
  }, [token, selectedMemberId]);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers]),
  );
  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const openFamilyForm = () => {
    navigation
      .getParent()
      ?.getParent<NavigationProp<RootStackParamList>>()
      ?.navigate(token ? 'FamilyMemberForm' : 'Login');
  };
  const selectedMember = members.find(
    member => member.member_id === selectedMemberId,
  );
  const eligibleBookings = reportReadyFamilyBookings(bookings).filter(
    booking => booking.family_member_id === selectedMemberId,
  );
  const selectedBooking = eligibleBookings.find(
    booking => booking.booking_id === selectedBookingId,
  );

  const chooseOutsideReport = async () => {
    if (outsideReports.length >= 3) return;
    try {
      const documents = await pick({
        type: [types.pdf],
        allowMultiSelection: true,
      });
      if (
        documents.some(
          document =>
            !document.hasRequestedType || document.type !== 'application/pdf',
        )
      ) {
        Alert.alert('Unsupported file', 'Choose PDF files only.');
        return;
      }
      const unique = documents.filter(
        document => !outsideReports.some(report => report.uri === document.uri),
      );
      if (outsideReports.length + unique.length > 3) {
        Alert.alert('Three PDF limit', 'You can attach up to three PDFs.');
        return;
      }
      setOutsideReports(current => [
        ...current,
        ...unique.map(document => ({
          uri: document.uri,
          name: document.name ?? 'Selected PDF',
        })),
      ]);
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }
      Alert.alert(
        'Could not select report',
        'Please try choosing the file again.',
      );
    }
  };

  return (
    <LinearGradient
      colors={screenGradientColors(theme)}
      locations={screenGradientLocations}
      style={styles.flex}
    >
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={styles.flex}
      >
        <HealthFlowHeader
          title="HAA Health View"
          subtitle="AI pilot"
          onBack={() => {
            dispatch(clearHealthViewLoginReturn());
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.replace('HomeLanding');
            }
          }}
          rightIcon={<ShieldCheck color="#0A8B77" size={18} />}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <AppText style={styles.title} weight="800">
                Whose health view are we building?
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.subtitle}>
                Each family profile keeps bookings, reports, questionnaires and
                AI trend summaries separate.
              </AppText>
            </View>
            <View
              style={[
                styles.familyIcon,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <UserPlus color="#FFFFFF" size={20} />
            </View>
          </View>

          <View style={styles.peopleGrid}>
            {members.map(member => {
              const selected = selectedMemberId === member.member_id;
              return (
                <Pressable
                  key={member.member_id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setSelectedMemberId(member.member_id);
                    navigation.setParams({ bookingId: undefined });
                  }}
                  style={[
                    styles.personCard,
                    {
                      backgroundColor: selected
                        ? theme.colors.primarySoft2
                        : theme.colors.surface,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: selected
                          ? theme.colors.primary
                          : theme.colors.surfaceMuted,
                      },
                    ]}
                  >
                    <AppText
                      color={selected ? '#FFFFFF' : theme.colors.text}
                      style={styles.avatarText}
                      weight="800"
                    >
                      {member.name.trim().charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.personCopy}>
                    <AppText style={styles.personName} weight="700">
                      {member.name}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.personDetail}
                    >
                      {member.relation}
                    </AppText>
                  </View>
                  {selected ? (
                    <View style={styles.selectedDot}>
                      <Check color="#FFFFFF" size={9} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              onPress={openFamilyForm}
              style={[
                styles.personCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <Plus color={theme.colors.primary} size={17} />
              </View>
              <View style={styles.personCopy}>
                <AppText style={styles.personName} weight="700">
                  Add family member
                </AppText>
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.personDetail}
                >
                  Parent, child or other
                </AppText>
              </View>
            </Pressable>
          </View>

          {membersLoading ? (
            <ActivityIndicator
              style={styles.membersStatus}
              color={theme.colors.primary}
            />
          ) : null}
          {membersError ? (
            <Pressable onPress={loadMembers} style={styles.membersStatus}>
              <AppText color={theme.colors.primary}>
                Unable to load family members. Tap to retry.
              </AppText>
            </Pressable>
          ) : null}
          {!token ? (
            <AppText
              color={theme.colors.textMuted}
              style={styles.membersStatus}
            >
              Log in to see your family members.
            </AppText>
          ) : null}

          <View
            style={[
              styles.privacyBanner,
              { backgroundColor: theme.isDark ? '#12322F' : '#DDF7F0' },
            ]}
          >
            <ShieldCheck color="#078B76" size={16} />
            <AppText color={theme.colors.textMuted} style={styles.privacyText}>
              Reports below are linked to{' '}
              <AppText
                color={theme.colors.text}
                style={styles.privacyText}
                weight="700"
              >
                {selectedMember
                  ? `${
                      selectedMember.name
                    } · ${selectedMember.relation.toUpperCase()}`
                  : 'your selected profile'}
              </AppText>
            </AppText>
          </View>

          <SectionHeader
            title="Past bookings with reports"
            aside="Choose one booking"
          />
          <Pressable
            accessibilityRole="button"
            disabled={selectedMemberId === null}
            onPress={() => {
              if (selectedMemberId !== null) {
                navigation.navigate('HealthBookingPicker', {
                  memberId: selectedMemberId,
                  selectedBookingId: selectedBookingId ?? undefined,
                });
              }
            }}
            style={[
              styles.bookingPickerRow,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.pickerIcon,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <FileText color={theme.colors.primary} size={17} />
            </View>
            <View style={styles.pickerCopy}>
              <AppText style={styles.pickerTitle} weight="700">
                {selectedBooking
                  ? selectedBooking.test.test_name
                  : 'Select a past booking'}
              </AppText>
              <AppText
                color={theme.colors.textMuted}
                style={styles.pickerDetail}
              >
                {selectedBooking
                  ? `${selectedBooking.lab.lab_name} · ${selectedBooking.booking_date}`
                  : 'Choose one booking with a generated report'}
              </AppText>
            </View>
            {selectedBooking ? (
              <View style={styles.checkCircle}>
                <Check color="#FFFFFF" size={13} strokeWidth={3} />
              </View>
            ) : (
              <ArrowRight color={theme.colors.primary} size={17} />
            )}
          </Pressable>
          {bookingsLoading ? (
            <ActivityIndicator
              style={styles.membersStatus}
              color={theme.colors.primary}
            />
          ) : null}
          {bookingsError ? (
            <Pressable onPress={loadBookings} style={styles.membersStatus}>
              <AppText color={theme.colors.primary}>
                Could not load booking details. Tap to retry.
              </AppText>
            </Pressable>
          ) : null}

          <View style={styles.pdfPanel}>
            {outsideReports.length < 3 ? (
              <Pressable
                accessibilityRole="button"
                onPress={chooseOutsideReport}
                style={[
                  styles.bookingPickerRow,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.pickerIcon,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}
                >
                  <Plus color={theme.colors.primary} size={18} />
                </View>
                <View style={styles.pickerCopy}>
                  <AppText style={styles.pickerTitle} weight="700">
                    Add PDF reports
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.pickerDetail}
                  >
                    Optional · Up to 3 PDF files
                  </AppText>
                </View>
                <Plus color={theme.colors.primary} size={17} />
              </Pressable>
            ) : null}
            {outsideReports.map(report => (
              <View
                key={report.uri}
                style={[
                  styles.attachedPdfRow,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <FileText color={theme.colors.primary} size={16} />
                <AppText style={styles.reportCopy} numberOfLines={1}>
                  {report.name}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${report.name}`}
                  onPress={() =>
                    setOutsideReports(current =>
                      current.filter(item => item.uri !== report.uri),
                    )
                  }
                >
                  <AppText color={theme.colors.primary}>Remove</AppText>
                </Pressable>
              </View>
            ))}
          </View>

          <SectionHeader title="What the pilot includes" />
          <View style={styles.pilotList}>
            {pilotItems.map(([title, detail], index) => (
              <View
                key={title}
                style={[
                  styles.pilotItem,
                  { backgroundColor: theme.isDark ? '#12322F' : '#DDF7F0' },
                ]}
              >
                <View style={styles.numberCircle}>
                  <AppText color="#FFFFFF" style={styles.number} weight="800">
                    {index + 1}
                  </AppText>
                </View>
                <View style={styles.pilotCopy}>
                  <AppText style={styles.pilotTitle} weight="700">
                    {title}
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.pilotDetail}
                  >
                    {detail}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.disclaimer}>
            <ShieldCheck color="#0A8B77" size={13} />
            <AppText
              color={theme.colors.textMuted}
              style={styles.disclaimerText}
            >
              Your health view is private and educational. It does not provide a
              diagnosis.
            </AppText>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            stackFooter && styles.footerStacked,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View style={[styles.footerCopy, stackFooter && styles.footerCopyStacked]}>
            <AppText
              color={theme.colors.textMuted}
              style={styles.footerEyebrow}
            >
              {selectedBooking
                ? `Booking ${selectedBooking.order.booking_no} selected`
                : 'Select a booking to continue'}
            </AppText>
            <AppText style={styles.footerTitle} weight="800">
              {selectedBooking
                ? 'Ready to build your view'
                : 'Booking required'}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !selectedBooking }}
            disabled={!selectedBooking}
            onPress={() => {
              if (selectedBooking && selectedMemberId !== null) {
                navigation.navigate('HealthCheckIn', {
                  bookingId: selectedBooking.booking_id,
                  memberId: selectedMemberId,
                  outsideReports,
                });
              }
            }}
            style={[
              styles.continueButton,
              stackFooter && styles.continueButtonStacked,
              {
                backgroundColor: selectedBooking
                  ? theme.colors.primary
                  : theme.colors.textMuted,
              },
            ]}
          >
            <AppText color="#FFFFFF" style={styles.continueText} weight="700">
              Continue
            </AppText>
            <ArrowRight color="#FFFFFF" size={15} />
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SectionHeader({ title, aside }: { title: string; aside?: string }) {
  const { theme } = useAppTheme();
  const { width, fontScale } = useWindowDimensions();
  const stackAside = Boolean(aside) && width < 390 * fontScale;
  return (
    <View style={[styles.sectionHeader, stackAside && styles.sectionHeaderStacked]}>
      <AppText style={styles.sectionTitle} weight="800">
        {title}
      </AppText>
      {aside ? (
        <AppText
          color={theme.colors.textMuted}
          style={[styles.sectionAside, stackAside && styles.sectionAsideStacked]}
        >
          {aside}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  miniBrand: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: { fontSize: 15, lineHeight: 18 },
  brandSub: { marginTop: 1, textAlign: 'center', fontSize: 8, lineHeight: 10 },
  content: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  titleCopy: { flex: 1 },
  title: { fontSize: 23, lineHeight: 27, letterSpacing: -0.7 },
  subtitle: { marginTop: 9, fontSize: 11, lineHeight: 15 },
  familyIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
    marginTop: 17,
  },
  membersStatus: { marginTop: 10, alignSelf: 'center' },
  personCard: {
    width: '48.5%',
    minHeight: 63,
    borderWidth: 1,
    borderRadius: 13,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 11 },
  personCopy: { flex: 1, marginLeft: 9 },
  personName: { fontSize: 11, lineHeight: 15 },
  personDetail: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  selectedDot: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DF1F2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyBanner: {
    height: 39,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 10,
  },
  privacyText: { fontSize: 10, lineHeight: 14 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeaderStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  sectionTitle: { fontSize: 18, lineHeight: 22, letterSpacing: -0.4 },
  sectionAside: { fontSize: 9, lineHeight: 12 },
  sectionAsideStacked: { marginTop: 3 },
  reportPanel: { borderWidth: 1, borderRadius: 15, overflow: 'hidden' },
  bookingPickerRow: {
    minHeight: 65,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pickerCopy: { flex: 1 },
  pickerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pickerTitle: { fontSize: 12, lineHeight: 16 },
  pickerDetail: { marginTop: 3, fontSize: 10, lineHeight: 14 },
  pdfPanel: { marginTop: 18, gap: 8 },
  attachedPdfRow: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewBooking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  reportRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },
  reportIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCopy: { flex: 1, marginLeft: 10 },
  reportTitle: { fontSize: 11, lineHeight: 15 },
  reportDetail: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#078B76',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { fontSize: 8, lineHeight: 11 },
  pilotList: { gap: 7 },
  pilotItem: {
    minHeight: 53,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  numberCircle: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: '#078B76',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontSize: 10 },
  pilotCopy: { flex: 1, marginLeft: 10 },
  pilotTitle: { fontSize: 12, lineHeight: 16 },
  pilotDetail: { marginTop: 1, fontSize: 10, lineHeight: 14 },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 3,
  },
  disclaimerText: { flex: 1, fontSize: 10, lineHeight: 14 },
  footer: {
    minHeight: 76,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 10 },
  footerCopy: { flex: 1, minWidth: 0 },
  footerCopyStacked: { flex: 0 },
  footerEyebrow: { fontSize: 9, lineHeight: 12 },
  footerTitle: { marginTop: 2, fontSize: 14, lineHeight: 18 },
  continueButton: {
    height: 48,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
  },
  continueButtonStacked: { alignSelf: 'stretch', justifyContent: 'center' },
  continueText: { fontSize: 11, lineHeight: 15 },
});
