import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomerBooking, requestBookingCancellation } from '../api/bookings';
import { ApiError } from '../api/client';
import { useAppTheme } from '../theme';
import { AppText } from './AppText';

const reasons = [
  'I need to change the collection date or time.',
  'I booked by mistake.',
  'I no longer need this test.',
];

type Props = {
  booking: CustomerBooking | null;
  token: string;
  onClose: () => void;
  onSubmitted: (bookingOrderId: number) => void;
};

export function BookingCancellationModal({
  booking,
  token,
  onClose,
  onSubmitted,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const reason =
    selectedReason === 'Other' ? customReason.trim() : selectedReason;

  const close = () => {
    if (submitting) return;
    setSelectedReason(null);
    setCustomReason('');
    setErrorMessage(null);
    onClose();
  };

  const submit = async () => {
    if (!booking || !reason || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await requestBookingCancellation(
        token,
        booking.booking_order_id,
        reason,
      );
      onSubmitted(booking.booking_order_id);
      setSelectedReason(null);
      setCustomReason('');
      onClose();
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: 'Cancellation requested',
          text2: response.msg,
        });
      }, 350);
    } catch (error) {
      const payload = error instanceof ApiError ? error.payload : null;
      const apiMessage =
        payload && typeof payload === 'object' && 'msg' in payload
          ? String(payload.msg)
          : null;
      setErrorMessage(
        apiMessage ||
          (error instanceof Error ? error.message : 'Please try again.'),
      );
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={close} />
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.reasonList}
          >
            <AppText style={styles.title} weight="800">
              Cancel booking?
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.description}>
              Choose why you want to cancel {booking?.booking_no}. Your request
              will be reviewed under the cancellation policy.
            </AppText>
            {[...reasons, 'Other'].map(option => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedReason === option }}
                key={option}
                onPress={() => setSelectedReason(option)}
                style={[
                  styles.option,
                  {
                    borderColor:
                      selectedReason === option
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[styles.radio, { borderColor: theme.colors.primary }]}
                >
                  {selectedReason === option && (
                    <View
                      style={[
                        styles.radioFill,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>
                <AppText style={styles.optionText}>{option}</AppText>
              </Pressable>
            ))}
            {selectedReason === 'Other' && (
              <TextInput
                accessibilityLabel="Cancellation reason"
                maxLength={500}
                multiline
                onChangeText={setCustomReason}
                placeholder="Write your reason"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.customInput,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                value={customReason}
              />
            )}
            {errorMessage && (
              <AppText
                accessibilityRole="alert"
                color={theme.colors.danger}
                style={styles.error}
              >
                {errorMessage}
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
              disabled={!reason || submitting}
              onPress={submit}
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: reason ? 1 : 0.5,
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
                  Submit request
                </AppText>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    padding: 20,
  },
  reasonList: { flexShrink: 1 },
  title: { fontSize: 20, lineHeight: 26 },
  description: { marginTop: 6, marginBottom: 16, fontSize: 13, lineHeight: 18 },
  option: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  optionText: { flex: 1, fontSize: 13 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: { width: 8, height: 8, borderRadius: 4 },
  customInput: {
    minHeight: 84,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    textAlignVertical: 'top',
  },
  error: { marginTop: 8, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
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
