import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  PendingBookingReview,
  submitBookingOverallReview,
} from '../api/bookings';
import { useAppTheme } from '../theme';
import { AppText } from './AppText';
import { BookingRatingStars } from './BookingRatingStars';
import { formatINR } from '../utils/currency';

type Props = {
  booking: PendingBookingReview | null;
  token: string;
  onClose: () => void;
  onWriteReview: (booking: PendingBookingReview, rating: number) => void;
};

export function BookingReviewSheet({
  booking,
  token,
  onClose,
  onWriteReview,
}: Props) {
  const { theme } = useAppTheme();
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submittingRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const bookingId = booking?.booking_order_id;
  const needsRating = booking?.pending_overall_review !== false;

  useEffect(() => {
    setRating(Number(booking?.overall_rating) || 0);
    setSubmitted(false);
    if (timer.current) clearTimeout(timer.current);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [bookingId, booking?.overall_rating]);

  useEffect(() => {
    if (!submitted) return;
    timer.current = setTimeout(() => onCloseRef.current(), 3000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [submitted]);

  const close = () => {
    if (submittingRef.current) return;
    if (timer.current) clearTimeout(timer.current);
    onClose();
  };

  const writeReview = () => {
    if (!booking) return;
    if (timer.current) clearTimeout(timer.current);
    onWriteReview(
      {
        ...booking,
        overall_rating: rating,
        pending_overall_review: submitted
          ? false
          : booking.pending_overall_review,
      },
      rating,
    );
  };

  const submit = async () => {
    if (!booking || !rating || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await submitBookingOverallReview(
        token,
        booking.booking_order_id,
        rating,
        '',
      );
      setSubmitted(true);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not submit rating',
        text2: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const date = booking?.booking_date
    ? new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const showWriteReview = submitted || !needsRating;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={booking !== null}
      onRequestClose={close}
    >
      <SafeAreaProvider>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <SafeAreaView
            edges={['top', 'bottom']}
            style={styles.safeArea}
            pointerEvents="box-none"
          >
            <View
              style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
            >
              <View
                style={[
                  styles.handle,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <AppText style={styles.title} weight="800">
                {submitted
                  ? 'Thank you for your rating!'
                  : needsRating
                  ? 'How was your lab booking?'
                  : 'Share your collection experience'}
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.subtitle}>
                {submitted
                  ? 'Add a written review before this closes in 3 seconds.'
                  : 'Your feedback helps improve the experience.'}
              </AppText>
              <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
              >
                <View
                  style={[
                    styles.bookingCard,
                    { backgroundColor: theme.colors.surfaceMuted },
                  ]}
                >
                  <AppText style={styles.labName} weight="800">
                    {booking?.lab.lab_name}
                  </AppText>
                  <AppText color={theme.colors.textMuted} style={styles.meta}>
                    {booking?.booking_no}
                  </AppText>
                  <AppText color={theme.colors.textMuted} style={styles.meta}>
                    {date} ·{' '}
                    {formatINR(Number(booking?.total_final_amount ?? 0))}
                  </AppText>
                </View>
                {needsRating && (
                  <BookingRatingStars
                    rating={rating}
                    onChange={setRating}
                    disabled={submitting || submitted}
                  />
                )}
              </ScrollView>
              <View style={styles.actions}>
                {!submitted && (
                  <Pressable
                    onPress={close}
                    disabled={submitting}
                    style={[
                      styles.secondary,
                      { borderColor: theme.colors.border },
                    ]}
                  >
                    <AppText weight="700">Later</AppText>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={showWriteReview ? writeReview : submit}
                  disabled={!showWriteReview && (!rating || submitting)}
                  style={[
                    styles.primary,
                    {
                      backgroundColor:
                        showWriteReview || rating
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <AppText
                      color={
                        showWriteReview || rating
                          ? '#FFFFFF'
                          : theme.colors.textMuted
                      }
                      weight="800"
                    >
                      {showWriteReview ? 'Write a review' : 'Submit rating'}
                    </AppText>
                  )}
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
          <Toast />
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008' },
  safeArea: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%',
    flexShrink: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, lineHeight: 25 },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 5 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  bookingCard: {
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  labName: { fontSize: 14, lineHeight: 19 },
  meta: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  actions: { flexDirection: 'row', flexShrink: 0, gap: 10, marginTop: 18 },
  secondary: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    flex: 2,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
