import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Check from 'lucide-react-native/icons/check';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Info from 'lucide-react-native/icons/info';
import LockKeyhole from 'lucide-react-native/icons/lock-keyhole';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Sparkles from 'lucide-react-native/icons/sparkles';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppText, HealthFlowHeader } from '../components';
import {
  AiAnalysisQuestion,
  getAiAnalysisQuestions,
} from '../api/aiAnalysisQuestions';
import { useAppSelector } from '../store';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'HealthCheckIn'>;

type Answer = string | string[];

function isAnswered(answer?: Answer) {
  return Array.isArray(answer) ? answer.length > 0 : Boolean(answer?.trim());
}

export function HealthCheckInScreen({ navigation, route }: Props) {
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

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardVisible(true);
      setKeyboardHeight(Math.max(220, event.endCoordinates.height));
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

  const scrollToQuestion = (id: number) => {
    focusedQuestionId.current = id;
    scrollRef.current?.scrollTo({
      y: Math.max(0, (questionOffsets.current[id] ?? 0) - 12),
      animated: true,
    });
  };

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

  const selectOption = (question: AiAnalysisQuestion, option: string) => {
    setResponses(current => {
      const id = question.ai_analysis_question_id;
      if (question.question_type === 'single_choice')
        return { ...current, [id]: option };
      const selected = Array.isArray(current[id])
        ? (current[id] as string[])
        : [];
      return {
        ...current,
        [id]: selected.includes(option)
          ? selected.filter(value => value !== option)
          : [...selected, option],
      };
    });
  };

  const answeredCount = questions.filter(question =>
    isAnswered(responses[question.ai_analysis_question_id]),
  ).length;
  const canContinue =
    questions.length > 0 &&
    questions.every(question =>
      isAnswered(responses[question.ai_analysis_question_id]),
    );

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

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.content,
              keyboardVisible && { paddingBottom: keyboardHeight + 32 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              if (focusedQuestionId.current !== null && keyboardVisible) {
                scrollToQuestion(focusedQuestionId.current);
              }
            }}
          >
            <View style={styles.progressLabels}>
              <AppText
                color={theme.colors.textMuted}
                style={styles.progressText}
              >
                Questionnaire
              </AppText>
              <AppText
                color={theme.colors.textMuted}
                style={styles.progressText}
                weight="700"
              >
                {answeredCount} of {questions.length}
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
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${
                      questions.length
                        ? (answeredCount / questions.length) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>

            <AppText
              color={theme.colors.primary}
              style={styles.eyebrow}
              weight="800"
            >
              YOUR HEALTH CONTEXT
            </AppText>
            <AppText style={styles.title} weight="800">
              Tell us how you've been feeling
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.subtitle}>
              Your answers add context to your reports. They do not diagnose a
              cause.
            </AppText>

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
                No health questions are available yet.
              </AppText>
            ) : null}

            {questions.map((question, index) => {
              const answer = responses[question.ai_analysis_question_id];
              return (
                <View
                  key={question.ai_analysis_question_id}
                  style={styles.questionBlock}
                  onLayout={event => {
                    questionOffsets.current[question.ai_analysis_question_id] =
                      event.nativeEvent.layout.y;
                  }}
                >
                  <View style={styles.questionTop}>
                    <AppText
                      color={theme.colors.primary}
                      style={styles.questionNumber}
                      weight="800"
                    >
                      QUESTION {index + 1}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.optional}
                    >
                      Answer to continue
                    </AppText>
                  </View>
                  <AppText style={styles.questionTitle} weight="800">
                    {question.question}
                  </AppText>
                  {question.question_type === 'single_choice' ? (
                    <View style={styles.answers}>
                      {question.options.map(option => {
                        const selected = answer === option;
                        return (
                          <Pressable
                            key={option}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected }}
                            onPress={() => selectOption(question, option)}
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
                            <View style={styles.answerCopy}>
                              <AppText style={styles.answerTitle} weight="700">
                                {option}
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
                                selected && {
                                  backgroundColor: theme.colors.primary,
                                },
                              ]}
                            >
                              {selected ? (
                                <Check color="#FFFFFF" size={10} />
                              ) : (
                                <ChevronRight
                                  color={theme.colors.textMuted}
                                  size={11}
                                />
                              )}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                  {question.question_type === 'multiple_choice' ? (
                    <View style={styles.chips}>
                      {question.options.map(option => {
                        const selected =
                          Array.isArray(answer) && answer.includes(option);
                        return (
                          <Pressable
                            key={option}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            onPress={() => selectOption(question, option)}
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
                              color={
                                selected
                                  ? theme.colors.primary
                                  : theme.colors.text
                              }
                              style={styles.chipText}
                              weight="700"
                            >
                              {option}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                  {question.question_type === 'text' ? (
                    <TextInput
                      accessibilityLabel={question.question}
                      multiline
                      placeholder="Write your answer here"
                      placeholderTextColor={theme.colors.textMuted}
                      value={typeof answer === 'string' ? answer : ''}
                      onChangeText={value =>
                        setResponses(current => ({
                          ...current,
                          [question.ai_analysis_question_id]: value,
                        }))
                      }
                      onFocus={() =>
                        scrollToQuestion(question.ai_analysis_question_id)
                      }
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
                  ) : null}
                </View>
              );
            })}

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
                Your answers add personal context to the selected lab report
                without assuming what caused a symptom.
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
              accessibilityRole="button"
              accessibilityState={{ disabled: !canContinue }}
              disabled={!canContinue}
              onPress={() =>
                navigation.navigate('HealthTrends', {
                  ...route.params,
                  answers: questions
                    .filter(question =>
                      isAnswered(responses[question.ai_analysis_question_id]),
                    )
                    .map(question => ({
                      ai_analysis_question_id: question.ai_analysis_question_id,
                      answer: responses[question.ai_analysis_question_id],
                    })),
                })
              }
              style={[
                styles.buildButton,
                {
                  backgroundColor: canContinue
                    ? theme.colors.primary
                    : theme.colors.textMuted,
                },
              ]}
            >
              <Sparkles color="#FFFFFF" size={14} />
              <AppText color="#FFFFFF" style={styles.buildText} weight="700">
                Build my health view
              </AppText>
              <ArrowRight color="#FFFFFF" size={14} />
            </Pressable>
          </View>
        ) : null}
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
  headerSub: { marginTop: 2, fontSize: 10, lineHeight: 13 },
  content: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 22 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 9, lineHeight: 12 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 7,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  state: { marginTop: 22, alignSelf: 'center' },
  questionBlock: { marginTop: 22 },
  questionTop: { flexDirection: 'row', justifyContent: 'space-between' },
  questionNumber: { fontSize: 10, lineHeight: 14, letterSpacing: 0.5 },
  optional: { fontSize: 10, lineHeight: 14 },
  questionTitle: { fontSize: 18, lineHeight: 23, marginTop: 7 },
  textInput: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 13,
    padding: 12,
    marginTop: 13,
    fontSize: 13,
  },
  eyebrow: { marginTop: 19, fontSize: 10, lineHeight: 14, letterSpacing: 0.6 },
  title: { marginTop: 6, fontSize: 23, lineHeight: 27, letterSpacing: -0.6 },
  subtitle: { marginTop: 8, fontSize: 11, lineHeight: 15 },
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
  answerTitle: { fontSize: 12, lineHeight: 16 },
  answerDetail: { marginTop: 2, fontSize: 10, lineHeight: 14 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomHeading: { marginTop: 18, fontSize: 12, lineHeight: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  chip: {
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  chipText: { fontSize: 10, lineHeight: 14 },
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
  whyTitle: { fontSize: 12, lineHeight: 16 },
  whyBody: { marginTop: 7, fontSize: 10, lineHeight: 14 },
  saveNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 3,
  },
  saveText: { flex: 1, fontSize: 10, lineHeight: 14 },
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
  backText: { fontSize: 11, lineHeight: 15 },
  buildButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buildText: { fontSize: 11, lineHeight: 15 },
});
