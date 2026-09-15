import Check from 'lucide-react-native/icons/check';
import Moon from 'lucide-react-native/icons/moon';
import LogOut from 'lucide-react-native/icons/log-out';
import Smartphone from 'lucide-react-native/icons/smartphone';
import Sun from 'lucide-react-native/icons/sun';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '../components';
import { ThemePreference, useAppTheme } from '../theme';
import { AppButton } from '../components';
import { signOut } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store';

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  description: string;
  icon: (color: string) => ReactNode;
}> = [
  {
    value: 'system',
    label: 'Use device setting',
    description: 'Automatically match your phone appearance.',
    icon: color => <Smartphone color={color} size={22} />,
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Always use the light appearance.',
    icon: color => <Sun color={color} size={22} />,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Always use the dark appearance.',
    icon: color => <Moon color={color} size={22} />,
  },
];

export function SettingsScreen() {
  const { theme, preference, setPreference } = useAppTheme();
  const dispatch = useAppDispatch();
  const { session, status } = useAppSelector(state => state.auth);

  return (
    <Screen>
      <AppText variant="title" weight="800">
        Appearance
      </AppText>
      <AppText color={theme.colors.textMuted} style={styles.description}>
        Choose how Haa Health looks on this device.
      </AppText>

      <Card style={styles.optionsCard}>
        {themeOptions.map((option, index) => {
          const selected = preference === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setPreference(option.value)}
              style={({ pressed }) => [
                styles.option,
                index > 0 && {
                  borderTopColor: theme.colors.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                {option.icon(theme.colors.primary)}
              </View>
              <View style={styles.optionCopy}>
                <AppText weight="700">{option.label}</AppText>
                <AppText variant="caption" color={theme.colors.textMuted}>
                  {option.description}
                </AppText>
              </View>
              {selected ? (
                <Check color={theme.colors.primary} size={22} strokeWidth={3} />
              ) : null}
            </Pressable>
          );
        })}
      </Card>

      {session ? (
        <View style={styles.accountSection}>
          <AppText variant="subtitle" weight="800">
            Account
          </AppText>
          <AppText
            color={theme.colors.textMuted}
            style={styles.accountDescription}
          >
            Signed in as {session.customer.name} · {session.customer.phone}
          </AppText>
          <AppButton
            fullWidth
            icon={<LogOut color={theme.colors.onPrimary} size={18} />}
            label="Log out"
            loading={status === 'loading'}
            onPress={() => dispatch(signOut())}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  description: {
    marginTop: 4,
    marginBottom: 20,
  },
  optionsCard: {
    paddingVertical: 0,
  },
  option: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
  },
  accountSection: { marginTop: 28 },
  accountDescription: { marginTop: 4, marginBottom: 14 },
});
