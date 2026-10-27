import Check from 'lucide-react-native/icons/check';
import CircleIcon from 'lucide-react-native/icons/circle';
import FileText from 'lucide-react-native/icons/file-text';
import Sparkles from 'lucide-react-native/icons/sparkles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import {
  analyzeReport,
  type ReportAnalysis,
  type ReportFinding,
  type ReportTrend,
  uploadReportPdf,
} from '../api/reportAnalyses';
import { AppText, HaaLogo, HealthFlowHeader } from '../components';
import { useAppSelector } from '../store';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'HealthTrends'>;
type ResultsTab = 'results' | 'trends' | 'steps';
type Filter = 'all' | 'review';

function formatDate(value?: string | null) {
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

function isWithinRange(status: string) {
  return ['normal', 'within range', 'within_range', 'optimal'].includes(
    status.toLowerCase(),
  );
}

function parseRange(range: string) {
  const match = range.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)\s*$/,
  );
  if (!match) return null;
  return { low: Number(match[1]), high: Number(match[2]) };
}

function chartNumber(value: number) {
  return Number(value.toFixed(1)).toString();
}

function shortDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function TrendPlot({
  trend,
  range,
}: {
  trend: ReportTrend;
  range: ReturnType<typeof parseRange>;
}) {
  const { theme } = useAppTheme();
  const points = [...trend.points].sort((a, b) => a.date.localeCompare(b.date));
  if (!points.length) return null;
  const values = points.map(point => point.value);
  const axisMin = Math.min(0, ...values, range?.low ?? 0);
  const axisMax = Math.max(1, ...values, range?.high ?? 0) * 1.22;
  const scaleY = (value: number) =>
    150 - ((value - axisMin) / (axisMax - axisMin)) * 120;
  const plotted = points.map((point, index) => ({
    x: points.length === 1 ? 167 : 53 + (index * 235) / (points.length - 1),
    y: scaleY(point.value),
    value: point.value,
  }));
  const path = plotted
    .map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`)
    .join(' ');
  const first = points[0];
  const last = points.at(-1) ?? first;
  const firstPoint = plotted[0];
  const lastPoint = plotted.at(-1) ?? firstPoint;
  return (
    <Svg width="100%" height={220} viewBox="0 0 320 220">
      {[30, 90, 150].map((lineY, index) => (
        <React.Fragment key={lineY}>
          <Line
            x1={48}
            x2={302}
            y1={lineY}
            y2={lineY}
            stroke={theme.colors.border}
            strokeDasharray="3,4"
          />
          <SvgText
            x={3}
            y={lineY + 3}
            fill={theme.colors.textMuted}
            fontSize={8}
          >
            {chartNumber(
              index === 0
                ? axisMax
                : index === 1
                ? (axisMin + axisMax) / 2
                : axisMin,
            )}
          </SvgText>
        </React.Fragment>
      ))}
      {range ? (
        <Rect
          x={48}
          y={scaleY(range.high)}
          width={254}
          height={Math.max(0, scaleY(range.low) - scaleY(range.high))}
          rx={5}
          fill="#DDF7F0"
        />
      ) : null}
      {plotted.length > 1 ? (
        <Path
          d={path}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={2.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {plotted.map((point, index) => (
        <Circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={4}
          fill={theme.colors.surface}
          stroke={theme.colors.primary}
          strokeWidth={2.3}
        />
      ))}
      <SvgText
        x={firstPoint.x}
        y={Math.max(19, firstPoint.y - 10)}
        textAnchor="middle"
        fill={theme.colors.text}
        fontSize={10}
        fontWeight="700"
      >
        {chartNumber(firstPoint.value)}
      </SvgText>
      {plotted.length > 1 ? (
        <SvgText
          x={lastPoint.x}
          y={Math.max(19, lastPoint.y - 10)}
          textAnchor="middle"
          fill={theme.colors.text}
          fontSize={10}
          fontWeight="700"
        >
          {chartNumber(lastPoint.value)}
        </SvgText>
      ) : null}
      <SvgText
        x={firstPoint.x}
        y={178}
        textAnchor="middle"
        fill={theme.colors.textMuted}
        fontSize={9}
      >
        {shortDate(first.date)}
      </SvgText>
      {plotted.length > 1 ? (
        <SvgText
          x={lastPoint.x}
          y={178}
          textAnchor="middle"
          fill={theme.colors.textMuted}
          fontSize={9}
        >
          {shortDate(last.date)}
        </SvgText>
      ) : null}
      <SvgText
        x={lastPoint.x}
        y={196}
        textAnchor="middle"
        fill={theme.colors.textMuted}
        fontSize={8}
      >
        {new Date(last.date).getFullYear()}
      </SvgText>
    </Svg>
  );
}

function ResultCard({
  finding,
  date,
  onOpen,
}: {
  finding: ReportFinding;
  date: string;
  onOpen: () => void;
}) {
  const { theme } = useAppTheme();
  const within = isWithinRange(finding.status);
  const range = parseRange(finding.reference_range);
  const numericValue =
    typeof finding.value === 'number' ? finding.value : Number(finding.value);
  const position =
    range && Number.isFinite(numericValue) && range.high > range.low
      ? Math.max(
          3,
          Math.min(
            97,
            ((numericValue - (range.low - (range.high - range.low) * 0.5)) /
              ((range.high - range.low) * 2)) *
              100,
          ),
        )
      : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Understand ${finding.marker} result`}
      onPress={onOpen}
      style={[
        styles.resultCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.resultTop}>
        <AppText style={styles.resultName} weight="800">
          {finding.marker}
        </AppText>
        <View
          style={[
            styles.statusBadge,
            within ? styles.withinBadge : styles.reviewBadge,
          ]}
        >
          <AppText
            color={within ? '#007F70' : '#A56800'}
            style={styles.statusText}
            weight="700"
          >
            {within ? 'Within range' : 'Review'}
          </AppText>
        </View>
      </View>
      <View style={styles.valueRow}>
        <AppText style={styles.resultValue} weight="800">
          {finding.value}
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.resultUnit}>
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
              <View style={[styles.rangeMarker, { left: `${position}%` }]} />
            ) : null}
          </View>
          <View style={styles.rangeLabels}>
            <AppText color={theme.colors.textMuted} style={styles.rangeLabel}>
              {range.low}
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.rangeLabel}>
              Lab reference range
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.rangeLabel}>
              {range.high}
            </AppText>
          </View>
        </View>
      ) : (
        <AppText color={theme.colors.textMuted} style={styles.referenceText}>
          Lab reference range: {finding.reference_range || 'Unavailable'}
        </AppText>
      )}
      <View
        style={[styles.resultBottom, { borderTopColor: theme.colors.border }]}
      >
        <AppText color={theme.colors.textMuted} style={styles.resultDate}>
          {date}
        </AppText>
        <View>
          <AppText
            color={theme.colors.primary}
            style={styles.understand}
            weight="700"
          >
            Understand result ↗
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

