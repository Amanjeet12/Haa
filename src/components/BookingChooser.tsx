import FlaskConical from 'lucide-react-native/icons/flask-conical';
import List from 'lucide-react-native/icons/list';
import Search from 'lucide-react-native/icons/search';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../theme';
import { AppText } from './AppText';

type Props = {
  onIndividualTests: () => void;
  onHealthPackages: () => void;
  onFindLab: () => void;
};

export function BookingChooser({
  onIndividualTests,
  onHealthPackages,
  onFindLab,
}: Props) {
  const { theme } = useAppTheme();
  const options = [
    {
      label: 'Individual\ntests',
      accessibilityLabel: 'Browse individual tests',
      icon: <FlaskConical color={theme.colors.primary} size={17} />,
      background: theme.isDark ? theme.colors.primarySoft : '#FDE7EA',
      onPress: onIndividualTests,
    },
    {
      label: 'Health\npackages',
      accessibilityLabel: 'Browse health packages',
      icon: <List color={theme.isDark ? '#91B9F0' : '#2162A0'} size={18} />,
      background: theme.isDark ? theme.colors.surfaceMuted : '#E8F1FC',
      onPress: onHealthPackages,
    },
    {
      label: 'Find a\nlab',
      accessibilityLabel: 'Find a lab',
      icon: <Search color={theme.colors.success} size={18} />,
      background: theme.isDark ? theme.colors.surfaceMuted : '#E1F5EE',
      onPress: onFindLab,
    },
  ];

  return (
    <View style={styles.section}>
      <AppText style={styles.heading} weight="700">
        What would you like to book?
      </AppText>
      <AppText color={theme.colors.textMuted} style={styles.subtitle}>
        Start with a test, package or lab.
      </AppText>
      <View style={styles.row}>
        {options.map(option => (
          <Pressable
            key={option.accessibilityLabel}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel}
            onPress={option.onPress}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: option.background }]}>
              {option.icon}
            </View>
            <AppText style={styles.label} weight="700">
              {option.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  heading: { fontSize: 19, lineHeight: 23, letterSpacing: -0.5 },
  subtitle: { marginTop: 3, fontSize: 11, lineHeight: 15 },
  row: { flexDirection: 'row', gap: 10, marginTop: 13 },
  card: {
    flex: 1,
    minHeight: 108,
    borderRadius: 19,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, lineHeight: 15 },
});
