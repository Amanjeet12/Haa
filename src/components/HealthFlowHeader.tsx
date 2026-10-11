import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Sparkles from 'lucide-react-native/icons/sparkles';
import X from 'lucide-react-native/icons/x';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../theme';
import { AppText } from './AppText';

type HealthFlowHeaderProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
  close?: boolean;
  backgroundColor?: string;
};

export function HealthFlowHeader({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  close = false,
  backgroundColor,
}: HealthFlowHeaderProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: backgroundColor ?? 'transparent',
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <Pressable
        accessibilityLabel={close ? 'Close' : 'Go back'}
        accessibilityRole="button"
        onPress={onBack}
        style={[styles.control, { backgroundColor: theme.colors.surface }]}
      >
        {close ? (
          <X color={theme.colors.text} size={19} />
        ) : (
          <ArrowLeft color={theme.colors.text} size={19} />
        )}
      </Pressable>

      <View style={styles.center}>
        <View style={styles.titleRow}>
          <View
            style={[styles.brand, { backgroundColor: theme.colors.primary }]}
          >
            <Sparkles color="#FFFFFF" size={12} />
          </View>
          <AppText style={styles.title} weight="800">
            {title}
          </AppText>
        </View>
        <AppText color={theme.colors.textMuted} style={styles.subtitle}>
          {subtitle}
        </AppText>
      </View>

      {rightIcon && onRightPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRightPress}
          style={[styles.control, { backgroundColor: theme.colors.surface }]}
        >
          {rightIcon}
        </Pressable>
      ) : rightIcon ? (
        <View
          style={[styles.control, { backgroundColor: theme.colors.surface }]}
        >
          {rightIcon}
        </View>
      ) : (
        <View style={styles.controlSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  control: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  controlSpacer: { width: 40, height: 40 },
  center: { flex: 1, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brand: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, lineHeight: 19 },
  subtitle: { marginTop: 2, fontSize: 9, lineHeight: 11 },
});
