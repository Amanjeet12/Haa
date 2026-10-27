import BookOpen from 'lucide-react-native/icons/book-open';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Check from 'lucide-react-native/icons/check';
import CircleIcon from 'lucide-react-native/icons/circle';
import FileText from 'lucide-react-native/icons/file-text';
import Pause from 'lucide-react-native/icons/pause';
import Play from 'lucide-react-native/icons/play';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video, { type VideoRef } from 'react-native-video';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppText, HaaLogo, HealthFlowHeader } from '../components';
import {
  analyzeReport,
  ReportTrend,
  uploadReportPdf,
  type ReportAnalysis,
} from '../api/reportAnalyses';
import { useAppSelector } from '../store';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'HealthTrends'>;

// Resolve once: progress updates must not replace the audio source.
const audioSource = {
  uri:
    Image.resolveAssetSource(require('../assets/images/audio.mp3'))?.uri ?? '',
  bufferConfig: {
    minBufferMs: 2000,
    maxBufferMs: 10000,
    bufferForPlaybackMs: 250,
    bufferForPlaybackAfterRebufferMs: 500,
  },
};

function statusColor(status: string) {
  return status.toLowerCase() === 'normal' ? '#078B76' : '#DF1F2D';
}

function parseReferenceRange(range?: string) {
  if (!range) return null;
  const between = range.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)\s*$/,
  );
  if (between) return { lower: Number(between[1]), upper: Number(between[2]) };
  const limit = range.match(/^\s*(<=|<|>=|>)\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!limit) return null;
  const value = Number(limit[2]);
  return limit[1].startsWith('<')
    ? { lower: null, upper: value }
    : { lower: value, upper: null };
}

function chartScale(
  trend: ReportTrend,
  range?: ReturnType<typeof parseReferenceRange>,
) {
  const values = trend.points.map(point => point.value);
  if (range?.lower !== null && range?.lower !== undefined)
    values.push(range.lower);
  if (range?.upper !== null && range?.upper !== undefined)
    values.push(range.upper);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.15, Math.abs(max) * 0.1, 1);
  const bottom = min - padding;
  const top = max + padding;
  return (value: number) => 145 - ((value - bottom) / (top - bottom)) * 120;
}

function chartPoints(
  trend: ReportTrend,
  range?: ReturnType<typeof parseReferenceRange>,
): Array<[number, number]> {
  const points = [...trend.points].sort((a, b) => a.date.localeCompare(b.date));
  if (!points.length) return [];
  const y = chartScale(trend, range);
  return points.map((point, index) => [
    points.length === 1 ? 170 : 18 + (index * 302) / (points.length - 1),
    y(point.value),
  ]);
}

function sparklinePath(trend: ReportTrend) {
  return chartPoints(trend)
    .map(
      ([x, y], index) =>
        `${index ? 'L' : 'M'}${(x / 340) * 100} ${(y / 170) * 24}`,
    )
    .join(' ');
}

