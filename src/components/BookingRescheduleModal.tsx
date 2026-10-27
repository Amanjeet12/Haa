import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomerBooking, rescheduleBooking } from '../api/bookings';
import { ApiError } from '../api/client';
import { getLabSlots, LabSlot } from '../api/labSlots';
import { useAppTheme } from '../theme';
import { AppText } from './AppText';

type Props = {
  booking: CustomerBooking | null;
  token: string;
  onClose: () => void;
  onSubmitted: () => void;
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function timeLabel(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return `${String(hours % 12 || 12).padStart(2, '0')}:${String(
    minutes,
  ).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

function isBookable(slot: LabSlot) {
  const startsAt = new Date(`${slot.booking_date}T${slot.start_time}`);
  return slot.isActive && slot.is_available && startsAt.getTime() > Date.now();
}

export function BookingRescheduleModal({
  booking,
  token,
  onClose,
  onSubmitted,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(0);
  const [slots, setSlots] = useState<LabSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dates = Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return date;
  });
  const bookingDate = dateKey(dates[selectedDay]);

  useEffect(() => {
    if (!booking) return;
    let active = true;
    setLoading(true);
    setError(null);
    setSlots([]);
    setSelectedSlotId(null);
    getLabSlots(booking.lab.lab_id, bookingDate)
      .then(result => {
        if (!active) return;
        const available = result.filter(slot => slot.isActive);
        setSlots(available);
        setSelectedSlotId(available.find(isBookable)?.slot_id ?? null);
      })
      .catch(loadError => {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load slots.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [booking, bookingDate]);

  const close = () => {
    if (submitting) return;
    setSelectedDay(0);
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!booking || !selectedSlotId || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await rescheduleBooking(
        token,
        booking,
        bookingDate,
        selectedSlotId,
      );
      onClose();
      onSubmitted();
      setTimeout(
        () =>
          Toast.show({
            type: 'success',
            text1: 'Booking rescheduled',
            text2:
              response.msg || 'Your booking has been rescheduled successfully.',
          }),
        350,
      );
    } catch (submitError) {
      const payload =
        submitError instanceof ApiError ? submitError.payload : null;
      const apiMessage =
        payload && typeof payload === 'object' && 'msg' in payload &&
        typeof payload.msg === 'string'
          ? payload.msg
          : null;
      const message =
        apiMessage ||
        (submitError instanceof Error
          ? submitError.message
          : 'Unable to reschedule booking.');
      Toast.show({
        type: 'error',
        text1: 'Unable to reschedule',
        text2: message,
      });
      if (!(submitError instanceof ApiError && submitError.status === 409)) {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={close}
      transparent
      visible={booking !== null}
    >
      <View style={styles.overlay}>
        <Pressable onPress={close} style={styles.backdrop} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(insets.bottom, 24) + 12,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <View style={styles.headingRow}>
              <View
                style={[
                  styles.step,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <AppText
                  color={theme.colors.primary}
                  style={styles.stepText}
                  weight="800"
                >
                  02
                </AppText>
              </View>
              <View style={styles.grow}>
                <AppText style={styles.title} weight="800">
                  Select date &amp; slot
                </AppText>
                <AppText color={theme.colors.textMuted} style={styles.subtitle}>
                  Choose a convenient home-collection time
                </AppText>
              </View>
            </View>
            <View style={styles.dates}>
              {dates.map((date, index) => {
                const active = selectedDay === index;
                return (
                  <Pressable
                    key={dateKey(date)}
                    onPress={() => setSelectedDay(index)}
                    style={[
                      styles.date,
                      {
                        backgroundColor: active
                          ? theme.colors.primary
                          : theme.colors.surfaceMuted,
                      },
                    ]}
                  >
                    <AppText
                      color={
                        active ? theme.colors.onPrimary : theme.colors.textMuted
                      }
                      style={styles.day}
                      weight="700"
                    >
                      {date
                        .toLocaleDateString('en-US', { weekday: 'short' })
                        .toUpperCase()}
                    </AppText>
                    <AppText
                      color={
                        active ? theme.colors.onPrimary : theme.colors.text
                      }
                      style={styles.dateNumber}
                      weight="800"
                    >
                      {date.getDate()}
                    </AppText>
                    <AppText
                      color={
                        active ? theme.colors.onPrimary : theme.colors.textMuted
                      }
                      style={styles.month}
                    >
                      {date
                        .toLocaleDateString('en-US', { month: 'short' })
                        .toUpperCase()}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            {loading ? (
              <View style={styles.state}>
                <ActivityIndicator color={theme.colors.primary} />
                <AppText color={theme.colors.textMuted}>
                  Checking available slots…
                </AppText>
              </View>
            ) : error && !slots.length ? (
              <View style={styles.state}>
                <AppText color={theme.colors.danger}>{error}</AppText>
              </View>
            ) : slots.length ? (
              <View style={styles.slots}>
                {slots.map(slot => {
                  const bookable = isBookable(slot);
                  const active = selectedSlotId === slot.slot_id;
                  return (
                    <Pressable
                      key={slot.slot_id}
                      disabled={!bookable}
                      onPress={() => setSelectedSlotId(slot.slot_id)}
                      style={[
                        styles.slot,
                        {
                          borderColor: active
                            ? theme.colors.success
                            : theme.colors.border,
                          backgroundColor: active
                            ? theme.colors.success
                            : theme.colors.surfaceMuted,
                          opacity: bookable ? 1 : 0.5,
                        },
                      ]}
                    >
                      <AppText
                        color={
                          active ? theme.colors.onPrimary : theme.colors.text
                        }
                        style={styles.slotTime}
                        weight="700"
                      >
                        {timeLabel(slot.start_time)}–{timeLabel(slot.end_time)}
                      </AppText>
                      <AppText
                        color={
                          active
                            ? theme.colors.onPrimary
                            : theme.colors.textMuted
                        }
                        style={styles.slotMeta}
                      >
                        {active ? 'Selected · ' : ''}
                        {bookable
                          ? `${slot.available_booking_count} left`
                          : 'Unavailable'}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.state}>
                <AppText color={theme.colors.textMuted}>
                  No collection slots are available for this date.
                </AppText>
              </View>
            )}
            {error && !!slots.length && (
              <AppText
                accessibilityRole="alert"
                color={theme.colors.danger}
                style={styles.error}
              >
                {error}
              </AppText>
            )}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable
              disabled={submitting}
              onPress={close}
              style={[styles.button, { borderColor: theme.colors.border }]}
            >
              <AppText style={styles.buttonText} weight="700">
               Close
              </AppText>
            </Pressable>
            <Pressable
              disabled={!selectedSlotId || loading || submitting}
              onPress={submit}
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: selectedSlotId && !loading ? 1 : 0.5,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <AppText
                  color={theme.colors.onPrimary}
                  style={styles.buttonText}
                  weight="800"
                >
                  Confirm reschedule
                </AppText>
              )}
            </Pressable>
          </View>
        </View>
        <Toast />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#0008',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
  },
  scroll: { flexShrink: 1 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  step: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 10 },
  grow: { flex: 1 },
  title: { fontSize: 16, lineHeight: 20 },
  subtitle: { fontSize: 10, lineHeight: 13, marginTop: 2 },
  dates: { flexDirection: 'row', gap: 6, marginTop: 18 },
  date: {
    flex: 1,
    minHeight: 72,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: { fontSize: 8, lineHeight: 10 },
  dateNumber: { fontSize: 18, lineHeight: 21 },
  month: { fontSize: 8, lineHeight: 10 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  slot: {
    width: '31%',
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  slotTime: { fontSize: 8, lineHeight: 11, textAlign: 'center' },
  slotMeta: { fontSize: 7, lineHeight: 9, marginTop: 3, textAlign: 'center' },
  state: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  error: { marginTop: 10, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 18 },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 12, lineHeight: 16 },
});
