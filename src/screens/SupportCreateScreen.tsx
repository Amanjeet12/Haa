import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Camera from 'lucide-react-native/icons/camera';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import X from 'lucide-react-native/icons/x';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSupportTicket, uploadSupportPhoto } from '../api/support';
import { CustomerBooking, getCustomerBookings } from '../api/bookings';
import { AppText } from '../components';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SupportCreate'>;
const types = [
  'booking_issue',
  'general',
  'payment',
  'technical',
  'sample_collection',
  'report_issue',
  'refund',
  'account',
  'other',
];
const priorities = ['low', 'medium', 'high'];

export function SupportCreateScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const [type, setType] = useState(types[0]);
  const [priority, setPriority] = useState('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const linkedBooking = route.params?.booking;
  const [bookingOrderId, setBookingOrderId] = useState(
    linkedBooking ? String(linkedBooking.booking_order_id) : '',
  );
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [photo, setPhoto] = useState<{
    uri: string;
    type?: string;
    fileName?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedBooking =
    bookings.find(
      booking => String(booking.booking_order_id) === bookingOrderId,
    ) ??
    linkedBooking ??
    null;

  useEffect(() => {
    if (!token) return;
    setBookingsLoading(true);
    getCustomerBookings(token)
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [token]);

  const choosePhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (asset?.uri) {
      setPhoto({ uri: asset.uri, type: asset.type, fileName: asset.fileName });
    }
  };

  const submit = async () => {
    if (!token) return;
    if (!subject.trim() || !description.trim() || !message.trim()) {
      setError('Enter a subject, description and message.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const remoteUrl = photo ? await uploadSupportPhoto(token, photo) : null;
      await createSupportTicket(token, {
        type,
        subject,
        description,
        priority,
        message,
        bookingOrderId,
        photo: remoteUrl
          ? { remoteUrl, type: photo?.type, fileName: photo?.fileName }
          : null,
      });
      navigation.goBack();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to create support request.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable
          onPress={navigation.goBack}
          style={[styles.back, { backgroundColor: theme.colors.surface }]}
        >
          <ChevronLeft color={theme.colors.text} size={20} />
        </Pressable>
        <AppText style={styles.headerTitle} weight="800">
          New support request
        </AppText>
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.safe}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.form,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Choice
              label="Request type"
              options={types}
              value={type}
              onChange={setType}
            />
            <Field
              label="Subject *"
              value={subject}
              onChangeText={setSubject}
              placeholder="Briefly describe the issue"
            />
            <Field
              label="Description *"
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us what happened"
              multiline
            />
            <Field
              label="Message *"
              value={message}
              onChangeText={setMessage}
              placeholder="Message for our support team"
              multiline
            />
            <Choice
              label="Priority"
              options={priorities}
              value={priority}
              onChange={setPriority}
            />
            <View style={styles.field}>
              <AppText style={styles.label} weight="700">
                Link a booking
              </AppText>
              <Pressable
                onPress={() => setBookingsOpen(true)}
                style={[
                  styles.bookingPicker,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <CalendarDays color={theme.colors.primary} size={17} />
                <View style={styles.bookingCopy}>
                  <AppText style={styles.bookingTitle} weight="700">
                    {selectedBooking
                      ? selectedBooking.booking_no
                      : 'Select booking (optional)'}
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.bookingMeta}
                    numberOfLines={1}
                  >
                    {selectedBooking
                      ? `${selectedBooking.lab.lab_name} · ${selectedBooking.booking_date}`
                      : 'Connect this request to a lab booking'}
                  </AppText>
                </View>
                <ChevronDown color={theme.colors.textMuted} size={16} />
              </Pressable>
            </View>
            <View style={styles.field}>
              <AppText style={styles.label} weight="700">
                Photo attachment
              </AppText>
              {photo ? (
                <View style={styles.photoWrap}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <Pressable
                    onPress={() => setPhoto(null)}
                    style={[
                      styles.removePhoto,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <X color={theme.colors.primary} size={15} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={choosePhoto}
                  style={[
                    styles.addPhoto,
                    {
                      backgroundColor: theme.colors.primarySoft,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Camera color={theme.colors.primary} size={18} />
                  <AppText
                    color={theme.colors.primary}
                    style={styles.addPhotoText}
                    weight="700"
                  >
                    Add photo
                  </AppText>
                </Pressable>
              )}
            </View>
          </View>
          {!!error && (
            <AppText color={theme.colors.danger} style={styles.error}>
              {error}
            </AppText>
          )}
          <Pressable
            disabled={saving}
            onPress={submit}
            style={[
              styles.submit,
              {
                backgroundColor: saving
                  ? theme.colors.border
                  : theme.colors.primary,
              },
            ]}
          >
            <AppText color="#FFFFFF" style={styles.submitText} weight="800">
              {saving ? 'Submitting…' : 'Submit request'}
            </AppText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        transparent
        animationType="slide"
        visible={bookingsOpen}
        onRequestClose={() => setBookingsOpen(false)}
      >
        <View style={styles.modal}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setBookingsOpen(false)}
          />
          <SafeAreaView
            edges={['bottom']}
            style={[
              styles.bookingSheet,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View
              style={[styles.handle, { backgroundColor: theme.colors.border }]}
            />
            <View style={styles.sheetHeader}>
              <View>
                <AppText style={styles.sheetTitle} weight="800">
                  Link a booking
                </AppText>
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.sheetSubtitle}
                >
                  Select the booking this request is about.
                </AppText>
              </View>
              <Pressable
                onPress={() => setBookingsOpen(false)}
                style={[
                  styles.close,
                  { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <X color={theme.colors.text} size={18} />
              </Pressable>
            </View>
            {bookingsLoading ? (
              <View style={styles.sheetState}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Pressable
                  onPress={() => {
                    setBookingOrderId('');
                    setBookingsOpen(false);
                  }}
                  style={[
                    styles.bookingRow,
                    { borderBottomColor: theme.colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.bookingRowIcon,
                      { backgroundColor: theme.colors.primarySoft },
                    ]}
                  >
                    <CalendarDays color={theme.colors.primary} size={16} />
                  </View>
                  <View style={styles.bookingRowCopy}>
                    <AppText style={styles.bookingRowTitle} weight="700">
                      No booking linked
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.bookingRowMeta}
                    >
                      Create a general support request
                    </AppText>
                  </View>
                </Pressable>
                {bookings.map(booking => (
                  <Pressable
                    key={booking.booking_order_id}
                    onPress={() => {
                      setBookingOrderId(String(booking.booking_order_id));
                      setBookingsOpen(false);
                    }}
                    style={[
                      styles.bookingRow,
                      { borderBottomColor: theme.colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.bookingRowIcon,
                        { backgroundColor: theme.colors.primarySoft },
                      ]}
                    >
                      <CalendarDays color={theme.colors.primary} size={16} />
                    </View>
                    <View style={styles.bookingRowCopy}>
                      <AppText style={styles.bookingRowTitle} weight="700">
                        {booking.booking_no}
                      </AppText>
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.bookingRowMeta}
                        numberOfLines={1}
                      >
                        {booking.lab.lab_name} · {booking.booking_date}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
                {!bookings.length && (
                  <View style={styles.sheetState}>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.sheetSubtitle}
                    >
                      No bookings available to link.
                    </AppText>
                  </View>
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.field}>
      <AppText style={styles.label} weight="700">
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: theme.colors.text,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}
      />
    </View>
  );
}

function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.field}>
      <AppText style={styles.label} weight="700">
        {label}
      </AppText>
      <View style={styles.choices}>
        {options.map(option => (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.choice,
              {
                borderColor:
                  value === option ? theme.colors.primary : theme.colors.border,
                backgroundColor:
                  value === option
                    ? theme.colors.primarySoft
                    : theme.colors.surface,
              },
            ]}
          >
            <AppText
              color={
                value === option ? theme.colors.primary : theme.colors.textMuted
              }
              style={styles.choiceText}
              weight="700"
            >
              {option.replace('_', ' ')}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 21 },
  headerSpacer: { width: 36 },
  content: { padding: 16, paddingBottom: 34 },
  form: { borderWidth: 1, borderRadius: 18, padding: 13 },
  field: { marginBottom: 15 },
  label: { marginBottom: 7, fontSize: 11, lineHeight: 14 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  multiline: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: { fontSize: 9, lineHeight: 12, textTransform: 'capitalize' },
  addPhoto: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  addPhotoText: { fontSize: 10, lineHeight: 13 },
  photoWrap: { width: 96, height: 96 },
  photo: { width: '100%', height: '100%', borderRadius: 12 },
  removePhoto: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  bookingPicker: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  bookingCopy: { flex: 1 },
  bookingTitle: { fontSize: 11, lineHeight: 14 },
  bookingMeta: { marginTop: 2, fontSize: 8, lineHeight: 11 },
  modal: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(2,6,23,.55)',
  },
  bookingSheet: {
    maxHeight: '70%',
    minHeight: 320,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  sheetHeader: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: { fontSize: 16, lineHeight: 20 },
  sheetSubtitle: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetState: { paddingVertical: 42, alignItems: 'center' },
  bookingRow: {
    minHeight: 67,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  bookingRowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingRowCopy: { flex: 1 },
  bookingRowTitle: { fontSize: 11, lineHeight: 14 },
  bookingRowMeta: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  error: { marginTop: 10, textAlign: 'center', fontSize: 10, lineHeight: 14 },
  submit: {
    minHeight: 50,
    borderRadius: 14,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontSize: 12, lineHeight: 16 },
});
