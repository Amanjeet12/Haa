import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
} from 'react-native';

import { useAppTheme } from '../theme';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type AppButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  iconPosition?: 'start' | 'end';
};

export function AppButton({
  label,
  variant = 'primary',
  icon,
  loading = false,
  fullWidth = false,
  iconPosition = 'start',
  disabled,
  ...props
}: AppButtonProps) {
  const { theme } = useAppTheme();
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const contentColor = isPrimary
    ? theme.colors.onPrimary
    : isGhost
    ? theme.colors.primary
    : theme.colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      {...props}
      style={({ pressed }) => [
        styles.base,
        {
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          backgroundColor: isGhost
            ? 'transparent'
            : isPrimary
            ? pressed
              ? theme.colors.primaryPressed
              : theme.colors.primary
            : theme.colors.surface,
          borderColor:
            isPrimary || isGhost ? 'transparent' : theme.colors.border,
          opacity: disabled ? 0.5 : 1,
          shadowColor: isPrimary ? theme.colors.primary : theme.colors.shadow,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <View style={styles.content}>
          {iconPosition === 'start' ? icon : null}
          <AppText weight="800" color={contentColor} style={{ fontSize: 13 }}>
            {label}
          </AppText>
          {iconPosition === 'end' ? icon : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 9,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