function TrendCard({
  trend,
  finding,
}: {
  trend: ReportTrend;
  finding?: ReportFinding;
}) {
  const { theme } = useAppTheme();
  const points = [...trend.points].sort((a, b) => a.date.localeCompare(b.date));
  const range = finding ? parseRange(finding.reference_range) : null;
  return (
    <View
      style={[
        styles.trendCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.trendTop}>
        <AppText style={styles.trendName} weight="800">
          {trend.marker}
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.trendMeta}>
          {trend.unit}
        </AppText>
      </View>
      {points.length ? (
        <View style={styles.compactPlot}>
          <TrendPlot trend={trend} range={range} />
        </View>
      ) : (
        <AppText color={theme.colors.textMuted} style={styles.singleTrend}>
          No dated measurements are available for this parameter.
        </AppText>
      )}
      <View style={styles.chartLegend}>
        <View style={styles.legendDotRed} />
        <AppText color={theme.colors.textMuted} style={styles.legendText}>
          Measured result
        </AppText>
        {range ? (
          <>
            <View style={styles.legendDotGreen} />
            <AppText color={theme.colors.textMuted} style={styles.legendText}>
              Lab reference range
            </AppText>
          </>
        ) : null}
      </View>
    </View>
  );
}

function FeaturedTrend({
  trend,
  finding,
  onUnderstand,
}: {
  trend: ReportTrend;
  finding?: ReportFinding;
  onUnderstand: () => void;
}) {
  const { theme } = useAppTheme();
  const points = [...trend.points].sort((a, b) => a.date.localeCompare(b.date));
  const latest = points.at(-1);
  const first = points[0];
  const range = finding ? parseRange(finding.reference_range) : null;
  const change =
    first && latest && points.length > 1 ? latest.value - first.value : null;
  const within = isWithinRange(latest?.status ?? finding?.status ?? 'normal');
  return (
    <View
      style={[
        styles.featuredTrend,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.featuredTop}>
        <AppText style={styles.featuredName} weight="800">
          {trend.marker}
        </AppText>
        <View
          style={[
            styles.statusBadge,
            within ? styles.withinBadge : styles.reviewBadge,
          ]}
        >
          <AppText
            color={within ? '#007F70' : '#A56800'}
            style={styles.statusText}
            weight="700"
          >
            {within ? 'Within range' : 'Review'}
          </AppText>
        </View>
      </View>
      <View style={styles.featuredValues}>
        <View>
          <View style={styles.valueRow}>
            <AppText style={styles.resultValue} weight="800">
              {latest?.value ?? '—'}
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.resultUnit}>
              {trend.unit}
            </AppText>
          </View>
          <AppText color={theme.colors.textMuted} style={styles.trendMeta}>
            Latest measured · {formatDate(latest?.date)}
          </AppText>
        </View>
        {change !== null ? (
          <View style={styles.changeCopy}>
            <AppText color={theme.colors.textMuted} style={styles.changeValue}>
              {change > 0 ? '+' : ''}
              {Number(change.toFixed(2))} {trend.unit}
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.trendMeta}>
              since {formatDate(first?.date)}
            </AppText>
          </View>
        ) : null}
      </View>
      {points.length ? (
        <View style={styles.featuredChart}>
          <TrendPlot trend={trend} range={range} />
        </View>
      ) : (
        <AppText color={theme.colors.textMuted} style={styles.emptyText}>
          No dated measurements are available for this parameter.
        </AppText>
      )}
      <View style={styles.chartLegend}>
        <View style={styles.legendDotRed} />
        <AppText color={theme.colors.textMuted} style={styles.legendText}>
          Measured result
        </AppText>
        {range ? (
          <>
            <View style={styles.legendDotGreen} />
            <AppText color={theme.colors.textMuted} style={styles.legendText}>
              Lab reference range
            </AppText>
          </>
        ) : null}
      </View>
      <View
        style={[
          styles.measurementHeader,
          { borderBottomColor: theme.colors.border },
        ]}
      >
        <AppText color={theme.colors.textMuted} style={styles.measureDate}>
          Report date
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.measureValue}>
          Result · {trend.unit}
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.measureStatus}>
          Status
        </AppText>
      </View>
      {points.map((point, index) => (
        <View
          key={`${point.booking_id}-${index}`}
          style={[
            styles.measurementRow,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <AppText style={styles.measureDate}>{formatDate(point.date)}</AppText>
          <AppText style={styles.measureValue} weight="700">
            {point.value}
          </AppText>
          <View style={styles.measureStatusCell}>
            <View
              style={[
                styles.measureStatusBadge,
                isWithinRange(point.status)
                  ? styles.withinBadge
                  : styles.highBadge,
              ]}
            >
              <AppText
                color={
                  isWithinRange(point.status) ? '#007F70' : theme.colors.primary
                }
                style={styles.measureStatusText}
                weight="700"
              >
                {isWithinRange(point.status)
                  ? 'Within range'
                  : point.status.charAt(0).toUpperCase() +
                    point.status.slice(1)}
              </AppText>
            </View>
          </View>
        </View>
      ))}
      {finding ? (
        <Pressable
          accessibilityRole="button"
          onPress={onUnderstand}
          style={styles.featuredUnderstand}
        >
          <AppText
            color={theme.colors.primary}
            style={styles.understand}
            weight="700"
          >
            Understand this parameter →
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function HealthAnalysisScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const [report, setReport] = useState<ReportAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'upload' | 'analyze'>(
    route.params.outsideReports.length ? 'upload' : 'analyze',
  );
  const [tab, setTab] = useState<ResultsTab>(
    route.params.focusTab ?? 'results',
  );
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedTrendIndex, setSelectedTrendIndex] = useState(0);
  const uploadedUrls = useRef<Record<string, string>>({});
  const started = useRef(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const tabOffset = useRef(0);

  const runAnalysis = useCallback(async () => {
    if (!token) {
      setError('Log in to analyze this report.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setPhase(route.params.outsideReports.length ? 'upload' : 'analyze');
    try {
      const pdfUrls: string[] = [];
      for (const file of route.params.outsideReports) {
        const url =
          uploadedUrls.current[file.uri] ??
          (await uploadReportPdf(token, file));
        uploadedUrls.current[file.uri] = url;
        pdfUrls.push(url);
      }
      setPhase('analyze');
      const result = await analyzeReport(token, route.params.bookingId, {
        ...(!route.params.bookingId
          ? {
              family_member_id: route.params.memberId,
              report_date:
                route.params.reportDate ?? new Date().toLocaleDateString('en-CA'),
            }
          : {}),
        ...(pdfUrls.length ? { pdf_urls: pdfUrls } : {}),
        questionnaire_answers: route.params.answers,
      });
      setReport(result);
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : 'Unable to analyze this report.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, route.params]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    runAnalysis();
  }, [runAnalysis]);

  const findings = report?.analysis.findings ?? [];
  const reviewFindings = findings.filter(
    finding => !isWithinRange(finding.status),
  );
  const shownFindings = filter === 'review' ? reviewFindings : findings;
  const reportDate = formatDate(report?.report_date ?? route.params.reportDate);
  const reportCount =
    route.params.reportCount ??
    (route.params.bookingId ? 1 : 0) + route.params.outsideReports.length;
  const reportLabel = reportCount === 1 ? 'report' : 'reports';
  const allTrendDates = [
    ...new Set(
      (report?.trends ?? []).flatMap(trend =>
        trend.points.map(point => point.date),
      ),
    ),
  ].sort();
  const trendReportCount = new Set(
    (report?.trends ?? []).flatMap(trend =>
      trend.points.map(point => point.booking_id),
    ),
  ).size;
  const firstTrendDate = allTrendDates[0];
  const lastTrendDate = allTrendDates.at(-1);
  const selectedTrend = report?.trends[selectedTrendIndex] ?? report?.trends[0];
  const selectedTrendFinding = findings.find(
    finding =>
      finding.marker.toLowerCase() === selectedTrend?.marker.toLowerCase(),
  );
  const openFinding = (finding: ReportFinding) => {
    if (!report) return;
    navigation.navigate('HealthResultDetail', {
      finding,
      report,
      memberName: route.params.memberName,
      reportTitle: route.params.reportTitle,
      analysisRoute: route.params,
    });
  };
  useEffect(() => {
    if (route.params.focusTab) setTab(route.params.focusTab);
  }, [route.params.focusTab]);
  const selectTab = (next: ResultsTab) => {
    setTab(next);
    scrollRef.current?.scrollTo({ y: tabOffset.current, animated: true });
  };
  const editReports = () =>
    navigation.popTo('HealthReportSelection', {
      memberId: route.params.memberId,
      bookingId: route.params.bookingId,
    });
  const shareSummary = async () => {
    if (!report) return;
    try {
      await Share.share({
        message: [
          'HAA Health View',
          `${route.params.memberName ?? 'Profile'} · ${reportDate}`,
          report.analysis.headline,
          report.analysis.summary,
          ...findings.map(
            finding =>
              `${finding.marker}: ${finding.value} ${finding.unit} (${finding.status})`,
          ),
          report.analysis.disclaimer,
        ].join('\n'),
      });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
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
        {loading ? (
          <View style={styles.loadingScreen}>
            <View style={styles.loadingGroup}>
              <HaaLogo style={styles.logo} />
              <AppText style={styles.loadingTitle} weight="800">
                Making things clearer.
              </AppText>
              <AppText
                color={theme.colors.textMuted}
                style={styles.loadingSubtitle}
              >
                Preparing your report overview
              </AppText>
              <View
                style={[
                  styles.loadingPanel,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.loadingRow}>
                  <View style={styles.loadingIcon}>
                    {phase === 'upload' ? (
                      <ActivityIndicator
                        color={theme.colors.success}
                        size="small"
                      />
                    ) : (
                      <Check color={theme.colors.success} size={17} />
                    )}
                  </View>
                  <AppText
                    color={theme.colors.success}
                    style={styles.loadingRowText}
                  >
                    Organizing selected reports
                  </AppText>
                </View>
                <View style={styles.loadingRow}>
                  <View style={styles.loadingIcon}>
                    {phase === 'analyze' ? (
                      <ActivityIndicator
                        color={theme.colors.primary}
                        size="small"
                      />
                    ) : (
                      <CircleIcon color={theme.colors.textMuted} size={14} />
                    )}
                  </View>
                  <AppText
                    color={
                      phase === 'analyze'
                        ? theme.colors.text
                        : theme.colors.textMuted
                    }
                    style={styles.loadingRowText}
                  >
                    Matching shared parameters
                  </AppText>
                </View>
                <View style={styles.loadingRow}>
                  <View style={styles.loadingIcon}>
                    <CircleIcon color={theme.colors.textMuted} size={14} />
                  </View>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.loadingRowText}
                  >
                    Preparing your explanation
                  </AppText>
                </View>
              </View>
              <AppText
                color={theme.colors.textMuted}
                style={styles.loadingFootnote}
              >
                This may take a moment.
              </AppText>
            </View>
          </View>
        ) : error ? (
          <>
            <HealthFlowHeader
              title="My health trends"
              subtitle="Report analysis"
              onBack={navigation.goBack}
            />
            <View style={styles.errorState}>
              <AppText style={styles.errorText} weight="700">
                {error}
              </AppText>
              <Pressable
                onPress={runAnalysis}
                style={[
                  styles.retry,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <AppText color="#FFFFFF" weight="700">
                  Try again
                </AppText>
              </Pressable>
            </View>
          </>
        ) : report ? (
          <>
            <HealthFlowHeader
              title="My health trends"
              subtitle="Report overview"
              onBack={navigation.goBack}
            />
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              stickyHeaderIndices={[1]}
            >
              <View style={styles.hero}>
                <View style={styles.breadcrumb}>
                  <View
                    style={[
                      styles.breadcrumbAvatar,
                      { backgroundColor: theme.colors.primarySoft },
                    ]}
                  >
                    <AppText
                      color={theme.colors.primary}
                      style={styles.breadcrumbInitial}
                      weight="800"
                    >
                      {(route.params.memberName ?? 'M')
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </AppText>
                  </View>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.breadcrumbText}
                    numberOfLines={1}
                  >
                    {route.params.memberName ?? 'Your profile'} / New analysis
                  </AppText>
                </View>
                <AppText
                  color={theme.colors.primary}
                  style={styles.eyebrow}
                  weight="800"
                >
                  HAA · YOUR REPORTS, EXPLAINED
                </AppText>
                <AppText style={styles.pageTitle} weight="800">
                  Your report, made clear.
                </AppText>
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.pageSubtitle}
                >
                  {route.params.reportTitle ?? report.analysis.headline} ·{' '}
                  {reportDate}
                </AppText>
                <View style={styles.glanceCard}>
                  <AppText
                    color="#AED5EB"
                    style={styles.glanceEyebrow}
                    weight="800"
                  >
                    ✦ AT A GLANCE
                  </AppText>
                  <AppText
                    color="#FFFFFF"
                    style={styles.glanceTitle}
                    weight="800"
                  >
                    {reviewFindings.length
                      ? `${reviewFindings.length} ${
                          reviewFindings.length === 1 ? 'result' : 'results'
                        } to review in the latest report.`
                      : 'Your latest results are ready to explore.'}
                  </AppText>
                  <AppText color="#FFFFFF" style={styles.glanceBody}>
                    Explore each result, its laboratory range, and the questions
                    you may want to ask your clinician.
                  </AppText>
                </View>
                <View style={styles.statsRow}>
                  <View
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <AppText style={styles.statValue} weight="800">
                      {findings.length - reviewFindings.length}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.statLabel}
                    >
                      Within range · latest
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <AppText
                      color={theme.colors.primary}
                      style={styles.statValue}
                      weight="800"
                    >
                      {reviewFindings.length}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.statLabel}
                    >
                      For review · latest
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <AppText style={styles.statValue} weight="800">
                      {findings.length}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.statLabel}
                    >
                      Results in this report
                    </AppText>
                  </View>
                </View>
              </View>
              <View
                onLayout={event => {
                  tabOffset.current = event.nativeEvent.layout.y;
                }}
                style={[
                  styles.tabHeader,
                  {
                    backgroundColor: theme.colors.background,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.tabs}>
                  {(
                    [
                      ['results', 'Results'],
                      ['trends', 'Trends & comparison'],
                      ['steps', 'Next steps'],
                    ] as const
                  ).map(([value, label]) => (
                    <Pressable
                      key={value}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: tab === value }}
                      onPress={() => selectTab(value)}
                      style={[
                        styles.tab,
                        tab === value && {
                          borderBottomColor: theme.colors.primary,
                        },
                      ]}
                    >
                      <AppText
                        color={
                          tab === value
                            ? theme.colors.primary
                            : theme.colors.textMuted
                        }
                        style={styles.tabText}
                        weight={tab === value ? '700' : '500'}
                      >
                        {label}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.body}>
                {tab === 'results' ? (
                  <>
                    <View style={styles.sectionHeading}>
                      <AppText style={styles.sectionTitle} weight="800">
                        Latest report results
                      </AppText>
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.sectionDate}
                      >
                        {reportDate}
                      </AppText>
                    </View>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.sectionSub}
                    >
                      {findings.length} results in this report
                    </AppText>
                    <View style={styles.filters}>
                      {(
                        [
                          ['all', 'All'],
                          ['review', 'For review'],
                        ] as const
                      ).map(([value, label]) => (
                        <Pressable
                          key={value}
                          accessibilityRole="button"
                          accessibilityState={{ selected: filter === value }}
                          onPress={() => setFilter(value)}
                          style={[
                            styles.filter,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                            },
                            filter === value && styles.filterSelected,
                          ]}
                        >
                          <AppText
                            color={
                              filter === value ? '#FFFFFF' : theme.colors.text
                            }
                            style={styles.filterText}
                            weight={filter === value ? '700' : '500'}
                          >
                            {label}
                          </AppText>
                        </Pressable>
                      ))}
                    </View>
                    {shownFindings.length ? (
                      shownFindings.map((finding, index) => (
                        <ResultCard
                          key={`${finding.marker}-${index}`}
                          finding={finding}
                          date={reportDate}
                          onOpen={() => openFinding(finding)}
                        />
                      ))
                    ) : (
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.emptyText}
                      >
                        {filter === 'review'
                          ? 'No results marked for review.'
                          : 'No individual results are available.'}
                      </AppText>
                    )}
                    <AppText style={styles.lowerTitle} weight="800">
                      Reports in this analysis
                    </AppText>
                    <View
                      style={[
                        styles.reportsCard,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.reportInset,
                          { backgroundColor: theme.colors.surfaceMuted },
                        ]}
                      >
                        <View style={styles.reportInsetCopy}>
                          <AppText style={styles.reportTitle} weight="800">
                            {route.params.reportTitle ??
                              report.analysis.headline ??
                              'Report PDF'}
                          </AppText>
                          <AppText
                            color={theme.colors.textMuted}
                            style={styles.reportMeta}
                          >
                            {reportCount} {reportLabel} selected
                          </AppText>
                        </View>
                        <AppText style={styles.reportMeta}>
                          {reportDate}
                        </AppText>
                      </View>
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.reportFoot}
                      >
                        Analyzed {formatDate(report.analyzed_at)}. Report dates
                        come from the source documents.
                      </AppText>
                    </View>
                    <AppText style={styles.lowerTitle} weight="800">
                      Understand the bigger picture
                    </AppText>
                    <View
                      style={[
                        styles.educationCard,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <View style={styles.educationIllustration}>
                        <FileText color="#078B76" size={43} />
                        <View style={styles.educationCopy}>
                          <AppText style={styles.educationTitle} weight="800">
                            One sample. Several insights.
                          </AppText>
                          <AppText
                            color="#467B70"
                            style={styles.educationDetail}
                          >
                            Each parameter measures a different part of your
                            health picture.
                          </AppText>
                        </View>
                      </View>
                      <AppText style={styles.educationHeading} weight="800">
                        A result is part of a bigger picture.
                      </AppText>
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.educationBody}
                      >
                        Your symptoms, medicines, and earlier reports help a
                        clinician interpret these results.
                      </AppText>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => selectTab('steps')}
                      >
                        <AppText
                          color={theme.colors.primary}
                          style={styles.educationLink}
                          weight="700"
                        >
                          See questions & next steps →
                        </AppText>
                      </Pressable>
                    </View>
                  </>
                ) : tab === 'trends' ? (
                  <>
                    <View style={styles.sectionHeading}>
                      <AppText style={styles.sectionTitle} weight="800">
                        Compare your parameters
                      </AppText>
                      <View
                        style={[
                          styles.reportCountPill,
                          { backgroundColor: theme.colors.surfaceMuted },
                        ]}
                      >
                        <AppText
                          color={theme.colors.textMuted}
                          style={styles.reportCountText}
                        >
                          {trendReportCount}{' '}
                          {trendReportCount === 1 ? 'report' : 'reports'}
                        </AppText>
                      </View>
                    </View>
                    {allTrendDates.length ? (
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.comparisonDates}
                      >
                        {formatDate(firstTrendDate)} –{' '}
                        {formatDate(lastTrendDate)}
                      </AppText>
                    ) : null}
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.comparisonNote}
                    >
                      Measured dates from your selected source reports
                    </AppText>
                    {report.trends.length ? (
                      <>
                        <View style={styles.parameterChips}>
                          {report.trends.map((trend, index) => (
                            <Pressable
                              key={trend.marker}
                              accessibilityRole="button"
                              accessibilityState={{
                                selected: selectedTrendIndex === index,
                              }}
                              onPress={() => setSelectedTrendIndex(index)}
                              style={[
                                styles.parameterChip,
                                {
                                  backgroundColor: theme.colors.surface,
                                  borderColor: theme.colors.border,
                                },
                                selectedTrendIndex === index &&
                                  styles.parameterChipSelected,
                              ]}
                            >
                              <AppText
                                color={
                                  selectedTrendIndex === index
                                    ? '#FFFFFF'
                                    : theme.colors.text
                                }
                                style={styles.parameterChipText}
                                weight={
                                  selectedTrendIndex === index ? '700' : '500'
                                }
                              >
                                {trend.marker}
                              </AppText>
                            </Pressable>
                          ))}
                        </View>
                        {selectedTrend ? (
                          <FeaturedTrend
                            trend={selectedTrend}
                            finding={selectedTrendFinding}
                            onUnderstand={() =>
                              selectedTrendFinding &&
                              openFinding(selectedTrendFinding)
                            }
                          />
                        ) : null}
                        {report.trends.length > 1 ? (
                          <AppText style={styles.lowerTitle} weight="800">
                            More parameters over time
                          </AppText>
                        ) : null}
                        {report.trends
                          .filter((_, index) => index !== selectedTrendIndex)
                          .map(trend => (
                            <TrendCard
                              key={trend.marker}
                              trend={trend}
                              finding={findings.find(
                                finding =>
                                  finding.marker.toLowerCase() ===
                                  trend.marker.toLowerCase(),
                              )}
                            />
                          ))}
                        <AppText style={styles.lowerTitle} weight="800">
                          All selected measurements
                        </AppText>
                        <AppText
                          color={theme.colors.textMuted}
                          style={styles.tableNote}
                        >
                          A dash means the parameter was not measured in that
                          report.
                        </AppText>
                        <View
                          style={[
                            styles.allMeasurements,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.allMeasurementRow,
                              { borderBottomColor: theme.colors.border },
                            ]}
                          >
                            <AppText
                              color={theme.colors.textMuted}
                              style={styles.allMeasurementName}
                            >
                              Parameter
                            </AppText>
                            <AppText
                              color={theme.colors.textMuted}
                              style={styles.allMeasurementValue}
                            >
                              {formatDate(firstTrendDate)}
                            </AppText>
                            <AppText
                              color={theme.colors.textMuted}
                              style={styles.allMeasurementValue}
                            >
                              {formatDate(lastTrendDate)}
                            </AppText>
                          </View>
                          {report.trends.map(trend => {
                            const first = trend.points.find(
                              point => point.date === firstTrendDate,
                            );
                            const last = trend.points.find(
                              point => point.date === lastTrendDate,
                            );
                            return (
                              <View
                                key={trend.marker}
                                style={[
                                  styles.allMeasurementRow,
                                  { borderBottomColor: theme.colors.border },
                                ]}
                              >
                                <View style={styles.allMeasurementName}>
                                  <AppText style={styles.allMeasurementMarker}>
                                    {trend.marker}
                                  </AppText>
                                  <AppText
                                    color={theme.colors.textMuted}
                                    style={styles.allMeasurementUnit}
                                  >
                                    {trend.unit}
                                  </AppText>
                                </View>
                                <AppText style={styles.allMeasurementValue}>
                                  {first?.value ?? '—'}
                                </AppText>
                                <AppText style={styles.allMeasurementValue}>
                                  {last?.value ?? '—'}
                                </AppText>
                              </View>
                            );
                          })}
                        </View>
                        {allTrendDates.length > 2 ? (
                          <AppText
                            color={theme.colors.textMuted}
                            style={styles.tableNote}
                          >
                            The table shows the earliest and latest
                            measurements. Open a parameter above to see every
                            dated value.
                          </AppText>
                        ) : null}
                      </>
                    ) : (
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.emptyText}
                      >
                        No trend data is available yet. Add another dated report
                        to compare results.
                      </AppText>
                    )}
                  </>
                ) : (
                  <>
                    <AppText style={styles.sectionTitle} weight="800">
                      Questions & next steps
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.sectionSub}
                    >
                      Use these points to guide a conversation with your
                      clinician.
                    </AppText>
                    {report.analysis.questions_for_clinician.map(
                      (question, index) => (
                        <View
                          key={`${question}-${index}`}
                          style={[
                            styles.nextStepCard,
                            {
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <AppText
                            color={theme.colors.primary}
                            style={styles.stepNumber}
                            weight="800"
                          >
                            {index + 1}
                          </AppText>
                          <AppText style={styles.stepCopy}>{question}</AppText>
                        </View>
                      ),
                    )}
                    {report.analysis.recommendations.length ? (
                      <AppText style={styles.lowerTitle} weight="800">
                        Recommendations
                      </AppText>
                    ) : null}
                    {report.analysis.recommendations.map((item, index) => (
                      <View
                        key={`${item}-${index}`}
                        style={[
                          styles.nextStepCard,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <Sparkles color={theme.colors.success} size={18} />
                        <AppText style={styles.stepCopy}>{item}</AppText>
                      </View>
                    ))}
                  </>
                )}
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.disclaimer}
                >
                  {report.analysis.disclaimer}
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
                accessibilityRole="button"
                onPress={editReports}
                style={[
                  styles.editButton,
                  { borderColor: theme.colors.border },
                ]}
              >
                <AppText style={styles.editText} weight="700">
                  Edit reports
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={shareSummary}
                style={[
                  styles.shareButton,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <AppText color="#FFFFFF" style={styles.shareText} weight="800">
                  Save / share view ↗
                </AppText>
              </Pressable>
            </View>
          </>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingGroup: { width: '100%', maxWidth: 360, alignItems: 'center' },
  logo: { width: 190, height: 106 },
  loadingTitle: {
    marginTop: 16,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  loadingSubtitle: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  loadingPanel: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 30,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  loadingIcon: { width: 27, alignItems: 'flex-start' },
  loadingRowText: { fontSize: 13, lineHeight: 19 },
  loadingFootnote: {
    marginTop: 17,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  errorText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retry: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scrollContent: { paddingBottom: 32 },
  hero: { paddingHorizontal: 17, paddingTop: 18 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breadcrumbAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breadcrumbInitial: { fontSize: 11 },
  breadcrumbText: { flex: 1, fontSize: 11 },
  eyebrow: { marginTop: 21, fontSize: 10, lineHeight: 14, letterSpacing: 1.3 },
  pageTitle: {
    marginTop: 7,
    fontSize: 27,
    lineHeight: 32,
    letterSpacing: -0.7,
  },
  pageSubtitle: { marginTop: 10, fontSize: 13, lineHeight: 19 },
  glanceCard: {
    marginTop: 19,
    borderRadius: 20,
    padding: 21,
    backgroundColor: '#031B34',
  },
  glanceEyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 1.2 },
  glanceTitle: {
    marginTop: 12,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.5,
  },
  glanceBody: { marginTop: 13, fontSize: 12, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 22 },
  statCard: {
    flex: 1,
    minHeight: 82,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  statValue: { fontSize: 24, lineHeight: 28 },
  statLabel: { marginTop: 6, fontSize: 9, lineHeight: 13 },
  tabHeader: {
    borderBottomWidth: 1,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 18,
    minHeight: 46,
  },
  tab: {
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    justifyContent: 'center',
    marginRight: 24,
  },
  tabText: { fontSize: 11, lineHeight: 15 },
  body: { paddingHorizontal: 17, paddingTop: 27 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: { fontSize: 17, lineHeight: 22 },
  sectionDate: { fontSize: 11, lineHeight: 15 },
  sectionSub: { fontSize: 11, lineHeight: 17, marginTop: 8, marginBottom: 15 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  filter: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSelected: { backgroundColor: '#031B34', borderColor: '#031B34' },
  filterText: { fontSize: 11 },
  resultCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 11,
  },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  resultName: { flex: 1, fontSize: 13, lineHeight: 18 },
  statusBadge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6 },
  withinBadge: { backgroundColor: '#DDF7F0' },
  reviewBadge: { backgroundColor: '#FFF0CE' },
  statusText: { fontSize: 10, lineHeight: 13 },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 10,
  },
  resultValue: { fontSize: 28, lineHeight: 33 },
  resultUnit: { fontSize: 11, lineHeight: 16 },
  rangeArea: { marginTop: 18 },
  rangeTrack: { height: 7, flexDirection: 'row', gap: 3, position: 'relative' },
  rangeEdge: { flex: 1, borderRadius: 4, backgroundColor: '#F4DCAA' },
  rangeMiddle: { flex: 2, borderRadius: 4, backgroundColor: '#9DD9C8' },
  rangeMarker: {
    position: 'absolute',
    width: 2,
    height: 13,
    top: -3,
    backgroundColor: '#031B34',
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  rangeLabel: { fontSize: 9, lineHeight: 13 },
  referenceText: { fontSize: 10, lineHeight: 15, marginTop: 18 },
  resultBottom: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    minHeight: 42,
  },
  resultDate: { fontSize: 10, lineHeight: 14 },
  understand: { fontSize: 11, lineHeight: 15 },
  lowerTitle: { marginTop: 26, marginBottom: 12, fontSize: 17, lineHeight: 22 },
  reportsCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  reportInset: {
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    padding: 12,
  },
  reportInsetCopy: { flex: 1 },
  reportTitle: { fontSize: 11, lineHeight: 15 },
  reportMeta: { fontSize: 10, lineHeight: 15 },
  reportFoot: { fontSize: 10, lineHeight: 17, marginTop: 15 },
  educationCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  educationIllustration: {
    minHeight: 128,
    borderRadius: 16,
    backgroundColor: '#EAF5F2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 19,
    gap: 18,
  },
  educationCopy: { flex: 1 },
  educationTitle: { fontSize: 12, lineHeight: 17 },
  educationDetail: { fontSize: 10, lineHeight: 16, marginTop: 4 },
  educationHeading: { fontSize: 15, lineHeight: 20, marginTop: 16 },
  educationBody: { fontSize: 11, lineHeight: 19, marginTop: 10 },
  educationLink: { fontSize: 12, lineHeight: 17, marginTop: 15 },
  disclaimer: { fontSize: 10, lineHeight: 16, marginTop: 24 },
  trendCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 11,
  },
  reportCountPill: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  reportCountText: { fontSize: 10, lineHeight: 14 },
  comparisonDates: { fontSize: 10, lineHeight: 15, marginTop: 9 },
  comparisonNote: { fontSize: 10, lineHeight: 15, marginTop: 2 },
  parameterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
    marginBottom: 12,
  },
  parameterChip: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parameterChipSelected: { backgroundColor: '#031B34', borderColor: '#031B34' },
  parameterChipText: { fontSize: 10, lineHeight: 14 },
  featuredTrend: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  featuredTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  featuredName: { flex: 1, fontSize: 13, lineHeight: 18 },
  featuredValues: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 9,
  },
  changeCopy: { alignItems: 'flex-end', marginTop: 12 },
  changeValue: { fontSize: 11, lineHeight: 15 },
  featuredChart: { marginTop: 28 },
  compactPlot: { marginTop: 12 },
  chartEndpointLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 23,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 20,
    marginBottom: 15,
  },
  legendDotRed: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D61928',
  },
  legendDotGreen: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#9DD9C8',
    marginLeft: 8,
  },
  legendText: { fontSize: 9, lineHeight: 13 },
  measurementHeader: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  measureDate: { flex: 1.2, fontSize: 10, lineHeight: 14 },
  measureValue: { flex: 1, fontSize: 10, lineHeight: 14 },
  measureStatus: { flex: 0.8, fontSize: 10, lineHeight: 14 },
  measureStatusCell: { flex: 0.8, alignItems: 'flex-start' },
  measureStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  measureStatusText: { fontSize: 9, lineHeight: 12 },
  highBadge: { backgroundColor: '#FFE4E7' },
  featuredUnderstand: { paddingTop: 15, alignSelf: 'flex-start' },
  tableNote: { fontSize: 10, lineHeight: 16, marginTop: 6, marginBottom: 12 },
  allMeasurements: {
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingTop: 12,
  },
  allMeasurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 43,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  allMeasurementName: { flex: 1.7, fontSize: 10, lineHeight: 14 },
  allMeasurementValue: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  allMeasurementMarker: { fontSize: 10, lineHeight: 14 },
  allMeasurementUnit: { fontSize: 9, lineHeight: 12 },
  trendTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  trendCopy: { flex: 1 },
  trendName: { fontSize: 13, lineHeight: 18 },
  trendMeta: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  trendValue: { fontSize: 15, lineHeight: 20 },
  trendDates: { flexDirection: 'row', justifyContent: 'space-between' },
  singleTrend: { fontSize: 11, lineHeight: 17, marginTop: 20 },
  emptyText: { fontSize: 11, lineHeight: 17, marginVertical: 20 },
  nextStepCard: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: { fontSize: 16, lineHeight: 20 },
  stepCopy: { flex: 1, fontSize: 12, lineHeight: 19 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 76,
    paddingHorizontal: 17,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  editText: { fontSize: 11 },
  shareButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: { fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000066',
  },
  modalDismiss: { flex: 1 },
  modalCard: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 35,
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: { flex: 1, fontSize: 18, lineHeight: 23 },
  modalValue: { fontSize: 27, lineHeight: 33, marginTop: 18 },
  modalRange: { fontSize: 11, lineHeight: 16, marginTop: 10 },
  modalExplanation: { fontSize: 12, lineHeight: 20, marginTop: 18 },
});
