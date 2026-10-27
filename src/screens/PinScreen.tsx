import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import LockKeyhole from 'lucide-react-native/icons/lock-keyhole';
import React, { useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { AppButton, AppText, AuthScaffold, HaaLogo } from '../components';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { clearAuthError, signIn } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Pin'>;

export function PinScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const { error, status } = useAppSelector(state => state.auth);
  const otpInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [otp, setOtp] = useState('');

  const continueWithOtp = async () => {
    if (status === 'loading') {
      return;
    }

    if (otp.length === 6) {
      Keyboard.dismiss();
      try {
        await dispatch(signIn({ phone: route.params.phone, otp })).unwrap();
      } catch (verificationError) {
        const message =
          typeof verificationError === 'string'
            ? verificationError
            : 'Unable to verify OTP. Please try again.';
        if (message !== 'No internet connection.') {
          Toast.show({
            type: 'error',
            text1: 'Unable to verify OTP',
            text2: message,
          });
        }
        otpInputRef.current?.focus();
      }
    } else {
      otpInputRef.current?.focus();
    }
  };

  return (
    <AuthScaffold>
      <HaaLogo />

      <View style={styles.spacerTop} />

      <View
        style={[styles.badge, { backgroundColor: theme.colors.primarySoft }]}
      >
        <AppText
          variant="caption"
          weight="700"
          color={theme.colors.primary}
          style={styles.badgeText}
        >
          OTP sent to +91 {route.params.phone.slice(0, 5)}{' '}
          {route.params.phone.slice(5)}
        </AppText>
        <LockKeyhole color={theme.colors.primary} size={13} />
      </View>

      <AppText variant="title" weight="500" style={styles.title}>
        Enter your{' '}
        <AppText
          variant="title"
          weight="500"
          color={theme.colors.primary}
          style={{ fontSize: 36 }}
        >
          OTP.
        </AppText>
      </AppText>
      <AppText variant="caption" color={theme.colors.textMuted}>
        Enter the code sent to your phone to access your bookings, orders, and
        reports.
      </AppText>

      <Pressable
        accessibilityRole="button"
        onPress={() => otpInputRef.current?.focus()}
        style={styles.pinInputArea}
      >
        <View
          accessibilityLabel={`${otp.length} of 6 OTP digits entered`}
          style={styles.pinRow}
        >
          {[0, 1, 2, 3, 4, 5].map(index => {
            const isFilled = index < otp.length;
            const isActive = index === otp.length;

            return (
              <View
                key={index}
                style={[
                  styles.pinBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor:
                      isActive || isFilled
                        ? theme.colors.primary
                        : theme.colors.border,
                    shadowColor: theme.colors.shadow,
                  },
                ]}
              >
                {isFilled ? (
                  <AppText weight="700" style={styles.otpDigit}>
                    {otp[index]}
                  </AppText>
                ) : (
                  <View
                    style={[
                      styles.pinDot,
                      { backgroundColor: theme.colors.text },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
        <TextInput
          ref={otpInputRef}
          accessibilityLabel="Six-digit OTP"
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={value => {
            dispatch(clearAuthError());
            setOtp(value.replace(/\D/g, '').slice(0, 6));
          }}
          onSubmitEditing={continueWithOtp}
          style={styles.hiddenInput}
          value={otp}
        />
      </Pressable>

      <View style={styles.pinNote}>
        <LockKeyhole color={theme.colors.textMuted} size={13} />
        <AppText variant="caption" color={theme.colors.textMuted}>
          Keep this one-time code private.
        </AppText>
      </View>

      {error ? (
        <AppText
          accessibilityRole="alert"
          color={theme.colors.danger}
          style={styles.error}
          variant="caption"
        >
          {error}
        </AppText>
      ) : null}

      <View style={styles.spacerBottom} />

      <View style={styles.actions}>
        <AppButton
          fullWidth
          icon={<ArrowRight color={theme.colors.onPrimary} size={17} />}
          iconPosition="end"
          label="Continue securely"
          loading={status === 'loading'}
          onPress={continueWithOtp}
        />
        <AppButton
          fullWidth
          icon={<ArrowLeft color={theme.colors.text} size={17} />}
          label="Back to login"
          onPress={() => navigation.replace('Login')}
          variant="secondary"
        />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  spacerTop: {
    flex: 0.25,
    minHeight: 0,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
  },
  title: {
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  pinInputArea: {
    alignSelf: 'flex-start',
  },
  pinRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  pinBox: {
    width: 44,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  pinDot: {
    width: 15,
    height: 3,
    borderRadius: 3,
  },
  otpDigit: {
    fontSize: 22,
    lineHeight: 28,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  pinNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  error: { marginTop: 12 },
  spacerBottom: {
    flex: 1,
    minHeight: 40,
  },
  actions: {
    gap: 10,
  },
});
