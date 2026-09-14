import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import LockKeyhole from 'lucide-react-native/icons/lock-keyhole';
import ShoppingBag from 'lucide-react-native/icons/shopping-bag';
import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton, AppText, AuthScaffold, HaaLogo } from '../components';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  return digits.length > 5
    ? `${digits.slice(0, 5)} ${digits.slice(5)}`
    : digits;
}

export function LoginScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const phoneInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [phone, setPhone] = useState('');
  const phoneDigits = phone.replace(/\D/g, '');
  const isValid = phoneDigits.length === 10;

  const continueSecurely = () => {
    if (isValid) {
      navigation.navigate('Pin', { phone: phoneDigits });
    } else {
      phoneInputRef.current?.focus();
    }
  };

  return (
    <AuthScaffold>
      <HaaLogo />

      <View style={styles.spacerTop} />

      <View style={styles.form}>
        <View
          style={[styles.badge, { backgroundColor: theme.colors.primarySoft }]}
        >
          <ShoppingBag color={theme.colors.primary} size={14} />
          <AppText
            variant="caption"
            weight="700"
            color={theme.colors.primary}
            style={styles.badgeText}
          >
            Confirming your lab booking
          </AppText>
        </View>

        <AppText variant="title" weight="800" style={styles.title}>
          Your care, kept{`\n`}
          <AppText variant="title" weight="800" color={theme.colors.primary}>
            securely yours.
          </AppText>
        </AppText>
        <AppText variant="caption" color={theme.colors.textMuted}>
          Enter your phone number to book, pay, and receive private reports.
          Browsing never requires an account.
        </AppText>

        <View
          style={[
            styles.phoneField,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <AppText style={styles.flag}>🇮🇳</AppText>
          <AppText weight="700">+91</AppText>
          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />
          <TextInput
            ref={phoneInputRef}
            accessibilityLabel="Phone number"
            autoComplete="tel"
            keyboardType="phone-pad"
            maxLength={11}
            onChangeText={value => setPhone(formatPhoneNumber(value))}
            onSubmitEditing={continueSecurely}
            placeholder="Enter phone number"
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="done"
            selectionColor={theme.colors.primary}
            style={[
              styles.phoneInput,
              {
                color: theme.colors.text,
                fontFamily: phone
                  ? theme.typography.fontFamily.semibold
                  : theme.typography.fontFamily.regular,
              },
            ]}
            value={phone}
          />
        </View>

        <View style={styles.privacyNote}>
          <LockKeyhole color={theme.colors.textMuted} size={13} />
          <AppText variant="caption" color={theme.colors.textMuted}>
            We only verify this number before asking for your four-digit HAA
            PIN.
          </AppText>
        </View>
      </View>

      <View style={styles.spacerBottom} />

      <View style={styles.actions}>
        <AppButton
          fullWidth
          icon={<ArrowRight color={theme.colors.onPrimary} size={17} />}
          iconPosition="end"
          label="Continue securely"
          onPress={continueSecurely}
        />
        <AppButton
          fullWidth
          label="Keep browsing as guest"
          onPress={() => navigation.replace('Home')}
          variant="secondary"
        />
        <AppText
          variant="caption"
          color={theme.colors.textMuted}
          style={styles.legal}
        >
          By continuing, you agree to HAA Health’s Terms and Privacy Policy.
        </AppText>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  spacerTop: {
    flex: 0.32,
    minHeight: 46,
  },
  form: {
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
  },
  title: {
    fontSize: 29,
    lineHeight: 32,
    letterSpacing: -1.2,
  },
  phoneField: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 15,
    paddingHorizontal: 14,
    marginTop: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  flag: {
    fontSize: 18,
    marginRight: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spacerBottom: {
    flex: 1,
    minHeight: 50,
  },
  actions: {
    gap: 10,
  },
  legal: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
});
