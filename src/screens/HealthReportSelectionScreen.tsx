import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Check from 'lucide-react-native/icons/check';
import FileText from 'lucide-react-native/icons/file-text';
import Info from 'lucide-react-native/icons/info';
import Plus from 'lucide-react-native/icons/plus';
import X from 'lucide-react-native/icons/x';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FamilyMemberTestBooking,
  getFamilyMemberTestBookings,
  reportReadyFamilyBookings,
} from '../api/bookings';
import { getFamilyMembers, type FamilyMember } from '../api/familyMembers';
import { AppText, HealthFlowHeader } from '../components';
import { useAppSelector } from '../store';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<
  HomeStackParamList,
  'HealthReportSelection'
>;
type PdfFile = { uri: string; name: string };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

export function HealthReportSelectionScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [bookings, setBookings] = useState<FamilyMemberTestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    route.params.bookingId ?? null,
  );
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const [family, memberBookings] = await Promise.all([
        getFamilyMembers(token),
        getFamilyMemberTestBookings(token, route.params.memberId),
      ]);
      setMember(
        family.find(item => item.member_id === route.params.memberId) ?? null,
      );
      setBookings(reportReadyFamilyBookings(memberBookings));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token, route.params.memberId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const eligible = bookings.filter(
    booking => booking.family_member_id === route.params.memberId,
  );
  const selectedBooking = eligible.find(
    booking => booking.booking_id === selectedBookingId,
  );
  const selectedCount = (selectedBooking ? 1 : 0) + pdfs.length;

  const addPdfs = async () => {
    if (pdfs.length >= 3) return;
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
        document => !pdfs.some(pdf => pdf.uri === document.uri),
      );
      if (pdfs.length + unique.length > 3) {
        Alert.alert('Three PDF limit', 'You can attach up to three PDFs.');
        return;
      }
      setPdfs(current => [
        ...current,
        ...unique.map(document => ({
          uri: document.uri,
          name: document.name ?? 'Selected PDF',
        })),
      ]);
    } catch (pickError) {
      if (
        isErrorWithCode(pickError) &&
        pickError.code === errorCodes.OPERATION_CANCELED
      )
        return;
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
          onBack={navigation.goBack}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepRow}>
            <AppText color={theme.colors.textMuted} style={styles.stepText}>
              STEP 2 OF 3
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.stepText}>
              Reports
            </AppText>
          </View>
          <View style={styles.progressRow}>
            <View
              style={[
                styles.progress,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <View
              style={[
                styles.progress,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <View
              style={[
                styles.progress,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </View>
          <AppText style={styles.heroTitle} weight="800">
            Which reports shall we read?
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.heroSubtitle}>
            Choose a report for an explanation, or add PDFs to compare results
            over time.
          </AppText>

          <View
            style={[
              styles.personBanner,
              { backgroundColor: theme.colors.primarySoft },
            ]}
          >
            <View style={styles.personCopy}>
              <AppText style={styles.personName} weight="800">
                {member?.name ?? 'Selected profile'}
              </AppText>
              <AppText
                color={theme.colors.textMuted}
                style={styles.personDetail}
              >
                Showing reports for this person
              </AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={navigation.goBack}>
              <AppText
                color={theme.colors.primary}
                style={styles.changeText}
                weight="700"
              >
                Change
              </AppText>
            </Pressable>
          </View>

          <View style={styles.sectionHeading}>
            <AppText style={styles.sectionTitle} weight="800">
              Your reports
            </AppText>
            {selectedBooking ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedBookingId(null)}
              >
                <AppText color={theme.colors.primary} style={styles.clearText}>
                  Clear selection
                </AppText>
              </Pressable>
            ) : null}
          </View>
          {loading ? (
            <ActivityIndicator
              color={theme.colors.primary}
              style={styles.state}
            />
          ) : null}
          {error ? (
            <Pressable onPress={load} style={styles.state}>
              <AppText color={theme.colors.primary}>
                Could not load reports. Tap to retry.
              </AppText>
            </Pressable>
          ) : null}
          {!loading && !error && !eligible.length ? (
            <AppText color={theme.colors.textMuted} style={styles.empty}>
              No booking reports yet. You can add a PDF below.
            </AppText>
          ) : null}
          {eligible.map(booking => {
            const selected = booking.booking_id === selectedBookingId;
            return (
              <Pressable
                key={booking.booking_id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() =>
                  setSelectedBookingId(selected ? null : booking.booking_id)
                }
                style={[
                  styles.reportCard,
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
                    styles.pdfIcon,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}
                >
                  <AppText
                    color={theme.colors.primary}
                    weight="800"
                    style={styles.pdfIconText}
                  >
                    PDF
                  </AppText>
                </View>
                <View style={styles.reportCopy}>
                  <AppText
                    style={styles.reportName}
                    weight="800"
                    numberOfLines={2}
                  >
                    {booking.test.test_name}
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.reportMeta}
                  >
                    {formatDate(booking.booking_date)} · {booking.lab.lab_name}
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.reportMeta}
                    numberOfLines={1}
                  >
                    Report PDF · Booking {booking.order.booking_no}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.selectionBox,
                    {
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.border,
                      backgroundColor: selected
                        ? theme.colors.primary
                        : theme.colors.surface,
                    },
                  ]}
                >
                  {selected ? (
                    <Check color="#FFFFFF" size={13} strokeWidth={3} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}

          {selectedCount > 0 ? (
            <View style={styles.selectedCallout}>
              <AppText color="#FFFFFF" style={styles.calloutTitle} weight="800">
                {selectedCount} {selectedCount === 1 ? 'report' : 'reports'}{' '}
                selected
              </AppText>
              <AppText color="#FFFFFF" style={styles.calloutDetail}>
                Add earlier reports to see changes in shared parameters.
              </AppText>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={addPdfs}
            disabled={pdfs.length >= 3}
            style={[
              styles.uploadCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppText style={styles.uploadTitle} weight="800">
              Have another report?
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.uploadDetail}>
              CBC, full body checkup, or another laboratory report
            </AppText>
            <View style={styles.uploadAction}>
              <Plus color={theme.colors.primary} size={15} />
              <AppText
                color={theme.colors.primary}
                weight="700"
                style={styles.uploadActionText}
              >
                Add a PDF
              </AppText>
            </View>
          </Pressable>
          {pdfs.map(pdf => (
            <View
              key={pdf.uri}
              style={[
                styles.uploadedRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <FileText color={theme.colors.primary} size={17} />
              <AppText style={styles.uploadedName} numberOfLines={1}>
                {pdf.name}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${pdf.name}`}
                onPress={() =>
                  setPdfs(current =>
                    current.filter(item => item.uri !== pdf.uri),
                  )
                }
              >
                <X color={theme.colors.primary} size={17} />
              </Pressable>
            </View>
          ))}
          <View style={styles.infoRow}>
            <Info color={theme.colors.success} size={15} />
            <AppText color={theme.colors.textMuted} style={styles.infoText}>
              Report names describe the document or package. Your results are
              based on the individual tests inside.
            </AppText>
          </View>
        </ScrollView>
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.footerCopy}>
            <AppText color={theme.colors.textMuted} style={styles.footerLabel}>
              Selected
            </AppText>
            <AppText style={styles.footerCount} weight="800">
              {selectedCount} {selectedCount === 1 ? 'report' : 'reports'}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: selectedCount === 0 }}
            disabled={selectedCount === 0}
            onPress={() => {
              navigation.navigate('HealthCheckIn', {
                bookingId: selectedBooking?.booking_id,
                memberId: route.params.memberId,
                outsideReports: pdfs,
                memberName: member?.name,
                reportCount: selectedCount,
                reportDate: selectedBooking?.booking_date,
                reportTitle: selectedBooking?.test.test_name,
              });
            }}
            style={[
              styles.continueButton,
              {
                backgroundColor: selectedCount
                  ? theme.colors.primary
                  : theme.colors.textMuted,
              },
            ]}
          >
            <AppText color="#FFFFFF" weight="800" style={styles.continueText}>
              Continue
            </AppText>
            <ArrowRight color="#FFFFFF" size={16} />
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 28 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepText: { fontSize: 11, lineHeight: 15 },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  progress: { flex: 1, height: 4, borderRadius: 3 },
  heroTitle: {
    marginTop: 24,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.8,
  },
  heroSubtitle: { marginTop: 10, fontSize: 13, lineHeight: 20 },
  personBanner: {
    minHeight: 70,
    borderRadius: 15,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  personCopy: { flex: 1 },
  personName: { fontSize: 14, lineHeight: 19 },
  personDetail: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  changeText: { fontSize: 12 },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, lineHeight: 22 },
  clearText: { fontSize: 12 },
  state: { alignSelf: 'center', marginVertical: 15 },
  empty: { fontSize: 11, lineHeight: 17, marginBottom: 12 },
  reportCard: {
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pdfIcon: {
    width: 41,
    height: 47,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pdfIconText: { fontSize: 11 },
  reportCopy: { flex: 1, minWidth: 0 },
  reportName: { fontSize: 14, lineHeight: 18 },
  reportMeta: { fontSize: 11, lineHeight: 15, marginTop: 3 },
  selectionBox: {
    width: 21,
    height: 21,
    borderWidth: 1,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCallout: {
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#031B34',
  },
  calloutTitle: { fontSize: 12, lineHeight: 16 },
  calloutDetail: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  uploadCard: {
    minHeight: 108,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginTop: 5,
  },
  uploadTitle: { fontSize: 15, lineHeight: 20 },
  uploadDetail: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  uploadAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 13,
  },
  uploadActionText: { fontSize: 12 },
  uploadedRow: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  uploadedName: { flex: 1, fontSize: 11 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 18,
  },
  infoText: { flex: 1, fontSize: 10, lineHeight: 16 },
  footer: {
    minHeight: 80,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerCopy: { flex: 1, minWidth: 0 },
  footerLabel: { fontSize: 10, lineHeight: 14 },
  footerCount: { fontSize: 14, lineHeight: 19, marginTop: 3 },
  continueButton: {
    minHeight: 51,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  continueText: { fontSize: 12 },
});
