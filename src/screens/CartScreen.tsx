import ShoppingBag from 'lucide-react-native/icons/shopping-bag';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, BottomTabHeader } from '../components';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';

export function CartScreen() {
  const { theme } = useAppTheme();
  return (
    <LinearGradient
      colors={screenGradientColors(theme)}
      locations={screenGradientLocations}
      style={styles.safe}
    >
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.hero}>
          <BottomTabHeader />
          <AppText
            color={theme.colors.primary}
            style={styles.eyebrow}
            weight="800"
          >
            — READY WHEN YOU ARE
          </AppText>
          <AppText style={styles.title} weight="500">
            Your{' '}
            <AppText
              color={theme.colors.primary}
              style={styles.title}
              weight="500"
            >
              cart.
            </AppText>
          </AppText>
        </View>

        <View style={styles.empty}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: theme.colors.primarySoft },
            ]}
          >
            <ShoppingBag color={theme.colors.primary} size={25} />
          </View>
          <AppText style={styles.emptyTitle} weight="700">
            Your cart is empty
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.emptyText}>
            E-commerce items you add will appear here.
          </AppText>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 18 },
  eyebrow: { fontSize: 9, lineHeight: 12, letterSpacing: 0.8, marginBottom: 4 },
  title: { fontSize: 25, lineHeight: 29, letterSpacing: -0.8 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 15, lineHeight: 20 },
  emptyText: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
});
