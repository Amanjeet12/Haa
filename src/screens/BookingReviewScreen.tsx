import React, { useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Toast from 'react-native-toast-message';
import { AppText } from '../components';
import { BookingRatingStars } from '../components/BookingRatingStars';
import {
  submitBookingOverallReview,
  submitBookingPhleboReview,
} from '../api/bookings';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';
import { formatINR } from '../utils/currency';

type Props = NativeStackScreenProps<HomeStackParamList, 'BookingReview'>;

function suggestedPhleboReview(rating: number) {
  return (
    [
      '',
      'I was disappointed with my sample collection experience.',
      'My sample collection experience could have been better.',
      'My sample collection experience was okay.',
      'I had a very good sample collection experience.',
      'I had an excellent sample collection experience.',
    ][rating] ?? ''
  );
}

function suggestedBookingReview(rating: number) {
  return (
    [
      '',
      'I was disappointed with my booking experience.',
      'My booking experience could have been better.',
      'My booking experience was okay.',
      'I had a very good booking experience.',
      'I had an excellent booking experience.',
    ][rating] ?? ''
  );
}

export function BookingReviewScreen({ navigation, route }: Props) {
  const { booking } = route.params;
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const [rating, setRating] = useState(
    route.params.rating || Number(booking.overall_rating) || 0,
  );
  const [review, setReview] = useState(
    booking.overall_review?.trim()
      ? booking.overall_review
      : suggestedBookingReview(rating),
  );
  const reviewEdited = useRef(Boolean(booking.overall_review?.trim()));
  const changeBookingRating = (value: number) => {
    setRating(value);
    if (!reviewEdited.current) setReview(suggestedBookingReview(value));
  };
  const [phleboRating, setPhleboRating] = useState(
    Number(booking.phlebo_rating) || 0,
  );
  const [phleboReview, setPhleboReview] = useState(
    booking.phlebo_review?.trim()
      ? booking.phlebo_review
      : suggestedPhleboReview(phleboRating),
  );
  const phleboReviewEdited = useRef(Boolean(booking.phlebo_review?.trim()));
  const changePhleboRating = (value: number) => {
    setPhleboRating(value);
    if (!phleboReviewEdited.current)
      setPhleboReview(suggestedPhleboReview(value));
  };
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const inputOffsets = useRef({ overall: 0, phlebo: 0 });
  const cardOffsets = useRef({ overall: 0, phlebo: 0 });
  const focusedInput = useRef<'overall' | 'phlebo' | null>(null);
  const hasPhlebotomist = Boolean(
    booking.phlebo_id || booking.pending_phlebo_review,
  );
  const saved = useRef({
    overall: !booking.pending_overall_review
      ? JSON.stringify({
          rating: route.params.rating || Number(booking.overall_rating),
          review: booking.overall_review ?? '',
        })
      : '',
    phlebo:
      !booking.pending_phlebo_review && booking.phlebo_rating
        ? JSON.stringify({
            rating: Number(booking.phlebo_rating),
            review: booking.phlebo_review ?? '',
          })
        : '',
  });

  useEffect(() => {
    const listener = Keyboard.addListener('keyboardDidShow', () => {
      if (focusedInput.current) {
        scrollRef.current?.scrollTo({
          y:
            cardOffsets.current[focusedInput.current] +
            inputOffsets.current[focusedInput.current] -
            12,
          animated: true,
        });
      }
    });
    return () => listener.remove();
  }, []);

  const focusReview = (section: 'overall' | 'phlebo') => {
    focusedInput.current = section;
    scrollRef.current?.scrollTo({
      y: cardOffsets.current[section] + inputOffsets.current[section] - 12,
      animated: true,
    });
  };

  const canSubmit = Boolean(
    token && rating && (!hasPhlebotomist || phleboRating) && !submitting,
  );
  const submit = async () => {
    if (!token || !canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    Keyboard.dismiss();
    const overall = { rating, review: review.trim() };
    const phlebo = { rating: phleboRating, review: phleboReview.trim() };
    const overallKey = JSON.stringify(overall);
    const phleboKey = JSON.stringify(phlebo);
    const results = await Promise.allSettled([
      saved.current.overall === overallKey
        ? Promise.resolve()
        : submitBookingOverallReview(
            token,
            booking.booking_order_id,
            overall.rating,
            overall.review,
          ),
      !hasPhlebotomist || saved.current.phlebo === phleboKey
        ? Promise.resolve()
        : submitBookingPhleboReview(
            token,
            booking.booking_order_id,
            phlebo.rating,
            phlebo.review,
          ),
    ]);
    const errors: string[] = [];
    results.forEach((result, index) => {
      const field = index === 0 ? 'overall' : 'phlebo';
      if (result.status === 'fulfilled') {
        saved.current[field] = index === 0 ? overallKey : phleboKey;
      } else {
        errors.push(
          `${index === 0 ? 'Booking' : 'Phlebotomist'}: ${
            result.reason instanceof Error
              ? result.reason.message
              : 'Please try again.'
          }`,
        );
      }
    });
    submittingRef.current = false;
    setSubmitting(false);
    if (errors.length) {
      Toast.show({
        type: 'error',
        text1: 'Some feedback could not be saved',
        text2: errors.join('\n'),
      });
      return;
    }
    navigation.goBack();
    Toast.show({ type: 'success', text1: 'Thank you for your feedback' });
  };

  const bookingDate = new Date(
    `${booking.booking_date}T00:00:00`,
  ).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={navigation.goBack}
          style={styles.back}
        >
          <ChevronLeft size={22} color={theme.colors.text} />
        </Pressable>
        <AppText style={styles.title} weight="800">
          Review your booking
        </AppText>
      </View>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View
            style={[
              styles.booking,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppText weight="800" style={styles.lab}>
              {booking.lab.lab_name}
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.meta}>
              {booking.booking_no}
            </AppText>
            <View
              style={[
                styles.bookingDetails,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <View style={styles.detailCopy}>
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.detailLabel}
                >
                  Collection date
                </AppText>
                <AppText weight="700" style={styles.detailValue}>
                  {bookingDate}
                </AppText>
              </View>
              <View>
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.detailLabel}
                >
                  Amount paid
                </AppText>
                <AppText weight="800" style={styles.detailValue}>
                  {formatINR(Number(booking.total_final_amount))}
                </AppText>
              </View>
            </View>
          </View>
          <View
            onLayout={event => {
              cardOffsets.current.overall = event.nativeEvent.layout.y;
            }}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppText weight="800" style={styles.sectionTitle}>
              Your booking experience
            </AppText>
            <BookingRatingStars
              rating={rating}
              onChange={changeBookingRating}
              disabled={submitting}
            />
            <View
              onLayout={event => {
                inputOffsets.current.overall = event.nativeEvent.layout.y;
              }}
            >
              <AppText weight="700" style={styles.label}>
                Booking review (optional)
              </AppText>
              <TextInput
                multiline
                accessibilityLabel="Booking review"
                maxLength={1000}
                value={review}
                onChangeText={value => {
                  reviewEdited.current = true;
                  setReview(value);
                }}
                editable={!submitting}
                onFocus={() => focusReview('overall')}
                onBlur={() => {
                  focusedInput.current = null;
                }}
                placeholder="Tell us about your booking experience"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              />
            </View>
          </View>
          {hasPhlebotomist && (
            <>
              <View
                onLayout={event => {
                  cardOffsets.current.phlebo = event.nativeEvent.layout.y;
                }}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <AppText weight="800" style={styles.sectionTitle}>
                  Phlebo experience
                </AppText>
                <AppText color={theme.colors.textMuted} style={styles.meta}>
                  Rate the person who collected your sample.
                </AppText>
                <BookingRatingStars
                  rating={phleboRating}
                  onChange={changePhleboRating}
                  disabled={submitting}
                  label="Phlebotomist"
                />
                <View
                  onLayout={event => {
                    inputOffsets.current.phlebo = event.nativeEvent.layout.y;
                  }}
                >
                  <AppText weight="700" style={styles.label}>
                    Phlebotomist review (optional)
                  </AppText>
                  <TextInput
                    multiline
                    accessibilityLabel="Phlebotomist review"
                    maxLength={1000}
                    value={phleboReview}
                    onChangeText={value => {
                      phleboReviewEdited.current = true;
                      setPhleboReview(value);
                    }}
                    editable={!submitting}
                    onFocus={() => focusReview('phlebo')}
                    onBlur={() => {
                      focusedInput.current = null;
                    }}
                    placeholder="How was your sample collection?"
                    placeholderTextColor={theme.colors.textMuted}
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  />
                </View>
              </View>
            </>
          )}
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
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={submit}
            style={[
              styles.submit,
              {
                backgroundColor: canSubmit
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={theme.colors.textMuted} />
            ) : (
              <AppText
                weight="800"
                color={canSubmit ? '#FFFFFF' : theme.colors.textMuted}
              >
                Submit feedback
              </AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 18, lineHeight: 24 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  booking: { padding: 16, borderRadius: 16, marginTop: 8, borderWidth: 1 },
  bookingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 12,
  },
  detailCopy: { flex: 1 },
  detailLabel: { fontSize: 10, lineHeight: 15 },
  detailValue: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  lab: { fontSize: 14, lineHeight: 20 },
  meta: { marginTop: 4, fontSize: 11, lineHeight: 17 },
  card: { marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 15, lineHeight: 21 },
  label: { marginTop: 16, fontSize: 12, lineHeight: 18 },
  input: {
    height: 104,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
    textAlignVertical: 'top',
  },
  footer: {
    flexShrink: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  submit: {
    minHeight: 48,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
