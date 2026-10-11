import Check from 'lucide-react-native/icons/check';
import Clock3 from 'lucide-react-native/icons/clock-3';
import Sparkles from 'lucide-react-native/icons/sparkles';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppText, HealthFlowHeader } from '../components';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'HaaPlus'>;
type Billing = 'monthly' | 'annual';

const features = [
  [
    'Continuous health trends',
    'Track the same marker across every connected lab report.',
  ],
  [
    'Personalised report context',
    'Combine results with your updated health questionnaires.',
  ],
  [
    'Smart HAA recommendations',
    'Relevant lab tests and wellness products across HAA services.',
  ],
  [
    'Reminders when context changes',
    'Know when a new report meaningfully changes a tracked pattern.',
  ],
];

const comparison = [
  ['AI report explanations', '2', 'Unlimited'],
  ['Report trend history', 'Latest', 'All'],
  ['Questionnaire context', '✓', '✓'],
  ['Smart reminders', '—', '✓'],
];

export function HaaPlusPreviewScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const heroFontSize = Math.min(24, Math.max(18, (width - 40) / 15));
  const [billing, setBilling] = useState<Billing>('monthly');
  const monthly = billing === 'monthly';

  return (
    <LinearGradient
      colors={screenGradientColors(theme)}
      locations={screenGradientLocations}
      style={styles.flex}
    >
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={styles.flex}
      >
        <HealthFlowHeader
          title="HAA Plus"
          subtitle="Connected health intelligence"
          onBack={navigation.goBack}
          close
        />

        <ScrollView
          style={{ backgroundColor: theme.colors.background }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient colors={['#06213B', '#0A3550']} style={styles.hero}>
            <View style={styles.heroOrb} />
            <View
              style={[
                styles.sparkBadge,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Sparkles color="#FFFFFF" size={17} />
            </View>
            <AppText
              color="#FFFFFF"
              style={[
                styles.heroTitle,
                { fontSize: heroFontSize, lineHeight: heroFontSize + 2 },
              ]}
              weight="800"
            >
              Your reports become more{`\n`}useful over time.
            </AppText>
            <AppText color="#BCCBD5" style={styles.heroBody}>
              Keep every HAA lab report connected, understand marker movement
              and receive relevant next-step options.
            </AppText>
            <View style={styles.billingToggle}>
              <Pressable
                onPress={() => setBilling('monthly')}
                style={[styles.billingOption, monthly && styles.billingActive]}
              >
                <AppText
                  color={monthly ? '#08233D' : '#D2DEE6'}
                  style={styles.billingText}
                  weight="700"
                >
                  Monthly
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => setBilling('annual')}
                style={[styles.billingOption, !monthly && styles.billingActive]}
              >
                <AppText
                  color={!monthly ? '#08233D' : '#D2DEE6'}
                  style={styles.billingText}
                  weight="700"
                >
                  Annual · save 37%
                </AppText>
              </Pressable>
            </View>
          </LinearGradient>

          <View
            style={[
              styles.priceCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <AppText color={theme.colors.textMuted} style={styles.priceLabel}>
              HAA Plus membership
            </AppText>
            <View style={styles.priceRow}>
              <AppText style={styles.price} weight="800">
                ₹{monthly ? '199' : '125'}
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.perMonth}>
                /month
              </AppText>
            </View>
            <View style={styles.cancelPill}>
              <AppText color="#078B76" style={styles.cancelText} weight="700">
                Cancel anytime
              </AppText>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle} weight="800">
              Included in the AI pilot
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.sectionAside}>
              No hidden features
            </AppText>
          </View>
          <View
            style={[
              styles.featuresCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            {features.map(([title, detail], index) => (
              <View
                key={title}
                style={[
                  styles.featureRow,
                  index < features.length - 1 && {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}
                >
                  {index === 3 ? (
                    <Clock3 color={theme.colors.primary} size={16} />
                  ) : (
                    <Sparkles color={theme.colors.primary} size={15} />
                  )}
                </View>
                <View style={styles.featureCopy}>
                  <AppText style={styles.featureTitle} weight="700">
                    {title}
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.featureDetail}
                  >
                    {detail}
                  </AppText>
                </View>
              </View>
            ))}
          </View>

          <AppText
            style={[styles.sectionTitle, styles.compareHeading]}
            weight="800"
          >
            Free vs HAA Plus
          </AppText>
          <View
            style={[
              styles.table,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.tableRow, styles.tableHeader]}>
              <AppText
                color={theme.colors.textMuted}
                style={styles.tableFeature}
                weight="700"
              >
                Feature
              </AppText>
              <AppText
                color={theme.colors.textMuted}
                style={styles.tableCell}
                weight="700"
              >
                Free
              </AppText>
              <AppText color="#078B76" style={styles.tableCell} weight="700">
                Plus
              </AppText>
            </View>
            {comparison.map(([feature, free, plus]) => (
              <View
                key={feature}
                style={[
                  styles.tableRow,
                  { borderTopColor: theme.colors.border },
                ]}
              >
                <AppText style={styles.tableFeature}>{feature}</AppText>
                <AppText
                  color={free === '✓' ? '#078B76' : theme.colors.text}
                  style={styles.tableCell}
                  weight="700"
                >
                  {free}
                </AppText>
                <AppText color="#078B76" style={styles.tableCell} weight="700">
                  {plus}
                </AppText>
              </View>
            ))}
          </View>
          <AppText color={theme.colors.textMuted} style={styles.finePrint}>
            HAA Plus currently includes the report-trend pilot shown above.
            Additional future benefits may vary.
          </AppText>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('HomeLanding')}
            style={[
              styles.trialButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Check color="#FFFFFF" size={14} />
            <AppText color="#FFFFFF" style={styles.trialText} weight="700">
              Start 7-day HAA Plus trial
            </AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    height: 64,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeSpacer: { width: 38 },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, lineHeight: 18 },
  headerSub: { marginTop: 1, fontSize: 8, lineHeight: 10 },
  content: { paddingBottom: 18 },
  hero: {
    minHeight: 260,
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 21,
    paddingBottom: 31,
  },
  heroOrb: {
    position: 'absolute',
    right: -62,
    top: 61,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  sparkBadge: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 24,
  },
  heroBody: {
    width: '92%',
    marginTop: 10,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
  billingToggle: {
    width: '100%',
    height: 45,
    marginTop: 18,
    borderRadius: 13,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
  },
  billingOption: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billingActive: { backgroundColor: '#FFFFFF' },
  billingText: { fontSize: 9, lineHeight: 12 },
  priceCard: {
    minHeight: 107,
    marginHorizontal: 24,
    marginTop: -13,
    borderWidth: 1,
    borderRadius: 19,
    alignItems: 'center',
    paddingTop: 17,
    paddingBottom: 17,
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  priceLabel: { fontSize: 9, lineHeight: 12 },
  priceRow: { marginTop: 3, flexDirection: 'row', alignItems: 'flex-end' },
  price: { fontSize: 30, lineHeight: 32 },
  perMonth: { marginBottom: 4, fontSize: 8, lineHeight: 10 },
  cancelPill: {
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: '#DDF7F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cancelText: { fontSize: 8, lineHeight: 10 },
  sectionHeader: {
    marginHorizontal: 24,
    marginTop: 18,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: { fontSize: 16, lineHeight: 20 },
  sectionAside: { fontSize: 9, lineHeight: 12 },
  featuresCard: {
    marginHorizontal: 24,
    borderWidth: 1,
    borderRadius: 19,
    overflow: 'hidden',
    elevation: 3,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  featureRow: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCopy: { flex: 1, marginLeft: 11 },
  featureTitle: { fontSize: 12, lineHeight: 15 },
  featureDetail: { marginTop: 3, fontSize: 9, lineHeight: 12 },
  compareHeading: { marginHorizontal: 24, marginTop: 24, marginBottom: 10 },
  table: {
    marginHorizontal: 24,
    borderWidth: 1,
    borderRadius: 19,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  tableRow: {
    minHeight: 33,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  tableHeader: { borderTopWidth: 0 },
  tableFeature: { flex: 1, fontSize: 10, lineHeight: 13 },
  tableCell: {
    width: 64,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },
  finePrint: {
    marginHorizontal: 24,
    marginTop: 15,
    fontSize: 9,
    lineHeight: 9,
  },
  footer: {
    minHeight: 76,
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  trialButton: {
    flex: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  trialText: { fontSize: 10, lineHeight: 13 },
});
