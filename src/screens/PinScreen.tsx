import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import LockKeyhole from 'lucide-react-native/icons/lock-keyhole';
import React, { useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';

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
  const pinInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [pin, setPin] = useState('');

  const continueWithPin = async () => {
    if (status === 'loading') {
      return;
    }

    if (pin.length === 4) {
      Keyboard.dismiss();
      try {
        await dispatch(signIn({ phone: route.params.phone, pin })).unwrap();
      } catch {
        pinInputRef.current?.focus();
      }
    } else {
      pinInputRef.current?.focus();
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
          Phone verified · +91 {route.params.phone.slice(0, 5)}{' '}
          {route.params.phone.slice(5)}
        </AppText>
        <LockKeyhole color={theme.colors.primary} size={13} />
      </View>

      <AppText variant="title" weight="800" style={styles.title}>
        Enter your{' '}
        <AppText variant="title" weight="800" color={theme.colors.primary}>
          HAA PIN.
        </AppText>
      </AppText>
      <AppText variant="caption" color={theme.colors.textMuted}>
        Your four-digit PIN keeps bookings, orders, and reports private on this
        device.
      </AppText>

      <Pressable
        accessibilityRole="button"
        onPress={() => pinInputRef.current?.focus()}
        style={styles.pinInputArea}
      >
        <View
          accessibilityLabel={`${pin.length} of 4 PIN digits entered`}
          style={styles.pinRow}
        >
          {[0, 1, 2, 3].map(index => {
            const isFilled = index < pin.length;
            const isActive = index === pin.length;

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
                  <View
                    style={[
                      styles.pinDot,
                      { backgroundColor: theme.colors.text },
                    ]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
        <TextInput
          ref={pinInputRef}
          accessibilityLabel="Four-digit HAA PIN"
          caretHidden
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={value => {
            dispatch(clearAuthError());
            setPin(value.replace(/\D/g, '').slice(0, 4));
          }}
          onSubmitEditing={continueWithPin}
          secureTextEntry
          style={styles.hiddenInput}
          value={pin}
        />
      </Pressable>

      <View style={styles.pinNote}>
        <LockKeyhole color={theme.colors.textMuted} size={13} />
        <AppText variant="caption" color={theme.colors.textMuted}>
          Your PIN is encrypted and never shown to support staff.
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
          onPress={continueWithPin}
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
    minHeight: 42,
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
    fontSize: 29,
    lineHeight: 32,
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
    width: 56,
    height: 62,
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
    width: 7,
    height: 7,
    borderRadius: 4,
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
