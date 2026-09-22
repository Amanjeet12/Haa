import Bookmark from 'lucide-react-native/icons/bookmark';
import Droplet from 'lucide-react-native/icons/droplet';
import Leaf from 'lucide-react-native/icons/leaf';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

type Props = NativeStackScreenProps<
  HomeStackParamList,
  'HealthRecommendations'
>;

const categories = ['Lab tests', 'Quick care', 'Global store'];
const recommendations = [
  {
    name: 'Vitamin D - 25-OH Test',
    detail: 'Afiya Healthcare · Home collection',
    reason:
      'Suggested because this marker moved down across three connected reports.',
    price: '₹699',
    icon: 'leaf',
  },
  {
    name: 'Iron Studies Profile',
    detail: 'Compare 4 verified lab partners',
    reason:
      'May add context to a haemoglobin result when a clinician considers it appropriate.',
    price: '₹899',
    icon: 'drop',
  },
] as const;

export function HealthRecommendationsScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const [activeCategory, setActiveCategory] = useState('Lab tests');

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
          title="For your health view"
          subtitle="Relevant options - Krishna"
          onBack={navigation.goBack}
          rightIcon={<Bookmark color="#078B76" size={17} />}
          onRightPress={() => navigation.navigate('HaaPlus')}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AppText
            color={theme.colors.primary}
            style={styles.eyebrow}
            weight="800"
          >
            PERSONALISED RECOMMENDATIONS
          </AppText>
          <AppText style={styles.title} weight="800">
            Useful options for{`\n`}Krishna.
          </AppText>

          <View
            style={[
              styles.whyCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <AppText style={styles.whyTitle} weight="800">
              Why you’re seeing these
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.whyBody}>
              Vitamin D is trending down, haemoglobin is slightly below range,
              and your check-in mentions lower energy. Recommendations help you
              explore—not self-diagnose or self-treat.
            </AppText>
          </View>

          <View style={styles.tabs}>
            {categories.map(category => {
              const active = category === activeCategory;
              return (
                <Pressable
                  key={category}
                  onPress={() => setActiveCategory(category)}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: active
                        ? theme.colors.text
                        : theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <AppText
                    color={
                      active ? theme.colors.surface : theme.colors.textMuted
                    }
                    style={styles.tabText}
                    weight="700"
                  >
                    {category}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <AppText style={styles.sectionTitle} weight="800">
                Recommended lab follow-up
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.sectionSub}>
                Confirm timing and suitability with a clinician, especially
                before repeating a recent test.
              </AppText>
            </View>
            <AppText color={theme.colors.textMuted} style={styles.available}>
              Available in your zone
            </AppText>
          </View>

          {recommendations.map(item => (
            <View
              key={item.name}
              style={[
                styles.recommendationCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.testIcon,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}
                >
                  {item.icon === 'leaf' ? (
                    <Leaf color="#28C58B" size={24} />
                  ) : (
                    <Droplet
                      color={theme.colors.primary}
                      fill={theme.colors.primary}
                      size={22}
                    />
                  )}
                </View>
                <View style={styles.testCopy}>
                  <AppText style={styles.testName} weight="800">
                    {item.name}
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.testDetail}
                  >
                    {item.detail}
                  </AppText>
                </View>
                <View style={styles.priceCopy}>
                  <AppText style={styles.price} weight="800">
                    {item.price}
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.priceLabel}
                  >
                    from
                  </AppText>
                </View>
              </View>
              <View
                style={[
                  styles.reasonRow,
                  { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <View style={styles.reasonDiamond} />
                <AppText color={theme.colors.textMuted} style={styles.reason}>
                  {item.reason}
                </AppText>
              </View>
              <View
                style={[
                  styles.cardActions,
                  { borderTopColor: theme.colors.border },
                ]}
              >
                <Pressable
                  style={[
                    styles.primaryAction,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <AppText
                    color="#FFFFFF"
                    style={styles.actionText}
                    weight="700"
                  >
                    {item.icon === 'leaf' ? 'View labs' : 'Compare labs'}
                  </AppText>
                </Pressable>
                <Pressable
                  style={[
                    styles.saveAction,
                    { borderColor: theme.colors.primary },
                  ]}
                >
                  <AppText
                    color={theme.colors.primary}
                    style={styles.actionText}
                    weight="700"
                  >
                    Save
                  </AppText>
                </Pressable>
              </View>
            </View>
          ))}
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
          <View>
            <AppText
              color={theme.colors.textMuted}
              style={styles.footerEyebrow}
            >
              Recommendations selected
            </AppText>
            <AppText style={styles.footerTitle} weight="800">
              From reports + check-in
            </AppText>
          </View>
          <Pressable
            onPress={() => navigation.navigate('HaaPlus')}
            style={[
              styles.backButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <AppText color="#FFFFFF" style={styles.backText} weight="700">
              Back to trends
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniBrand: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 14, lineHeight: 17 },
  headerSub: { marginTop: 1, fontSize: 8, lineHeight: 10 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 22 },
  eyebrow: { fontSize: 9, lineHeight: 12, letterSpacing: 0.65 },
  title: { marginTop: 7, fontSize: 23, lineHeight: 23, letterSpacing: -0.7 },
  whyCard: {
    marginTop: 16,
    minHeight: 101,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 15,
    elevation: 3,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  whyTitle: { fontSize: 12, lineHeight: 15 },
  whyBody: { marginTop: 7, fontSize: 10, lineHeight: 15 },
  tabs: { flexDirection: 'row', gap: 7, marginTop: 20 },
  tab: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontSize: 10, lineHeight: 13 },
  sectionHeader: { marginTop: 19, marginBottom: 9, paddingRight: 2 },
  sectionTitle: { fontSize: 15, lineHeight: 19 },
  sectionSub: { width: '78%', marginTop: 5, fontSize: 9, lineHeight: 13 },
  available: {
    position: 'absolute',
    top: 3,
    right: 0,
    fontSize: 8,
    lineHeight: 10,
  },
  recommendationCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTop: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  testIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testCopy: { flex: 1, marginLeft: 12 },
  testName: { fontSize: 12, lineHeight: 15 },
  testDetail: { marginTop: 4, fontSize: 9, lineHeight: 12 },
  priceCopy: { alignItems: 'flex-end' },
  price: { fontSize: 14, lineHeight: 17 },
  priceLabel: { marginTop: 2, fontSize: 9, lineHeight: 11 },
  reasonRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  reasonDiamond: {
    width: 6,
    height: 6,
    marginTop: 3,
    marginRight: 7,
    backgroundColor: '#28C58B',
    transform: [{ rotate: '45deg' }],
  },
  reason: { flex: 1, fontSize: 9, lineHeight: 13 },
  cardActions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 11,
    flexDirection: 'row',
    gap: 9,
  },
  primaryAction: {
    flex: 1,
    height: 47,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAction: {
    flex: 1,
    height: 47,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: 10, lineHeight: 13 },
  footer: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerEyebrow: { fontSize: 8, lineHeight: 10 },
  footerTitle: { marginTop: 2, fontSize: 12, lineHeight: 15 },
  backButton: {
    height: 47,
    borderRadius: 14,
    paddingHorizontal: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 9, lineHeight: 12 },
});
