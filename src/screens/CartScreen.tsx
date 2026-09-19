import CircleQuestionMark from 'lucide-react-native/icons/circle-question-mark';
import ShoppingBag from 'lucide-react-native/icons/shopping-bag';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, HaaLogo } from '../components';
import { screenGradientColors, screenGradientLocations, useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

export function CartScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <LinearGradient
      colors={screenGradientColors(theme)}
      locations={screenGradientLocations}
      style={styles.safe}
    >
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.hero}>
          <View style={styles.header}>
            <HaaLogo style={styles.logo} />
            <Pressable
              onPress={() => navigation.navigate('Support')}
              style={[
                styles.helpButton,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderColor: theme.colors.border2,
                },
              ]}
            >
              <CircleQuestionMark color={theme.colors.primary} size={15} />
              <AppText
                color={theme.colors.primary}
                style={styles.helpText}
                weight="700"
              >
                Need help?
              </AppText>
            </Pressable>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logo: { width: 74, height: 40 },
  helpButton: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  helpText: { fontSize: 11, lineHeight: 14 },
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
