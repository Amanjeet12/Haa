import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Sparkles from 'lucide-react-native/icons/sparkles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AiAnalysisQuestion,
  getAiAnalysisQuestions,
} from '../api/aiAnalysisQuestions';
import { AppText, HealthFlowHeader } from '../components';
import { useAppSelector } from '../store';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'HealthCheckIn'>;
type Answer = string | string[];

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

export function HealthContextScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const [questions, setQuestions] = useState<AiAnalysisQuestion[]>([]);
  const [responses, setResponses] = useState<Record<number, Answer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const questionOffsets = useRef<Record<number, number>>({});
  const focusedQuestionId = useRef<number | null>(null);
  const reportCount =
    route.params.reportCount ?? 1 + route.params.outsideReports.length;

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
      setTimeout(() => {
        const id = focusedQuestionId.current;
        if (id !== null) {
          scrollRef.current?.scrollTo({
            y: Math.max(0, (questionOffsets.current[id] ?? 0) - 24),
            animated: true,
          });
        }
      }, 120);
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      focusedQuestionId.current = null;
    });
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  const loadQuestions = useCallback(async () => {
    if (!token) {
      setError('Log in to answer the health questions.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setQuestions(await getAiAnalysisQuestions(token));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load questions.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const setOption = (question: AiAnalysisQuestion, option: string) => {
    const id = question.ai_analysis_question_id;
    setResponses(current => {
      if (question.question_type === 'single_choice') {
        return { ...current, [id]: current[id] === option ? '' : option };
      }
      const selected = Array.isArray(current[id])
        ? (current[id] as string[])
        : [];
      // "None" is exclusive to symptom selections.
      if (option.toLowerCase() === 'none')
        return { ...current, [id]: selected.includes(option) ? [] : [option] };
      const next = selected.filter(value => value.toLowerCase() !== 'none');
      return {
        ...current,
        [id]: next.includes(option)
          ? next.filter(value => value !== option)
          : [...next, option],
      };
    });
  };

  const answers = questions
    .filter(question => {
      const answer = responses[question.ai_analysis_question_id];
      return Array.isArray(answer)
        ? answer.length > 0
        : Boolean(answer?.trim());
    })
    .map(question => ({
      ai_analysis_question_id: question.ai_analysis_question_id,
      answer: responses[question.ai_analysis_question_id],
    }));
  const missingRequired = questions.some(question => {
    if (!question.isRequired) return false;
    const answer = responses[question.ai_analysis_question_id];
    return Array.isArray(answer) ? answer.length === 0 : !answer?.trim();
  });
  const canAnalyze = !loading && !error && !missingRequired;

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
          title="HAA Health View"
          subtitle="AI pilot"
          onBack={navigation.goBack}
        />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.content,
              keyboardVisible && {
                paddingBottom: Math.max(220, keyboardHeight) + 32,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              const id = focusedQuestionId.current;
              if (keyboardVisible && id !== null) {
                scrollRef.current?.scrollTo({
                  y: Math.max(0, (questionOffsets.current[id] ?? 0) - 24),
                  animated: true,
                });
              }
            }}
          >
            <View style={styles.stepRow}>
              <AppText color={theme.colors.textMuted} style={styles.stepText}>
                STEP 3 OF 3
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.stepText}>
                Context
              </AppText>
            </View>
            <View style={styles.progressRow}>
              {[0, 1, 2].map(index => (
                <View
                  key={index}
                  style={[
                    styles.progress,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
              ))}
            </View>
            <AppText style={styles.heroTitle} weight="800">
              A little context helps.
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.heroSubtitle}>
              A quick check-in helps put your results in context. Optional
              answers can be left blank.
            </AppText>
            <View
              style={[
                styles.reportBanner,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <View style={styles.bannerCopy}>
                <AppText style={styles.bannerTitle} weight="800">
                  {route.params.memberName ?? 'Selected profile'} ·{' '}
                  {reportCount} {reportCount === 1 ? 'report' : 'reports'}
                </AppText>
                {route.params.reportDate ? (
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.bannerDate}
                  >
                    {formatDate(route.params.reportDate)}
                  </AppText>
                ) : null}
              </View>
              <Pressable accessibilityRole="button" onPress={navigation.goBack}>
                <AppText
                  color={theme.colors.primary}
                  style={styles.editText}
                  weight="700"
                >
                  Edit
                </AppText>
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator
                color={theme.colors.primary}
                style={styles.state}
              />
            ) : null}
            {error ? (
              <Pressable onPress={loadQuestions} style={styles.state}>
                <AppText color={theme.colors.primary}>
                  {error} Tap to retry.
                </AppText>
              </Pressable>
            ) : null}
            {!loading && !error && !questions.length ? (
              <AppText color={theme.colors.textMuted} style={styles.state}>
                No check-in questions are available. You can continue without
                answers.
              </AppText>
            ) : null}

            {questions.map(question => {
              const id = question.ai_analysis_question_id;
              const answer = responses[id];
              return (
                <View
                  key={id}
                  style={styles.questionBlock}
                  onLayout={event => {
                    questionOffsets.current[id] = event.nativeEvent.layout.y;
                  }}
                >
                  <View style={styles.questionHeading}>
                    <AppText style={styles.questionTitle} weight="800">
                      {question.question}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.questionHint}
                    >
                      {question.isRequired
                        ? 'Required'
                        : question.question_type === 'multiple_choice'
                        ? 'Optional · select all that apply'
                        : 'Optional'}
                    </AppText>
                  </View>
                  {question.question_type === 'text' ? (
                    <TextInput
                      accessibilityLabel={question.question}
                      multiline
                      placeholder="Current medicines, recent illness, or other context"
                      placeholderTextColor={theme.colors.textMuted}
                      value={typeof answer === 'string' ? answer : ''}
                      onChangeText={value =>
                        setResponses(current => ({ ...current, [id]: value }))
                      }
                      onFocus={() => {
                        focusedQuestionId.current = id;
                        scrollRef.current?.scrollTo({
                          y: Math.max(
                            0,
                            (questionOffsets.current[id] ?? 0) - 24,
                          ),
                          animated: true,
                        });
                      }}
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          color: theme.colors.text,
                        },
                      ]}
                      textAlignVertical="top"
                    />
                  ) : (
                    <View style={styles.chips}>
                      {question.options.map(option => {
                        const selected = Array.isArray(answer)
                          ? answer.includes(option)
                          : answer === option;
                        return (
                          <Pressable
                            key={option}
                            accessibilityRole={
                              question.question_type === 'multiple_choice'
                                ? 'checkbox'
                                : 'radio'
                            }
                            accessibilityState={{ checked: selected }}
                            onPress={() => setOption(question, option)}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: selected
                                  ? '#031B34'
                                  : theme.colors.surface,
                                borderColor: selected
                                  ? '#031B34'
                                  : theme.colors.border,
                              },
                            ]}
                          >
                            <AppText
                              color={selected ? '#FFFFFF' : theme.colors.text}
                              style={styles.chipText}
                              weight={selected ? '700' : '500'}
                            >
                              {option}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
            <View style={styles.disclaimer}>
              <Sparkles color={theme.colors.success} size={13} />
              <AppText
                color={theme.colors.textMuted}
                style={styles.disclaimerText}
              >
                Confirm these reports belong to{' '}
                {route.params.memberName ?? 'the selected profile'} before
                continuing. AI explanations support a conversation with your
                clinician.
              </AppText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        {!keyboardVisible ? (
          <View
            style={[
              styles.footer,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.footerCopy}>
              <AppText
                color={theme.colors.textMuted}
                style={styles.footerLabel}
              >
                Ready when you are
              </AppText>
              <AppText style={styles.footerCount} weight="800">
                {reportCount} {reportCount === 1 ? 'report' : 'reports'}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canAnalyze }}
              disabled={!canAnalyze}
              onPress={() =>
                navigation.navigate('HealthTrends', {
                  ...route.params,
                  answers,
                })
              }
              style={[
                styles.analyzeButton,
                {
                  backgroundColor: !canAnalyze
                    ? theme.colors.textMuted
                    : theme.colors.primary,
                },
              ]}
            >
              <AppText color="#FFFFFF" style={styles.analyzeText} weight="800">
                Analyze reports
              </AppText>
              <ArrowRight color="#FFFFFF" size={16} />
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 26, paddingTop: 22, paddingBottom: 30 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepText: { fontSize: 11, lineHeight: 15 },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  progress: { flex: 1, height: 4, borderRadius: 3 },
  heroTitle: {
    marginTop: 24,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.8,
  },
  heroSubtitle: { marginTop: 10, fontSize: 13, lineHeight: 21 },
  reportBanner: {
    minHeight: 70,
    borderRadius: 14,
    marginTop: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerCopy: { flex: 1, minWidth: 0 },
  bannerTitle: { fontSize: 13, lineHeight: 18 },
  bannerDate: { fontSize: 11, lineHeight: 15, marginTop: 4 },
  editText: { fontSize: 12 },
  state: { alignSelf: 'center', marginTop: 25 },
  questionBlock: { marginTop: 27 },
  questionHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 4,
  },
  questionTitle: { fontSize: 13, lineHeight: 18 },
  questionHint: { fontSize: 11, lineHeight: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  chip: {
    minHeight: 41,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 11, lineHeight: 15 },
  textInput: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 24,
  },
  disclaimerText: { flex: 1, fontSize: 10, lineHeight: 16 },
  footer: {
    minHeight: 80,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerCopy: { flex: 1, minWidth: 0 },
  footerLabel: { fontSize: 10, lineHeight: 14 },
  footerCount: { fontSize: 14, lineHeight: 19, marginTop: 3 },
  analyzeButton: {
    minHeight: 51,
    borderRadius: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyzeText: { fontSize: 12 },
});