export function HealthTrendsScreen({ navigation, route }: Props) {
  const { width, fontScale } = useWindowDimensions();
  const stackFooter = width < 390 * fontScale;
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const [report, setReport] = useState<ReportAnalysis | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [analysisPhase, setAnalysisPhase] = useState<'upload' | 'analyze'>(
    route.params.outsideReports.length ? 'upload' : 'analyze',
  );
  const [reportError, setReportError] = useState<string | null>(null);
  const started = useRef(false);
  const uploadedUrls = useRef<Record<string, string>>({});
  const runAnalysis = useCallback(async () => {
    if (!token) {
      setReportError('Log in to analyze this report.');
      setReportLoading(false);
      return;
    }
    setReportLoading(true);
    setAnalysisPhase(route.params.outsideReports.length ? 'upload' : 'analyze');
    setReportError(null);
    try {
      const pdfUrls: string[] = [];
      for (const file of route.params.outsideReports) {
        const url =
          uploadedUrls.current[file.uri] ??
          (await uploadReportPdf(token, file));
        uploadedUrls.current[file.uri] = url;
        pdfUrls.push(url);
      }

      setAnalysisPhase('analyze');

      setReport(
        await analyzeReport(token, route.params.bookingId, {
          ...(!route.params.bookingId
            ? {
                family_member_id: route.params.memberId,
                report_date:
                  route.params.reportDate ??
                  new Date().toLocaleDateString('en-CA'),
              }
            : {}),
          ...(pdfUrls.length ? { pdf_urls: pdfUrls } : {}),
          questionnaire_answers: route.params.answers,
        }),
      );
    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : 'Unable to analyze this report.',
      );
    } finally {
      setReportLoading(false);
    }
  }, [token, route.params]);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      runAnalysis();
    }
  }, [runAnalysis]);
  const [selectedTrendIndex, setSelectedTrendIndex] = useState(0);
  const findings = report?.analysis.findings ?? [];
  const trends = report?.trends ?? [];
  const selectedTrend = trends[selectedTrendIndex] ?? trends[0];
  const selectedFinding = findings.find(
    finding =>
      finding.marker.toLowerCase() === selectedTrend?.marker.toLowerCase(),
  );
  const referenceRange = parseReferenceRange(selectedFinding?.reference_range);
  const selectedPoints = selectedTrend
    ? chartPoints(selectedTrend, referenceRange)
    : [];
  const rangeY = selectedTrend
    ? chartScale(selectedTrend, referenceRange)
    : null;
  const chartPath = selectedPoints
    .map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`)
    .join(' ');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<VideoRef>(null);
  const isFocused = useIsFocused();
  const [audioReady, setAudioReady] = useState(false);
  const [audioBuffering, setAudioBuffering] = useState(false);
  const [actuallyPlaying, setActuallyPlaying] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const audioLoading =
    isAudioPlaying && (!audioReady || audioBuffering || !actuallyPlaying);
  useEffect(() => {
    if (!isFocused) setIsAudioPlaying(false);
  }, [isFocused]);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);
  const audioProgress = audioDuration
    ? Math.min(audioPosition / audioDuration, 1)
    : 0;
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
        {!reportLoading ? (
          <HealthFlowHeader
            title="My health trends"
            subtitle="Reports + questionnaire"
            onBack={navigation.goBack}
            rightIcon={<FileText color="#078B76" size={17} />}
          />
        ) : null}

        {reportLoading ? (
          <View style={styles.preparingScreen}>
            <View style={styles.preparingGroup}>
              <HaaLogo style={styles.preparingLogo} />
              <AppText style={styles.preparingTitle} weight="800">
                Making things clearer.
              </AppText>
              <AppText
                color={theme.colors.textMuted}
                style={styles.preparingSubtitle}
              >
                Preparing your report overview
              </AppText>
              <View
                style={[
                  styles.preparingPanel,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.preparingStep}>
                  <View style={styles.preparingIcon}>
                    {analysisPhase === 'upload' ? (
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
                    style={styles.preparingStepText}
                  >
                    Organizing selected reports
                  </AppText>
                </View>
                <View style={styles.preparingStep}>
                  <View style={styles.preparingIcon}>
                    {analysisPhase === 'analyze' ? (
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
                      analysisPhase === 'analyze'
                        ? theme.colors.text
                        : theme.colors.textMuted
                    }
                    style={styles.preparingStepText}
                  >
                    Matching shared parameters
                  </AppText>
                </View>
                <View style={styles.preparingStep}>
                  <View style={styles.preparingIcon}>
                    <CircleIcon color={theme.colors.textMuted} size={14} />
                  </View>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.preparingStepText}
                  >
                    Preparing your explanation
                  </AppText>
                </View>
              </View>
              <AppText
                color={theme.colors.textMuted}
                style={styles.preparingFootnote}
              >
                This may take a moment.
              </AppText>
            </View>
          </View>
        ) : reportError ? (
          <View style={styles.analysisState}>
            <AppText style={styles.analysisStateText} weight="700">
              {reportError}
            </AppText>
            <Pressable
              onPress={runAnalysis}
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <AppText color="#FFFFFF" weight="700">
                Try again
              </AppText>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topMeta}>
              <AppText
                color={theme.colors.primary}
                style={styles.eyebrow}
                weight="800"
              >
                ANALYZED {report?.report_date ?? ''}
              </AppText>
              <View style={styles.statusPill}>
                <AppText color="#078B76" style={styles.statusText} weight="700">
                  Report + check-in
                </AppText>
              </View>
            </View>
            <AppText style={styles.title} weight="800">
              {report?.analysis.headline}
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.subtitle}>
              {report?.analysis.summary}
            </AppText>

            <View
              style={[
                styles.audioCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  shadowColor: theme.colors.shadow,
                },
              ]}
            >
              <Pressable
                accessibilityLabel="Audio conclusion coming soon"
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                disabled
                onPress={() => {
                  if (audioEnded) {
                    audioRef.current?.seek(0);
                    setAudioPosition(0);
                    setAudioEnded(false);
                  }
                  setIsAudioPlaying(playing => !playing);
                }}
                style={[
                  styles.playButton,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                {audioLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : isAudioPlaying ? (
                  <Pause color="#FFFFFF" fill="#FFFFFF" size={18} />
                ) : (
                  <Play color="#FFFFFF" fill="#FFFFFF" size={17} />
                )}
              </Pressable>
              <View style={styles.audioCopy}>
                <AppText
                  color={theme.colors.primary}
                  style={styles.audioLabel}
                  weight="800"
                >
                  AUDIO CONCLUSION
                </AppText>
                <AppText style={styles.audioTitle} weight="700">
                  Hear this report in simple words
                </AppText>
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.audioDetail}
                >
                  Audio conclusion coming soon
                </AppText>
              </View>
              <View
                style={[
                  styles.languagePill,
                  { borderColor: theme.colors.border },
                ]}
              >
                <AppText style={styles.language} weight="700">
                  English
                </AppText>
              </View>
              <View
                style={[
                  styles.audioProgressTrack,
                  { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <View
                  style={[
                    styles.audioProgressFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${audioProgress * 100}%`,
                    },
                  ]}
                />
              </View>
              <Video
                ref={audioRef}
                source={audioSource}
                paused={!isAudioPlaying || !isFocused}
                automaticallyWaitsToMinimizeStalling={false}
                progressUpdateInterval={100}
                playInBackground={false}
                playWhenInactive={false}
                onLoadStart={() => setAudioReady(false)}
                onLoad={({ duration }) => {
                  setAudioDuration(duration);
                  setAudioReady(true);
                }}
                onBuffer={({ isBuffering }) => setAudioBuffering(isBuffering)}
                onPlaybackStateChanged={({ isPlaying }) =>
                  setActuallyPlaying(isPlaying)
                }
                onProgress={({ currentTime }) => setAudioPosition(currentTime)}
                onEnd={() => {
                  setIsAudioPlaying(false);
                  setActuallyPlaying(false);
                  setAudioEnded(true);
                  setAudioPosition(audioDuration);
                }}
                onError={() => {
                  setIsAudioPlaying(false);
                  setActuallyPlaying(false);
                  Alert.alert(
                    'Audio unavailable',
                    'Unable to play the audio conclusion. Please reopen this screen and try again.',
                  );
                }}
                style={styles.hiddenAudio}
              />
            </View>

            <View style={styles.markerRow}>
              {findings.slice(0, 3).map(marker => {
                const markerTrend = trends.find(
                  trend =>
                    trend.marker.toLowerCase() === marker.marker.toLowerCase(),
                );
                return (
                  <View
                    key={marker.marker}
                    style={[
                      styles.markerCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        shadowColor: theme.colors.shadow,
                      },
                    ]}
                  >
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.markerName}
                    >
                      {marker.marker}
                    </AppText>
                    <AppText style={styles.markerValue} weight="800">
                      {marker.value} {marker.unit}
                    </AppText>
                    <AppText
                      color={statusColor(marker.status)}
                      style={styles.markerStatus}
                      weight="700"
                    >
                      • {marker.status}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.markerStatus}
                      numberOfLines={2}
                    >
                      {marker.explanation}
                    </AppText>
                    {markerTrend && markerTrend.points.length > 1 ? (
                      <View style={styles.sparkLine}>
                        <Svg width="100%" height="24" viewBox="0 0 100 24">
                          <Path
                            d={sparklinePath(markerTrend)}
                            fill="none"
                            stroke={statusColor(marker.status)}
                            strokeLinecap="round"
                            strokeWidth="2.5"
                          />
                        </Svg>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <SectionHeader
              title="Trend across reports"
              aside="From your reports"
              asideColor={theme.colors.primary}
            />
            {selectedTrend ? (
              <View
                style={[
                  styles.chartCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    shadowColor: theme.colors.shadow,
                  },
                ]}
              >
                <View style={styles.chartHeading}>
                  <View style={styles.chartHeadingCopy}>
                    <AppText style={styles.chartTitle} weight="700">
                      {selectedTrend.marker}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.chartSub}
                    >
                      Reported values by date
                    </AppText>
                  </View>
                  <AppText
                    color={theme.colors.primary}
                    style={styles.chartValue}
                    weight="800"
                  >
                    {selectedTrend.latest_value ??
                      selectedTrend.points.at(-1)?.value ??
                      '—'}{' '}
                    {selectedTrend.unit}
                  </AppText>
                  {selectedFinding?.reference_range ? (
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.chartRange}
                    >
                      Reference range: {selectedFinding.reference_range}{' '}
                      {selectedTrend.unit}
                    </AppText>
                  ) : null}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chartTabs}
                >
                  {trends.map((trend, index) => {
                    const active = index === selectedTrendIndex;
                    return (
                      <Pressable
                        key={trend.marker}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                        onPress={() => setSelectedTrendIndex(index)}
                        style={[
                          styles.chartTab,
                          {
                            backgroundColor: active
                              ? theme.colors.primarySoft
                              : 'transparent',
                            borderColor: active
                              ? theme.colors.primary
                              : theme.colors.border,
                          },
                        ]}
                      >
                        <AppText
                          color={
                            active ? theme.colors.primary : theme.colors.text
                          }
                          style={styles.tabText}
                          weight={active ? '700' : '400'}
                        >
                          {trend.marker}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <View style={styles.chart}>
                  <View style={styles.chartCallout}>
                    <AppText color="#FFFFFF" style={styles.calloutText}>
                      {selectedTrend.points.at(-1)?.date ?? ''} ·{' '}
                      {selectedTrend.latest_value ??
                        selectedTrend.points.at(-1)?.value ??
                        '—'}{' '}
                      {selectedTrend.unit}
                    </AppText>
                  </View>
                  <Svg width="100%" height="170" viewBox="0 0 340 170">
                    <Defs>
                      <SvgLinearGradient
                        id="trendFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <Stop
                          offset="0"
                          stopColor={statusColor(
                            selectedTrend.points.at(-1)?.status ?? 'normal',
                          )}
                          stopOpacity="0.18"
                        />
                        <Stop
                          offset="1"
                          stopColor={statusColor(
                            selectedTrend.points.at(-1)?.status ?? 'normal',
                          )}
                          stopOpacity="0.02"
                        />
                      </SvgLinearGradient>
                    </Defs>
                    {[32, 80, 128].map(y => (
                      <Line
                        key={y}
                        x1="8"
                        y1={y}
                        x2="332"
                        y2={y}
                        stroke={theme.colors.border}
                      />
                    ))}
                    {[62, 148, 234, 320].map(x => (
                      <Line
                        key={x}
                        x1={x}
                        y1="8"
                        x2={x}
                        y2="148"
                        stroke={theme.colors.border}
                      />
                    ))}
                    {referenceRange && rangeY ? (
                      <Rect
                        x="8"
                        y={
                          referenceRange.upper === null
                            ? 8
                            : rangeY(referenceRange.upper)
                        }
                        width="324"
                        height={
                          (referenceRange.lower === null
                            ? 148
                            : rangeY(referenceRange.lower)) -
                          (referenceRange.upper === null
                            ? 8
                            : rangeY(referenceRange.upper))
                        }
                        fill="#078B76"
                        opacity="0.1"
                      />
                    ) : null}
                    {selectedPoints.length > 1 ? (
                      <Path
                        d={`${chartPath} L${selectedPoints.at(-1)?.[0]} 150 L${
                          selectedPoints[0][0]
                        } 150 Z`}
                        fill="url(#trendFill)"
                      />
                    ) : null}
                    {selectedPoints.length > 1 ? (
                      <Path
                        d={chartPath}
                        fill="none"
                        stroke={statusColor(
                          selectedTrend.points.at(-1)?.status ?? 'normal',
                        )}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    ) : null}
                    {selectedPoints.map(([cx, cy], index) => (
                      <Circle
                        key={`${cx}-${index}`}
                        cx={cx}
                        cy={cy}
                        r="6"
                        fill={theme.colors.surface}
                        stroke={
                          index === selectedPoints.length - 1
                            ? statusColor(
                                selectedTrend.points.at(-1)?.status ?? 'normal',
                              )
                            : '#08233D'
                        }
                        strokeWidth="3.5"
                      />
                    ))}
                  </Svg>
                </View>
                <View
                  style={[
                    styles.detailButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  {selectedFinding?.reference_range ? (
                    <AppText
                      color="#FFFFFF"
                      style={styles.detailText}
                      weight="700"
                    >
                      Reference range: {selectedFinding.reference_range}{' '}
                      {selectedTrend.unit}
                    </AppText>
                  ) : null}
                  <AppText color="#FFFFFF" style={styles.detailCount}>
                    {selectedTrend.points.length} report{' '}
                    {selectedTrend.points.length === 1 ? 'result' : 'results'}
                  </AppText>
                </View>
              </View>
            ) : (
              <AppText color={theme.colors.textMuted}>
                No trend data is available for this report.
              </AppText>
            )}

            <SectionHeader
              title="Health focus"
              aside="Urgent attention"
              asideColor={theme.colors.textMuted}
            />
            {report?.analysis.urgent_attention.length ? (
              report.analysis.urgent_attention.map((item, index) => (
                <FocusCard
                  key={`${item}-${index}`}
                  icon={<BookOpen color={theme.colors.primary} size={15} />}
                  title={item}
                  detail="Discuss this with a clinician."
                />
              ))
            ) : (
              <AppText color={theme.colors.textMuted} style={styles.emptyFocus}>
                No urgent attention noted in this analysis.
              </AppText>
            )}
            <SectionHeader
              title="Recommendations"
              aside="From this analysis"
              asideColor={theme.colors.textMuted}
            />
            {report?.analysis.recommendations.map((item, index) => (
              <FocusCard
                key={`${item}-${index}`}
                icon={<CalendarDays color="#078B76" size={15} />}
                title={item}
                detail=""
              />
            ))}
            <AppText color={theme.colors.textMuted} style={styles.disclaimer}>
              {report?.analysis.disclaimer}
            </AppText>
          </ScrollView>
        )}

        {report ? (
          <View
            style={[
              styles.footer,
              stackFooter && styles.footerStacked,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.footerCopy,
                stackFooter && styles.footerCopyStacked,
              ]}
            >
              <AppText
                color={theme.colors.textMuted}
                style={styles.footerEyebrow}
              >
                {report?.analysis.recommendations.length ?? 0} recommendations
                found
              </AppText>
              <AppText style={styles.footerTitle} weight="800">
                See relevant HAA options
              </AppText>
            </View>
            <Pressable
              onPress={() => {
                if (report)
                  navigation.navigate('HealthRecommendations', {
                    analysis: report,
                  });
              }}
              style={[
                styles.recommendButton,
                stackFooter && styles.recommendButtonStacked,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <AppText
                color="#FFFFFF"
                style={styles.recommendText}
                weight="700"
              >
                Recommendations
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

function SectionHeader({
  title,
  aside,
  asideColor,
}: {
  title: string;
  aside: string;
  asideColor: string;
}) {
  const { width, fontScale } = useWindowDimensions();
  const stackHeader = width < 390 * fontScale;
  return (
    <View
      style={[styles.sectionHeader, stackHeader && styles.sectionHeaderStacked]}
    >
      <AppText style={styles.sectionTitle} weight="800">
        {title}
      </AppText>
      <AppText
        color={asideColor}
        style={[styles.sectionAside, stackHeader && styles.sectionAsideStacked]}
        weight="700"
      >
        {aside}
      </AppText>
    </View>
  );
}

function FocusCard({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.focusCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.focusIcon,
          { backgroundColor: theme.colors.primarySoft },
        ]}
      >
        {icon}
      </View>
      <View style={styles.focusCopy}>
        <AppText style={styles.focusTitle} weight="700">
          {title}
        </AppText>
        {detail ? (
          <AppText color={theme.colors.textMuted} style={styles.focusDetail}>
            {detail}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  preparingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  preparingGroup: { width: '100%', maxWidth: 360, alignItems: 'center' },
  preparingLogo: { width: 190, height: 106 },
  preparingTitle: {
    marginTop: 16,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  preparingSubtitle: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  preparingPanel: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 30,
  },
  preparingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  preparingIcon: {
    width: 27,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  preparingStepText: { fontSize: 13, lineHeight: 19 },
  preparingFootnote: {
    marginTop: 17,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  analysisState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  analysisStateText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyFocus: { marginTop: 10, fontSize: 11, lineHeight: 16 },
  disclaimer: { marginTop: 20, marginBottom: 10, fontSize: 10, lineHeight: 15 },
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniBrand: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, lineHeight: 19 },
  headerSub: { marginTop: 2, fontSize: 10, lineHeight: 13 },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 22 },
  topMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { fontSize: 10, lineHeight: 14, letterSpacing: 0.6 },
  statusPill: {
    borderRadius: 7,
    backgroundColor: '#DDF7F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 9, lineHeight: 12 },
  title: { marginTop: 8, fontSize: 23, lineHeight: 27, letterSpacing: -0.7 },
  subtitle: { marginTop: 9, fontSize: 11, lineHeight: 15 },
  audioCard: {
    minHeight: 80,
    marginTop: 17,
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingTop: 11,
    paddingBottom: 23,
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  playButton: {
    width: 55,
    height: 55,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioCopy: { flex: 1, marginLeft: 12 },
  audioLabel: { fontSize: 10, lineHeight: 13, letterSpacing: 0.55 },
  audioTitle: { marginTop: 2, fontSize: 14, lineHeight: 18 },
  audioDetail: { marginTop: 3, fontSize: 10, lineHeight: 14 },
  languagePill: {
    width: 91,
    height: 46,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  language: { fontSize: 11, lineHeight: 14 },
  audioProgressTrack: {
    position: 'absolute',
    right: 13,
    bottom: 11,
    left: 13,
    height: 4,
    overflow: 'hidden',
    borderRadius: 2,
  },
  audioProgressFill: { height: '100%', borderRadius: 2 },
  hiddenAudio: { position: 'absolute', width: 0, height: 0 },
  markerRow: { flexDirection: 'row', gap: 9, marginTop: 15 },
  markerCard: {
    flex: 1,
    minHeight: 128,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    elevation: 3,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  markerName: { fontSize: 11, lineHeight: 15 },
  markerValue: { marginTop: 7, fontSize: 22, lineHeight: 24 },
  markerStatus: { marginTop: 6, fontSize: 10, lineHeight: 14 },
  sparkLine: {
    height: 24,
    marginTop: 'auto',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 21,
    marginBottom: 8,
  },
  sectionHeaderStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  sectionTitle: { fontSize: 18, lineHeight: 22, letterSpacing: -0.4 },
  sectionAside: { fontSize: 9, lineHeight: 12 },
  sectionAsideStacked: { marginTop: 3 },
  chartCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  chartHeading: { alignItems: 'flex-start' },
  chartHeadingCopy: { alignSelf: 'stretch' },
  chartTitle: { fontSize: 13, lineHeight: 17 },
  chartSub: { marginTop: 2, fontSize: 10, lineHeight: 14 },
  chartValue: { marginTop: 5, fontSize: 12, lineHeight: 16 },
  chartRange: { marginTop: 3, fontSize: 10, lineHeight: 14 },
  chartTabs: { flexDirection: 'row', gap: 7, paddingTop: 14, paddingBottom: 2 },
  chartTab: {
    minHeight: 42,
    maxWidth: 120,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontSize: 10, lineHeight: 14, textAlign: 'center' },
  chart: { marginTop: 12, overflow: 'hidden' },
  chartCallout: {
    position: 'absolute',
    zIndex: 2,
    top: 1,
    right: 0,
    borderRadius: 9,
    backgroundColor: '#08233D',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  calloutText: { fontSize: 9, lineHeight: 12 },
  detailButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  detailText: { fontSize: 11, lineHeight: 15, textAlign: 'center' },
  detailCount: { fontSize: 10, lineHeight: 14, textAlign: 'center' },
  focusCard: {
    minHeight: 65,
    marginBottom: 7,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 9,
  },
  focusIcon: {
    width: 35,
    height: 35,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusCopy: {
    flex: 1,
    marginLeft: 9,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  focusTitle: { fontSize: 12, lineHeight: 16, textAlign: 'start' },
  focusDetail: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  footer: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerStacked: { flexDirection: 'column', alignItems: 'stretch', gap: 10 },
  footerCopy: { flex: 1, minWidth: 0 },
  footerCopyStacked: { flex: 0 },
  footerEyebrow: { fontSize: 9, lineHeight: 12 },
  footerTitle: { marginTop: 2, fontSize: 14, lineHeight: 18 },
  recommendButton: {
    height: 47,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  recommendButtonStacked: { alignSelf: 'stretch' },
  recommendText: { fontSize: 11, lineHeight: 15 },
});
