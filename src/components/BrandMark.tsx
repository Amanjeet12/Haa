import HeartPulse from 'lucide-react-native/icons/heart-pulse';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '../theme';

export function BrandMark() {
  const { theme } = useAppTheme();

  return (
    <View
      accessibilityLabel="Haa Health"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.primarySoft,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <HeartPulse color={theme.colors.primary} size={30} strokeWidth={2.25} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
