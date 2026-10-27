import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import FileText from 'lucide-react-native/icons/file-text';
import Check from 'lucide-react-native/icons/check';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { AppText, HealthFlowHeader } from '../components';
import { useAppSelector } from '../store';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'HealthBookingPicker'>;

export function HealthBookingPickerScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const [bookings, setBookings] = useState<FamilyMemberTestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { memberId, selectedBookingId } = route.params;

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      setBookings(await getFamilyMemberTestBookings(token, memberId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token, memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const eligible = reportReadyFamilyBookings(bookings).filter(
    booking => booking.family_member_id === memberId,
  );

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
          title="Select a booking"
          subtitle="Reports ready"
          onBack={navigation.goBack}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <AppText style={styles.title} weight="800">
            Past bookings with reports
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            Choose one completed booking with a generated report.
          </AppText>
          {loading ? (
            <ActivityIndicator
              style={styles.state}
              color={theme.colors.primary}
            />
          ) : null}
          {error ? (
            <Pressable onPress={load} style={styles.state}>
              <AppText color={theme.colors.primary}>
                Could not load bookings. Tap to retry.
              </AppText>
            </Pressable>
          ) : null}
          {!loading && !error && !eligible.length ? (
            <AppText color={theme.colors.textMuted} style={styles.state}>
              No past booking with a generated report for this family member.
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
                  navigation.popTo('HealthReportSelection', {
                    memberId,
                    bookingId: booking.booking_id,
                  })
                }
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: selected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}
                >
                  <FileText color={theme.colors.primary} size={19} />
                </View>
                <View style={styles.copy}>
                  <AppText weight="800">{booking.test.test_name}</AppText>
                  <AppText color={theme.colors.textMuted} style={styles.detail}>
                    Booking {booking.order.booking_no} · {booking.lab.lab_name}{' '}
                    · {booking.booking_date}
                  </AppText>
                </View>
                {selected ? <Check color="#078B76" size={19} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 30 },
  title: { fontSize: 22, lineHeight: 27 },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 6, marginBottom: 18 },
  state: { marginTop: 24, alignSelf: 'center' },
  card: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, marginLeft: 10 },
  detail: { fontSize: 10, lineHeight: 14, marginTop: 4 },
});
