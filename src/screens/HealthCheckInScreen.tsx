import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Check from 'lucide-react-native/icons/check';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Info from 'lucide-react-native/icons/info';
import LockKeyhole from 'lucide-react-native/icons/lock-keyhole';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Sparkles from 'lucide-react-native/icons/sparkles';
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

type Props = NativeStackScreenProps<HomeStackParamList, 'HealthCheckIn'>;

const answers = [
  {
    id: 'usual',
    icon: '☀️',
    title: 'About the same as usual',
    detail: 'No noticeable difference',
  },
  {
    id: 'lower',
    icon: '🌤️',
    title: 'A little lower than usual',
    detail: 'I feel tired more often',
  },
  {
    id: 'lower_most',
    icon: '↓',
    title: 'Much lower than usual',
    detail: 'It regularly affects my day',
  },
  {
    id: 'unsure',
    icon: '?',
    title: "I'm not sure",
    detail: 'It changes from day to day',
  },
];

const symptoms = [
  'Tiredness',
  'Muscle aches',
  'Low mood',
  'Poor sleep',
  'Breathlessness',
  'None of these',
];

export function HealthCheckInScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const [answer, setAnswer] = useState('lower');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Tiredness',
  ]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(current =>
      current.includes(symptom)
        ? current.filter(item => item !== symptom)
        : [...current.filter(item => item !== 'None of these'), symptom],
    );
  };

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
          title="Health check-in"
          subtitle="About 60 seconds - Krishna"
          onBack={navigation.goBack}
          rightIcon={<LockKeyhole color="#078B76" size={17} />}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressLabels}>
            <AppText color={theme.colors.textMuted} style={styles.progressText}>
              Questionnaire
            </AppText>
            <AppText
              color={theme.colors.textMuted}
              style={styles.progressText}
              weight="700"
            >
              2 of 4
            </AppText>
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: theme.colors.primarySoft },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          </View>

          <AppText
            color={theme.colors.primary}
            style={styles.eyebrow}
            weight="800"
          >
            ENERGY AND DAILY LIFE
          </AppText>
          <AppText style={styles.title} weight="800">
            Over the last two weeks, how has your energy felt?
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            Choose the closest answer. This adds context to your reports—it does
            not diagnose a cause.
          </AppText>

          <View style={styles.answers}>
            {answers.map(item => {
              const selected = answer === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setAnswer(item.id)}
                  style={[
                    styles.answerCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.answerIcon,
                      {
                        backgroundColor: selected
                          ? theme.colors.primarySoft
                          : theme.colors.surfaceMuted,
                      },
                    ]}
                  >
                    <AppText style={styles.answerEmoji}>{item.icon}</AppText>
                  </View>
                  <View style={styles.answerCopy}>
                    <AppText style={styles.answerTitle} weight="700">
                      {item.title}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.answerDetail}
                    >
                      {item.detail}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: selected
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                      selected && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    {selected ? (
                      <Check color="#FFFFFF" size={10} />
                    ) : (
                      <ChevronRight color={theme.colors.textMuted} size={11} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <AppText style={styles.symptomHeading} weight="700">
            Have you noticed any of these?
          </AppText>
          <View style={styles.chips}>
            {symptoms.map(symptom => {
              const selected = selectedSymptoms.includes(symptom);
              return (
                <Pressable
                  key={symptom}
                  onPress={() => toggleSymptom(symptom)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected
                        ? theme.colors.primarySoft
                        : theme.colors.surface,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  <AppText
                    color={selected ? theme.colors.primary : theme.colors.text}
                    style={styles.chipText}
                    weight="700"
                  >
                    {symptom}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

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
            <View style={styles.whyTitleRow}>
              <Info color={theme.colors.text} size={15} />
              <AppText style={styles.whyTitle} weight="800">
                Why HAA asks this
              </AppText>
            </View>
            <AppText color={theme.colors.textMuted} style={styles.whyBody}>
              Your latest report includes Vitamin D and haemoglobin results.
              Your answer helps HAA explain what is worth discussing without
              assuming the result caused a symptom.
            </AppText>
          </View>
          <View style={styles.saveNote}>
            <ShieldCheck color="#078B76" size={13} />
            <AppText color={theme.colors.textMuted} style={styles.saveText}>
              You control your questionnaire answers and can update them
              anytime.
            </AppText>
          </View>
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
            onPress={navigation.goBack}
            style={[styles.backButton, { borderColor: theme.colors.border }]}
          >
            <AppText
              color={theme.colors.primary}
              style={styles.backText}
              weight="700"
            >
              Back
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('HealthTrends')}
            style={[
              styles.buildButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Sparkles color="#FFFFFF" size={14} />
            <AppText color="#FFFFFF" style={styles.buildText} weight="700">
              Build my health view
            </AppText>
            <ArrowRight color="#FFFFFF" size={14} />
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
  headerCopy: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, lineHeight: 19 },
  headerSub: { marginTop: 2, fontSize: 9, lineHeight: 11 },
  content: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 22 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 8, lineHeight: 11 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 7,
    overflow: 'hidden',
  },
  progressFill: { width: '50%', height: '100%', borderRadius: 2 },
  eyebrow: { marginTop: 19, fontSize: 9, lineHeight: 12, letterSpacing: 0.6 },
  title: { marginTop: 6, fontSize: 22, lineHeight: 24, letterSpacing: -0.6 },
  subtitle: { marginTop: 8, fontSize: 9, lineHeight: 13 },
  answers: { gap: 8, marginTop: 15 },
  answerCard: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  answerIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerEmoji: { fontSize: 13, lineHeight: 17 },
  answerCopy: { flex: 1, marginLeft: 10 },
  answerTitle: { fontSize: 11, lineHeight: 13 },
  answerDetail: { marginTop: 2, fontSize: 9, lineHeight: 11 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomHeading: { marginTop: 18, fontSize: 11, lineHeight: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  chip: {
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  chipText: { fontSize: 8, lineHeight: 10 },
  whyCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 13,
    padding: 13,
    elevation: 2,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  whyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  whyTitle: { fontSize: 11, lineHeight: 13 },
  whyBody: { marginTop: 7, fontSize: 9, lineHeight: 12 },
  saveNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 3,
  },
  saveText: { flex: 1, fontSize: 9, lineHeight: 12 },
  footer: {
    minHeight: 76,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 9,
  },
  backButton: {
    width: 52,
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 9, lineHeight: 12 },
  buildButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buildText: { fontSize: 10, lineHeight: 13 },
});
