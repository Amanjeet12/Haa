import ArrowRight from 'lucide-react-native/icons/arrow-right';
import FileText from 'lucide-react-native/icons/file-text';
import Info from 'lucide-react-native/icons/info';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, HealthFlowHeader } from '../components';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import type { HomeStackParamList } from '../types/navigation';
import { TrendPlot } from './HealthAnalysisScreen';

type Props = NativeStackScreenProps<HomeStackParamList, 'HealthResultDetail'>;

function formatDate(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

function parseRange(value: string) {
  const match = value.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)\s*$/,
  );
  return match ? { low: Number(match[1]), high: Number(match[2]) } : null;
}

function withinRange(status: string) {
  return ['normal', 'within range', 'within_range', 'optimal'].includes(
    status.toLowerCase(),
  );
}

export function HealthResultDetailScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const { finding, report, memberName, reportTitle, analysisRoute } =
    route.params;
  const [openQuestion, setOpenQuestion] = useState<'measure' | 'useful' | null>(
    'measure',
  );
  const range = parseRange(finding.reference_range);
  const value = Number(finding.value);
  const position =
    range && Number.isFinite(value) && range.high > range.low
      ? Math.max(
          3,
          Math.min(
            97,
            ((value - (range.low - (range.high - range.low) * 0.5)) /
              ((range.high - range.low) * 2)) *
              100,
          ),
        )
      : null;
  const trend = report.trends.find(
    item => item.marker.toLowerCase() === finding.marker.toLowerCase(),
  );
  const points = [...(trend?.points ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const latestDate = points.at(-1)?.date ?? report.report_date;
  const status = withinRange(finding.status) ? 'Within range' : 'For review';
  const sourceUrl = report.source_pdf_urls[0];
  const sourceName = reportTitle ?? report.analysis.headline ?? 'Report PDF';

  const openSource = async () => {
    if (!sourceUrl) return;
    try {
      await Linking.openURL(sourceUrl);
    } catch {
      Alert.alert('Unable to open report', 'Please try again later.');
    }
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
          title="HAA Health View"
          subtitle="Your reports, made clearer"
          onBack={navigation.goBack}
          rightIcon={<Info color={theme.colors.success} size={18} />}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            onPress={navigation.goBack}
            style={styles.backLink}
          >
            <AppText color={theme.colors.primary} style={styles.backText}>
              ‹ Back to analysis
            </AppText>
          </Pressable>
          <AppText
            color={theme.colors.primary}
            style={styles.eyebrow}
            weight="800"
          >
            RESULT EXPLAINED
          </AppText>
          <AppText style={styles.title} weight="800">
            {finding.marker}
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            {memberName ?? 'Myself'} · {formatDate(latestDate)}
          </AppText>

          <View
            style={[
              styles.card,
              styles.measurementCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.rowBetween}>
              <AppText color={theme.colors.textMuted} style={styles.caption}>
                Latest available measurement
              </AppText>
              <View
                style={[
                  styles.badge,
                  withinRange(finding.status)
                    ? styles.withinBadge
                    : styles.reviewBadge,
                ]}
              >
                <AppText
                  color={withinRange(finding.status) ? '#007F70' : '#A56800'}
                  style={styles.badgeText}
                  weight="700"
                >
                  {status}
                </AppText>
              </View>
            </View>
            <View style={styles.valueRow}>
              <AppText style={styles.value} weight="800">
                {finding.value}
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.unit}>
                {finding.unit}
              </AppText>
            </View>
            {range ? (
              <View style={styles.rangeArea}>
                <View style={styles.rangeTrack}>
                  <View style={styles.rangeEdge} />
                  <View style={styles.rangeMiddle} />
                  <View style={styles.rangeEdge} />
                  {position !== null ? (
                    <View
                      style={[styles.rangeMarker, { left: `${position}%` }]}
                    />
                  ) : null}
                </View>
                <View style={styles.rangeLabels}>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.rangeText}
                  >
                    {range.low}
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.rangeText}
                  >
                    Lab reference range
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.rangeText}
                  >
                    {range.high}
                  </AppText>
                </View>
              </View>
            ) : (
              <AppText
                color={theme.colors.textMuted}
                style={styles.rangeFallback}
              >
                Lab reference range: {finding.reference_range || 'Unavailable'}
              </AppText>
            )}
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.metaBox,
                  { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.metaLabel}
                >
                  Report date
                </AppText>
                <AppText style={styles.metaValue} weight="700">
                  {formatDate(latestDate)}
                </AppText>
              </View>
              <View
                style={[
                  styles.metaBox,
                  { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.metaLabel}
                >
                  Source document
                </AppText>
                <AppText
                  style={styles.metaValue}
                  weight="700"
                  numberOfLines={1}
                >
                  {sourceName}
                </AppText>
              </View>
            </View>
            <View
              style={[
                styles.sourceRow,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <AppText color={theme.colors.textMuted} style={styles.sourceText}>
                {sourceName}
              </AppText>
              {sourceUrl ? (
                <Pressable accessibilityRole="button" onPress={openSource}>
                  <AppText
                    color={theme.colors.primary}
                    style={styles.sourceLink}
                    weight="700"
                  >
                    View source ↗
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </View>

          <AppText style={styles.sectionTitle} weight="800">
            What this means
          </AppText>
          <View
            style={[
              styles.card,
              styles.meaningCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppText style={styles.meaningText}>
              {finding.explanation ||
                'An explanation is not available for this result. Ask your clinician how it fits your health history.'}
            </AppText>
          </View>

          <AppText style={styles.sectionTitle} weight="800">
            Get to know this test
          </AppText>
          <View
            style={[
              styles.card,
              styles.learnCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.illustration}>
              <FileText color="#078B76" size={38} />
              <View style={styles.illustrationCopy}>
                <AppText style={styles.illustrationTitle} weight="800">
                  One sample. Several insights.
                </AppText>
                <AppText color="#467B70" style={styles.illustrationText}>
                  Each parameter measures a different part of your health
                  picture.
                </AppText>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setOpenQuestion(openQuestion === 'measure' ? null : 'measure')
              }
              style={[
                styles.question,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <AppText style={styles.questionText}>
                What does it measure?
              </AppText>
              <AppText color={theme.colors.primary}>
                {' '}
                {openQuestion === 'measure' ? '−' : '+'}{' '}
              </AppText>
            </Pressable>
            {openQuestion === 'measure' ? (
              <AppText color={theme.colors.textMuted} style={styles.answer}>
                {finding.explanation ||
                  `This result measures ${finding.marker} in your report.`}
              </AppText>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setOpenQuestion(openQuestion === 'useful' ? null : 'useful')
              }
              style={[
                styles.question,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <AppText style={styles.questionText}>Why is it useful?</AppText>
              <AppText color={theme.colors.primary}>
                {' '}
                {openQuestion === 'useful' ? '−' : '+'}{' '}
              </AppText>
            </Pressable>
            {openQuestion === 'useful' ? (
              <AppText color={theme.colors.textMuted} style={styles.answer}>
                Your clinician can consider this result alongside your symptoms,
                medicines, and earlier reports.
              </AppText>
            ) : null}
          </View>

          {trend && points.length ? (
            <>
              <AppText style={styles.sectionTitle} weight="800">
                Your previous measurements
              </AppText>
              <View
                style={[
                  styles.card,
                  styles.trendCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <TrendPlot trend={trend} range={range} />
                <View style={styles.legend}>
                  <View style={styles.redDot} />
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.legendText}
                  >
                    Measured result
                  </AppText>
                  {range ? (
                    <>
                      <View style={styles.greenDot} />
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.legendText}
                      >
                        Lab reference range
                      </AppText>
                    </>
                  ) : null}
                </View>
              </View>
            </>
          ) : null}
          <AppText color={theme.colors.textMuted} style={styles.disclaimer}>
            Reference ranges vary by laboratory and personal context. A flag
            alone is not a diagnosis.
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
            onPress={() =>
              navigation.navigate('HealthTrends', {
                ...analysisRoute,
                focusTab: 'steps',
              })
            }
            style={[
              styles.footerButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <AppText color="#FFFFFF" style={styles.footerText} weight="800">
              Questions & next steps
            </AppText>
            <ArrowRight color="#FFFFFF" size={16} />
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 17, paddingTop: 20, paddingBottom: 30 },
  backLink: { alignSelf: 'flex-start', marginBottom: 17 },
  backText: { fontSize: 12 },
  eyebrow: { fontSize: 10, letterSpacing: 1.2 },
  title: { fontSize: 25, lineHeight: 31, marginTop: 7, letterSpacing: -0.6 },
  subtitle: { fontSize: 12, marginTop: 9, marginBottom: 17 },
  card: { borderWidth: 1, borderRadius: 17 },
  measurementCard: { padding: 15 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caption: { fontSize: 10 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  withinBadge: { backgroundColor: '#DDF7F0' },
  reviewBadge: { backgroundColor: '#FFF0C9' },
  badgeText: { fontSize: 9 },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 10,
  },
  value: { fontSize: 31, lineHeight: 37 },
  unit: { fontSize: 11 },
  rangeArea: { marginTop: 18, marginBottom: 14 },
  rangeTrack: { height: 6, flexDirection: 'row', gap: 3, position: 'relative' },
  rangeEdge: { flex: 1, backgroundColor: '#F7DDAA', borderRadius: 4 },
  rangeMiddle: { flex: 2, backgroundColor: '#9EDDCB', borderRadius: 4 },
  rangeMarker: {
    position: 'absolute',
    top: -4,
    width: 2,
    height: 14,
    backgroundColor: '#073350',
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  rangeText: { fontSize: 9 },
  rangeFallback: { fontSize: 11, marginVertical: 15 },
  metaRow: { flexDirection: 'row', gap: 8 },
  metaBox: { flex: 1, borderRadius: 11, padding: 11 },
  metaLabel: { fontSize: 9 },
  metaValue: { fontSize: 12, marginTop: 3 },
  sourceRow: {
    borderTopWidth: 1,
    marginTop: 13,
    paddingTop: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sourceText: { fontSize: 10, flex: 1 },
  sourceLink: { fontSize: 11 },
  sectionTitle: { fontSize: 16, marginTop: 25, marginBottom: 11 },
  meaningCard: { padding: 16 },
  meaningText: { fontSize: 12, lineHeight: 19 },
  learnCard: { padding: 15 },
  illustration: {
    backgroundColor: '#EAF5F2',
    borderRadius: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  illustrationCopy: { flex: 1 },
  illustrationTitle: { fontSize: 11 },
  illustrationText: { fontSize: 10, lineHeight: 15, marginTop: 4 },
  question: {
    minHeight: 43,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  questionText: { fontSize: 12 },
  answer: { fontSize: 11, lineHeight: 18, paddingVertical: 12 },
  trendCard: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 17 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 6,
    marginTop: 2,
  },
  redDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D51B2B' },
  greenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9EDDCB',
    marginLeft: 8,
  },
  legendText: { fontSize: 9 },
  disclaimer: { fontSize: 10, lineHeight: 17, marginTop: 14 },
  footer: { borderTopWidth: 1, paddingHorizontal: 17, paddingVertical: 11 },
  footerButton: {
    height: 48,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  footerText: { fontSize: 13 },
});
