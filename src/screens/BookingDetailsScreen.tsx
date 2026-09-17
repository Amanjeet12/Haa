import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleQuestionMark from 'lucide-react-native/icons/circle-question-mark';
import Download from 'lucide-react-native/icons/download';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import MapPin from 'lucide-react-native/icons/map-pin';
import ReceiptText from 'lucide-react-native/icons/receipt-text';
import UserRound from 'lucide-react-native/icons/user-round';
import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components';
import { screenGradientColors, screenGradientLocations, useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetails'>;

function label(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function dateLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function timeLabel(value?: string) {
  if (!value) return 'Not assigned';
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function BookingDetailsScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const { booking } = route.params;
  const slot = booking.members[0]?.tests[0]?.slot;
  const [downloadingMemberId, setDownloadingMemberId] = React.useState<
    number | null
  >(null);
  const downloadReport = async (
    url: string,
    memberName: string,
    memberId: number,
  ) => {
    const safeName = memberName
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '');
    const fileName = `${safeName || 'lab-report'}-${booking.booking_no}.pdf`;
    setDownloadingMemberId(memberId);
    try {
      const config =
        Platform.OS === 'android'
          ? {
              addAndroidDownloads: {
                useDownloadManager: true,
                notification: true,
                mediaScannable: true,
                storeInDownloads: true,
                title: fileName,
                description: `${memberName} lab report`,
                mime: 'application/pdf',
              },
            }
          : {
              fileCache: true,
              path: `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`,
            };
      const response = await ReactNativeBlobUtil.config(config).fetch(
        'GET',
        url,
      );
      Alert.alert(
        'Report downloaded',
        Platform.OS === 'android'
          ? 'The PDF was saved to your Downloads.'
          : `The PDF was saved as ${fileName}.`,
      );
      return response.path();
    } catch {
      Alert.alert(
        'Download failed',
        'The report PDF could not be downloaded. Please try again.',
      );
    } finally {
      setDownloadingMemberId(null);
    }
  };
  return (
    <LinearGradient
      colors={screenGradientColors(theme)}
      locations={screenGradientLocations}
      style={styles.flex}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <Pressable
            onPress={navigation.goBack}
            style={[styles.back, { backgroundColor: theme.colors.surface }]}
          >
            <ChevronLeft color={theme.colors.text} size={20} />
          </Pressable>
          <AppText style={styles.headerTitle} weight="800">
            Booking details
          </AppText>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.hero,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.heroTop}>
              <View>
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.eyebrow}
                  weight="700"
                >
                  BOOKING NUMBER
                </AppText>
                <AppText style={styles.bookingNo} weight="800">
                  {booking.booking_no}
                </AppText>
              </View>
              <View style={styles.status}>
                <CircleCheck color="#078A73" size={13} />
                <AppText color="#078A73" style={styles.statusText} weight="800">
                  {label(booking.booking_status)}
                </AppText>
              </View>
            </View>
            <AppText style={styles.labName} weight="800">
              {booking.lab.lab_name}
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.labAddress}>
              {booking.lab.address?.address_line_1 ?? booking.lab.address?.city}
            </AppText>
          </View>

          <Pressable
            onPress={() => navigation.navigate('SupportCreate', { booking })}
            style={[
              styles.supportAction,
              {
                backgroundColor: theme.colors.primarySoft,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.supportIcon,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <CircleQuestionMark color={theme.colors.primary} size={18} />
            </View>
            <View style={styles.grow}>
              <AppText style={styles.supportTitle} weight="800">
                Need help with this booking?
              </AppText>
              <AppText
                color={theme.colors.textMuted}
                style={styles.supportText}
              >
                Create a support request linked to {booking.booking_no}.
              </AppText>
            </View>
          </Pressable>

          <View
            style={[
              styles.otpCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.grow}>
              <AppText
                color={theme.colors.primary}
                style={styles.otpLabel}
                weight="800"
              >
                COLLECTION OTP
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.otpHint}>
                Share only when the phlebotomist arrives.
              </AppText>
            </View>
            <AppText color={theme.colors.text} style={styles.otp} weight="800">
              {booking.customer_otp}
            </AppText>
          </View>

          <DetailCard
            title="Appointment"
            icon={<CalendarDays color={theme.colors.primary} size={17} />}
          >
            <InfoRow
              label="Collection date"
              value={dateLabel(booking.booking_date)}
            />
            <InfoRow
              label="Time slot"
              value={`${timeLabel(slot?.start_time)} – ${timeLabel(
                slot?.end_time,
              )}`}
            />
            <InfoRow label="Collection type" value="Home collection" />
          </DetailCard>

          <DetailCard
            title="Collection address"
            icon={<MapPin color={theme.colors.primary} size={17} />}
          >
            <AppText style={styles.addressName} weight="700">
              {booking.collection_address.name} ·{' '}
              {booking.collection_address.type}
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.addressText}>
              {booking.collection_address.address}
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.addressText}>
              {booking.collection_address.phone}
            </AppText>
          </DetailCard>

          <DetailCard
            title="Patients and tests"
            icon={<UserRound color={theme.colors.primary} size={17} />}
          >
            {booking.members.map(member => {
              const reportUrl =
                member.result_pdf ??
                member.tests.find(test => test.result_pdf)?.result_pdf ??
                null;
              return (
                <View
                  key={member.member_id}
                  style={[styles.member, { borderColor: theme.colors.border }]}
                >
                  <View style={styles.memberHeader}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: theme.colors.primarySoft },
                      ]}
                    >
                      <AppText color={theme.colors.primary} weight="800">
                        {member.member.name.charAt(0)}
                      </AppText>
                    </View>
                    <View style={styles.grow}>
                      <AppText style={styles.memberName} weight="800">
                        {member.member.name}
                      </AppText>
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.memberMeta}
                      >
                        {member.member.age} yrs · {member.member.gender} ·{' '}
                        {member.member.relation}
                      </AppText>
                    </View>
                    <AppText style={styles.memberTotal} weight="800">
                      ₹{member.total_offer_price}
                    </AppText>
                  </View>
                  {member.tests.map(test => (
                    <View key={test.lab_test_id} style={styles.testItem}>
                      <View style={styles.testRow}>
                        <FlaskConical color={theme.colors.primary} size={15} />
                        <View style={styles.grow}>
                          <AppText style={styles.testName} weight="700">
                            {test.test.test_name}
                          </AppText>
                          <AppText
                            color={theme.colors.textMuted}
                            style={styles.testMeta}
                          >
                            {test.test.requirements?.sample_type ?? 'Sample'} ·{' '}
                            {test.test.test_code}
                          </AppText>
                        </View>
                        <AppText style={styles.testPrice} weight="700">
                          ₹{test.offer_price}
                        </AppText>
                      </View>
                    </View>
                  ))}
                  {!!reportUrl && (
                    <Pressable
                      accessibilityLabel={`Download ${member.member.name} lab report`}
                      disabled={downloadingMemberId !== null}
                      onPress={() =>
                        downloadReport(
                          reportUrl,
                          member.member.name,
                          member.member_id,
                        )
                      }
                      style={[
                        styles.download,
                        { backgroundColor: theme.colors.primarySoft },
                      ]}
                    >
                      <Download color={theme.colors.primary} size={15} />
                      <AppText
                        color={theme.colors.primary}
                        style={styles.downloadText}
                        weight="800"
                      >
                        {downloadingMemberId === member.member_id
                          ? 'Downloading report…'
                          : `Download ${member.member.name}'s PDF report`}
                      </AppText>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </DetailCard>

          <DetailCard
            title="Payment summary"
            icon={<ReceiptText color={theme.colors.primary} size={17} />}
          >
            <InfoRow
              label="MRP total"
              value={`₹${Number(booking.total_normal_amount)}`}
              muted
            />
            <InfoRow
              label="Discount"
              value={`− ₹${
                Number(booking.total_normal_amount) -
                Number(booking.total_final_amount)
              }`}
              green
            />
            <InfoRow
              label="Amount paid"
              value={`₹${Number(booking.total_final_amount)}`}
              strong
            />
            <InfoRow
              label="Payment"
              value={`${label(booking.payment_status)} · ${label(
                booking.payment_method,
              )}`}
              green={booking.payment_status === 'paid'}
            />
          </DetailCard>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function DetailCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.cardTitleRow}>
        {icon}
        <AppText style={styles.cardTitle} weight="800">
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  label: rowLabel,
  value,
  muted,
  green,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  green?: boolean;
  strong?: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <AppText color={theme.colors.textMuted} style={styles.infoLabel}>
        {rowLabel}
      </AppText>
      <AppText
        color={
          green ? '#078A73' : muted ? theme.colors.textMuted : theme.colors.text
        }
        style={[styles.infoValue, strong && styles.infoStrong]}
        weight={strong ? '800' : '700'}
      >
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 19, lineHeight: 23 },
  headerSpacer: { width: 36 },
  content: { padding: 14, paddingBottom: 34 },
  hero: { borderWidth: 1, borderRadius: 20, padding: 15 },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: { fontSize: 8, lineHeight: 10, letterSpacing: 0.7 },
  bookingNo: { marginTop: 4, fontSize: 16, lineHeight: 20 },
  status: {
    backgroundColor: '#DCF7EF',
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  statusText: { fontSize: 9, lineHeight: 12 },
  labName: { marginTop: 16, fontSize: 19, lineHeight: 23 },
  labAddress: { marginTop: 4, fontSize: 11, lineHeight: 15 },
  card: { borderWidth: 1, borderRadius: 17, padding: 13, marginTop: 11 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 11,
  },
  cardTitle: { fontSize: 14, lineHeight: 18 },
  infoRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: { fontSize: 11, lineHeight: 14 },
  infoValue: { flex: 1, textAlign: 'right', fontSize: 11, lineHeight: 14 },
  infoStrong: { fontSize: 15, lineHeight: 19 },
  addressName: { fontSize: 12, lineHeight: 16 },
  addressText: { marginTop: 5, fontSize: 10, lineHeight: 14 },
  member: { borderWidth: 1, borderRadius: 13, padding: 10, marginTop: 7 },
  memberHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flex: 1 },
  memberName: { fontSize: 12, lineHeight: 16 },
  memberMeta: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  memberTotal: { fontSize: 13, lineHeight: 16 },
  testItem: { marginTop: 10 },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 9,
  },
  testName: { fontSize: 11, lineHeight: 14 },
  testMeta: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  testPrice: { fontSize: 11, lineHeight: 14 },
  download: {
    width: '100%',
    minHeight: 38,
    borderRadius: 10,
    marginTop: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadText: { fontSize: 10, lineHeight: 13 },
  otpCard: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 17,
    marginTop: 11,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  otpLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 0.8 },
  otpHint: { marginTop: 4, fontSize: 10, lineHeight: 13 },
  otp: { fontSize: 24, lineHeight: 28, letterSpacing: 3 },
  supportAction: {
    minHeight: 70,
    borderWidth: 1,
    borderRadius: 17,
    marginTop: 11,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: { fontSize: 11, lineHeight: 14 },
  supportText: { marginTop: 3, fontSize: 9, lineHeight: 12 },
});
