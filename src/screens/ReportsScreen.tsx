import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import CircleQuestionMark from 'lucide-react-native/icons/circle-question-mark';
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

export function ReportsScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const token = useAppSelector(state => state.auth.session?.token);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setBookings(await getCustomerBookings(token, 'completed'));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load reports.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports]),
  );

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
              <RefreshControl
                refreshing={loading}
                onRefresh={loadReports}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              resizeMode="contain"
              source={images.logo}
              style={styles.logo}
            />
            <Pressable
              onPress={() => navigation.navigate('Support')}
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
          <AppText
            color={theme.colors.primary}
            style={styles.eyebrow}
            weight="800"
          >
            — YOUR HEALTH RECORDS
          </AppText>
          <AppText style={styles.title} weight="800">
            Reports and{' '}
            <AppText
              color={theme.colors.primary}
              style={styles.title}
              weight="800"
            >
              results.
            </AppText>
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            Download completed lab reports securely for every family member.
          </AppText>

          {!token ? (
            <StateCard
              title="Log in to view reports"
              message="Your medical reports are securely linked to your account."
              action="Login"
              onPress={() => navigation.navigate('Login')}
            />
          ) : loading && !bookings.length ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : error ? (
            <StateCard
              title="Could not load reports"
              message={error}
              action="Try again"
              onPress={loadReports}
            />
          ) : !bookings.length ? (
            <StateCard
              title="No reports yet"
              message="Completed bookings and available reports will appear here."
            />
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle} weight="800">
                  Previous bookings
                </AppText>
                <AppText color={theme.colors.textMuted} style={styles.count}>
                  {bookings.length} total
                </AppText>
              </View>
              {bookings.map(booking => (
                <ReportCard
                  key={booking.booking_order_id}
                  booking={booking}
                  onPress={() =>
                    navigation.navigate('BookingDetails', { booking })
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ReportCard({
  booking,
  onPress,
}: {
  booking: CustomerBooking;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const firstTest = booking.members[0]?.tests[0];
  const reportReady = booking.members.some(
    member => member.result_pdf || member.tests.some(test => test.result_pdf),
  );
  const [year, month, day] = booking.booking_date.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View
        style={[styles.dateBox, { backgroundColor: theme.colors.surfaceMuted }]}
      >
        <AppText style={styles.dateDay} weight="800">
          {String(day).padStart(2, '0')}
        </AppText>
        <AppText
          color={theme.colors.textMuted}
          style={styles.dateMonth}
          weight="700"
        >
          {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText style={styles.testName} weight="800" numberOfLines={1}>
          {firstTest?.test.test_name ?? `${booking.total_tests} lab tests`}
          {booking.total_tests > 1 ? ` +${booking.total_tests - 1}` : ''}
        </AppText>
        <AppText
          color={theme.colors.textMuted}
          style={styles.labName}
          numberOfLines={1}
        >
          {booking.lab.lab_name} · Home collection
        </AppText>
        <View style={styles.tags}>
          <View style={styles.completedTag}>
            <AppText color="#078A73" style={styles.tagText} weight="800">
              Booking completed
            </AppText>
          </View>
          <View
            style={[
              styles.reportTag,
              {
                backgroundColor: reportReady
                  ? '#E8F1FB'
                  : theme.colors.surfaceMuted,
              },
            ]}
          >
            <AppText
              color={reportReady ? '#325B86' : theme.colors.textMuted}
              style={styles.tagText}
              weight="800"
            >
              {reportReady ? 'Report ready' : 'Report pending'}
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.arrow}>
        <ArrowRight color="#FFFFFF" size={18} />
      </View>
    </Pressable>
  );
}

function StateCard({
  title,
  message,
  action,
  onPress,
}: {
  title: string;
  message: string;
  action?: string;
  onPress?: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.stateCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <FileText color={theme.colors.primary} size={28} />
      <AppText style={styles.stateTitle} weight="800">
        {title}
      </AppText>
      <AppText color={theme.colors.textMuted} style={styles.stateText}>
        {message}
      </AppText>
      {!!action && (
        <Pressable
          onPress={onPress}
          style={[styles.action, { backgroundColor: theme.colors.primary }]}
        >
          <AppText color="#FFFFFF" style={styles.actionText} weight="800">
            {action}
          </AppText>
        </Pressable>
      )}
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
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, lineHeight: 22 },
  count: { fontSize: 9, lineHeight: 12 },
  card: {
    minHeight: 102,
    borderWidth: 1,
    borderRadius: 18,
    padding: 11,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 2,
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  dateBox: {
    width: 50,
    height: 62,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: { fontSize: 21, lineHeight: 24 },
  dateMonth: { marginTop: 1, fontSize: 8, lineHeight: 10 },
  copy: { flex: 1 },
  testName: { fontSize: 13, lineHeight: 16 },
  labName: { marginTop: 3, fontSize: 8, lineHeight: 11 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  completedTag: {
    backgroundColor: '#DCF7EF',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  reportTag: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  tagText: { fontSize: 7, lineHeight: 9 },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#001A31',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { paddingVertical: 60 },
  stateCard: {
    borderWidth: 1,
    borderRadius: 18,
    marginTop: 28,
    padding: 24,
    alignItems: 'center',
  },
  stateTitle: { marginTop: 12, fontSize: 14, lineHeight: 18 },
  stateText: { marginTop: 5, fontSize: 9, lineHeight: 13, textAlign: 'center' },
  action: {
    minWidth: 110,
    minHeight: 40,
    borderRadius: 11,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionText: { fontSize: 9, lineHeight: 12 },
});
