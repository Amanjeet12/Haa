import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleQuestionMark from 'lucide-react-native/icons/circle-question-mark';
import Clock3 from 'lucide-react-native/icons/clock-3';
import FileText from 'lucide-react-native/icons/file-text';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomerBooking, getCustomerBookings } from '../api/bookings';
import { images } from '../assets/images';
import { AppText } from '../components';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function formatTime(value?: string) {
  if (!value) return '';
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function statusLabel(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

export function BookingsScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const token = useAppSelector(state => state.auth.session?.token);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setBookings(await getCustomerBookings(token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const activeBookings = bookings.filter(
    booking => !['completed', 'cancelled', 'rejected'].includes(booking.booking_status.toLowerCase()),
  );
  const pastBookings = bookings.filter(booking => !activeBookings.includes(booking));

  return (
    <LinearGradient
      colors={[
        theme.colors.gradientStart,
        theme.isDark ? theme.colors.background : '#FBF8F6',
        theme.colors.gradientEnd,
      ]}
      locations={[0, 0.48, 1]}
      style={styles.flex}
    >
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            token ? (
              <RefreshControl refreshing={loading} onRefresh={loadBookings} tintColor={theme.colors.primary} />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image resizeMode="contain" source={images.logo} style={styles.logo} />
            <Pressable
              style={[
                styles.helpButton,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <CircleQuestionMark color={theme.colors.primary} size={15} />
              <AppText color={theme.colors.primary} style={styles.helpText} weight="700">
                Need help?
              </AppText>
            </Pressable>
          </View>
          <AppText color={theme.colors.primary} style={styles.eyebrow} weight="800">
            — YOUR CARE TIMELINE
          </AppText>
          <AppText style={styles.title} weight="800">
            Bookings and{' '}
            <AppText color={theme.colors.primary} style={styles.title} weight="800">
              reports.
            </AppText>
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            Follow every appointment from confirmation to secure report.
          </AppText>

          {!token ? (
            <View style={[styles.stateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <CalendarDays color={theme.colors.primary} size={28} />
              <AppText style={styles.stateTitle} weight="800">Log in to view bookings</AppText>
              <AppText color={theme.colors.textMuted} style={styles.stateText}>
                Your appointments and reports are securely linked to your account.
              </AppText>
              <Pressable onPress={() => navigation.navigate('Login')} style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}>
                <AppText color="#FFFFFF" style={styles.buttonText} weight="800">Login</AppText>
              </Pressable>
            </View>
          ) : loading && !bookings.length ? (
            <View style={styles.loading}><ActivityIndicator color={theme.colors.primary} /></View>
          ) : error ? (
            <View style={[styles.stateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <AppText style={styles.stateTitle} weight="800">Could not load bookings</AppText>
              <AppText color={theme.colors.textMuted} style={styles.stateText}>{error}</AppText>
              <Pressable onPress={loadBookings} style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}>
                <AppText color="#FFFFFF" style={styles.buttonText} weight="800">Try again</AppText>
              </Pressable>
            </View>
          ) : !bookings.length ? (
            <View style={[styles.stateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <CalendarDays color={theme.colors.primary} size={28} />
              <AppText style={styles.stateTitle} weight="800">No bookings yet</AppText>
              <AppText color={theme.colors.textMuted} style={styles.stateText}>Your upcoming lab collections will appear here.</AppText>
            </View>
          ) : (
            <>
              {!!activeBookings.length && (
                <BookingSection
                  title="Current bookings"
                  bookings={activeBookings}
                  onView={booking =>
                    navigation.navigate('BookingDetails', { booking })
                  }
                />
              )}
              {!!pastBookings.length && (
                <BookingSection
                  title="Past bookings"
                  bookings={pastBookings}
                  onView={booking =>
                    navigation.navigate('BookingDetails', { booking })
                  }
                />
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function BookingSection({ title, bookings, onView }: {
  title: string;
  bookings: CustomerBooking[];
  onView: (booking: CustomerBooking) => void;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle} weight="800">{title}</AppText>
        <AppText color={theme.colors.textMuted} style={styles.count}>{bookings.length} total</AppText>
      </View>
      {bookings.map(booking => (
        <BookingCard
          key={booking.booking_order_id}
          booking={booking}
          onView={() => onView(booking)}
        />
      ))}
    </View>
  );
}

function BookingCard({ booking, onView }: {
  booking: CustomerBooking;
  onView: () => void;
}) {
  const { theme } = useAppTheme();
  const firstTest = booking.members[0]?.tests[0];
  const slot = firstTest?.slot;
  const confirmed = ['accepted', 'confirmed', 'completed'].includes(booking.booking_status.toLowerCase());
  const memberNames = booking.members.map(item => item.member.name).join(', ');
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}>
      <View style={styles.cardTop}>
        <AppText color={theme.colors.textMuted} style={styles.bookingNo} weight="700">BOOKING {booking.booking_no}</AppText>
        <View style={[styles.status, { backgroundColor: confirmed ? '#DCF7EF' : theme.colors.primarySoft }]}>
          <CircleCheck color={confirmed ? '#078A73' : theme.colors.primary} size={11} />
          <AppText color={confirmed ? '#078A73' : theme.colors.primary} style={styles.statusText} weight="800">{statusLabel(booking.booking_status)}</AppText>
        </View>
      </View>
      <View style={styles.mainRow}>
        <View style={styles.dateBox}>
          <AppText color="#FFFFFF" style={styles.dateWeekday} weight="700">{formatDate(booking.booking_date).split(',')[0].toUpperCase()}</AppText>
          <AppText color="#FFFFFF" style={styles.dateDay} weight="800">{booking.booking_date.slice(-2)}</AppText>
          <AppText color="#FFFFFF" style={styles.dateMonth}>{new Date(`${booking.booking_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</AppText>
        </View>
        <View style={styles.grow}>
          <AppText style={styles.labName} weight="800">{firstTest?.test.test_name ?? booking.lab.lab_name}</AppText>
          <AppText color={theme.colors.textMuted} style={styles.testSummary} numberOfLines={1}>
            {booking.lab.lab_name} · {memberNames}
          </AppText>
          <View style={styles.appointmentRow}>
            <Clock3 color={theme.colors.textMuted} size={11} />
            <AppText color={theme.colors.textMuted} style={styles.appointmentText}>
              Home collection · {formatTime(slot?.start_time)}–{formatTime(slot?.end_time)}
            </AppText>
          </View>
        </View>
        <AppText style={styles.price} weight="800">₹{Number(booking.total_final_amount)}</AppText>
      </View>
      <View style={styles.progressRow}>
        {['Confirmed', 'Phlebo assigned', 'Sample collection', 'Report ready'].map((label, index) => {
          const active = index === 0 && confirmed;
          return (
            <React.Fragment key={label}>
              {index > 0 && <View style={[styles.progressLine, active && styles.progressLineActive]} />}
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, active && styles.progressDotActive]} />
                <AppText color={active ? '#078A73' : theme.colors.textMuted} style={styles.progressLabel} weight={active ? '700' : '400'}>{label}</AppText>
              </View>
            </React.Fragment>
          );
        })}
      </View>
      <View style={[styles.reportBar, { backgroundColor: theme.colors.surfaceMuted }]}>
        <FileText color={theme.colors.text} size={15} />
        <View style={styles.grow}>
          <AppText style={styles.reportTitle} weight="700">Report {booking.members.some(item => item.result_pdf) ? 'available' : 'pending'}</AppText>
          <AppText color={theme.colors.textMuted} style={styles.reportMeta}>{booking.total_tests} test report</AppText>
        </View>
        <AppText color={booking.payment_status === 'paid' ? '#078A73' : theme.colors.primary} style={styles.paid} weight="800">{statusLabel(booking.payment_status)}</AppText>
      </View>
      <View style={styles.actions}>
        <Pressable disabled style={[styles.cancelButton, { borderColor: theme.colors.border }]}>
          <AppText color={theme.colors.textMuted} style={styles.buttonText} weight="800">Cancel</AppText>
        </Pressable>
        <Pressable onPress={onView} style={[styles.viewButton, { backgroundColor: theme.colors.primary }] }>
          <AppText color="#FFFFFF" style={styles.buttonText} weight="800">View booking</AppText>
          <ChevronDown color="#FFFFFF" size={15} style={styles.viewArrow} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 110 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  eyebrow: { fontSize: 9, lineHeight: 12, letterSpacing: 0.8, marginBottom: 4 },
  title: { fontSize: 25, lineHeight: 29, letterSpacing: -0.8 },
  subtitle: { marginTop: 4, maxWidth: 310, fontSize: 10, lineHeight: 14 },
  section: { marginTop: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  sectionTitle: { fontSize: 15, lineHeight: 19 },
  count: { fontSize: 9, lineHeight: 12 },
  card: { borderWidth: 1, borderRadius: 20, padding: 12, marginBottom: 12, elevation: 3, shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bookingNo: { fontSize: 8, lineHeight: 10, letterSpacing: 0.35 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4 },
  statusText: { fontSize: 8, lineHeight: 11 },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  dateBox: { width: 43, height: 55, borderRadius: 12, backgroundColor: '#001A31', alignItems: 'center', justifyContent: 'center' },
  dateWeekday: { fontSize: 7, lineHeight: 9 },
  dateDay: { fontSize: 18, lineHeight: 20 },
  dateMonth: { fontSize: 7, lineHeight: 9 },
  grow: { flex: 1 },
  labName: { fontSize: 14, lineHeight: 18 },
  testSummary: { marginTop: 3, fontSize: 9, lineHeight: 12 },
  appointmentRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  appointmentText: { fontSize: 9, lineHeight: 12 },
  price: { fontSize: 15, lineHeight: 19 },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 15, marginBottom: 13 },
  progressStep: { width: 56, alignItems: 'center' },
  progressLine: { flex: 1, height: 1, marginTop: 4, backgroundColor: '#D8DEE6' },
  progressLineActive: { backgroundColor: '#078A73' },
  progressDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  progressDotActive: { borderColor: '#078A73', backgroundColor: '#078A73' },
  progressLabel: { marginTop: 5, fontSize: 7, lineHeight: 9, textAlign: 'center' },
  reportBar: { minHeight: 48, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportTitle: { fontSize: 11, lineHeight: 14 },
  reportMeta: { marginTop: 2, fontSize: 8, lineHeight: 10 },
  paid: { fontSize: 9, lineHeight: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cancelButton: { flex: 1, minHeight: 38, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  viewButton: { flex: 1.25, minHeight: 38, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewArrow: { transform: [{ rotate: '-90deg' }] },
  stateCard: { borderWidth: 1, borderRadius: 18, marginTop: 28, padding: 24, alignItems: 'center' },
  stateTitle: { marginTop: 12, fontSize: 14, lineHeight: 18 },
  stateText: { marginTop: 5, fontSize: 9, lineHeight: 13, textAlign: 'center' },
  loginButton: { minWidth: 110, minHeight: 40, borderRadius: 11, marginTop: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { fontSize: 10, lineHeight: 13 },
  loading: { paddingVertical: 60 },
});
