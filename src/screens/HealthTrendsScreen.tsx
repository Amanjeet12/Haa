import BookOpen from 'lucide-react-native/icons/book-open';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import FileText from 'lucide-react-native/icons/file-text';
import Pause from 'lucide-react-native/icons/pause';
import Play from 'lucide-react-native/icons/play';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
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

import { AppText, HealthFlowHeader } from '../components';
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

const markers = [
  { name: 'Vitamin D', value: '18', status: 'Trending down', color: '#DF1F2D' },
  {
    name: 'Haemoglobin',
    value: '11.2',
    status: 'Below range',
    color: '#DF1F2D',
  },
  { name: 'Thyroid', value: '2.4', status: 'Steady', color: '#078B76' },
];

const trendData = [
  {
    name: 'Vitamin D',
    value: '18 ng/mL',
    path: 'M18 48 C72 45 91 53 126 69 S191 88 224 95 S280 111 320 136',
    points: [
      [18, 48],
      [126, 69],
      [224, 95],
      [320, 136],
    ],
    bandY: 26,
    bandHeight: 54,
    trendColor: '#64748B',
    endColor: '#F59E0B',
  },
  {
    name: 'Haemoglobin',
    value: '11.2 g/dL',
    path: 'M18 60 C70 61 93 70 126 76 S185 91 224 101 S281 108 320 114',
    points: [
      [18, 60],
      [126, 76],
      [224, 101],
      [320, 114],
    ],
    bandY: 35,
    bandHeight: 48,
    trendColor: '#DF1F2D',
    endColor: '#DF1F2D',
  },
  {
    name: 'Thyroid',
    value: '2.4 mIU/L',
    path: 'M18 84 C67 80 91 87 126 82 S183 79 224 83 S278 77 320 80',
    points: [
      [18, 84],
      [126, 82],
      [224, 83],
      [320, 80],
    ],
    bandY: 48,
    bandHeight: 58,
    trendColor: '#078B76',
    endColor: '#078B76',
  },
] as const;

export function HealthTrendsScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const [selectedTrendIndex, setSelectedTrendIndex] = useState(0);
  const selectedTrend = trendData[selectedTrendIndex];
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
        <HealthFlowHeader
          title="My health trends"
          subtitle="Reports + questionnaire - Krishna"
          onBack={navigation.goBack}
          rightIcon={<FileText color="#078B76" size={17} />}
        />

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
              UPDATED TODAY
            </AppText>
            <View style={styles.statusPill}>
              <AppText color="#078B76" style={styles.statusText} weight="700">
                2 reports + check-in
              </AppText>
            </View>
          </View>
          <AppText style={styles.title} weight="800">
            Krishna’s health signals{`\n`}at a glance.
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            HAA AI found two trends worth understanding and one stable marker.
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
              accessibilityLabel={
                isAudioPlaying
                  ? 'Pause audio conclusion'
                  : 'Play audio conclusion'
              }
              accessibilityRole="button"
              accessibilityState={{ busy: audioLoading }}
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
                2 min · AI key parameters
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
            {markers.map((marker, index) => (
              <View
                key={marker.name}
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
                  {marker.name}
                </AppText>
                <AppText style={styles.markerValue} weight="800">
                  {marker.value}
                </AppText>
                <AppText
                  color={marker.color}
                  style={styles.markerStatus}
                  weight="700"
                >
                  • {marker.status}
                </AppText>
                <View style={styles.sparkLine}>
                  <Svg width="100%" height="24" viewBox="0 0 100 24">
                    <Path
                      d={
                        index === 0
                          ? 'M2 3 C25 1 38 6 53 11 S78 18 98 22'
                          : index === 1
                          ? 'M2 5 C22 6 30 11 48 13 S77 14 98 17'
                          : 'M2 14 C24 14 37 15 53 13 S76 14 98 12'
                      }
                      fill="none"
                      stroke={marker.color}
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                  </Svg>
                </View>
              </View>
            ))}
          </View>

          <SectionHeader
            title="Trend across reports"
            aside="Last 12 months"
            asideColor={theme.colors.primary}
          />
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
              <View>
                <AppText style={styles.chartTitle} weight="700">
                  {selectedTrend.name}
                </AppText>
                <AppText color={theme.colors.textMuted} style={styles.chartSub}>
                  Reference band shown in green
                </AppText>
              </View>
              <AppText
                color={theme.colors.primary}
                style={styles.chartValue}
                weight="800"
              >
                {selectedTrend.value}
              </AppText>
            </View>
            <View style={styles.chartTabs}>
              {trendData.map((trend, index) => {
                const active = index === selectedTrendIndex;
                return (
                  <Pressable
                    key={trend.name}
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
                      color={active ? theme.colors.primary : theme.colors.text}
                      style={styles.tabText}
                      weight={active ? '700' : '400'}
                    >
                      {trend.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.chart}>
              <View style={styles.chartCallout}>
                <AppText color="#FFFFFF" style={styles.calloutText}>
                  Aug · {selectedTrend.value}
                </AppText>
              </View>
              <Svg width="100%" height="170" viewBox="0 0 340 170">
                <Defs>
                  <SvgLinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#DF1F2D" stopOpacity="0.18" />
                    <Stop offset="1" stopColor="#DF1F2D" stopOpacity="0.02" />
                  </SvgLinearGradient>
                </Defs>
                <Rect
                  x="8"
                  y={selectedTrend.bandY}
                  width="324"
                  height={selectedTrend.bandHeight}
                  rx="6"
                  fill={theme.isDark ? '#12322F' : '#E8F7F2'}
                />
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
                <Path
                  d={`${selectedTrend.path} L320 150 L18 150 Z`}
                  fill="url(#trendFill)"
                />
                <Path
                  d={selectedTrend.path}
                  fill="none"
                  stroke={selectedTrend.trendColor}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
                {selectedTrend.points.slice(0, -1).map(([cx, cy]) => (
                  <Circle
                    key={cx}
                    cx={cx}
                    cy={cy}
                    r="6"
                    fill={theme.colors.surface}
                    stroke="#08233D"
                    strokeWidth="3.5"
                  />
                ))}
                <Circle
                  cx={selectedTrend.points[3][0]}
                  cy={selectedTrend.points[3][1]}
                  r="6"
                  fill={theme.colors.surface}
                  stroke={selectedTrend.endColor}
                  strokeWidth="3.5"
                />
              </Svg>
            </View>
            <Pressable
              style={[
                styles.detailButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <AppText color="#FFFFFF" style={styles.detailText} weight="700">
                Open {selectedTrend.name} details
              </AppText>
            </Pressable>
          </View>

          <SectionHeader
            title="Health focus"
            aside="AI-organised priorities"
            asideColor={theme.colors.textMuted}
          />
          <FocusCard
            icon={<BookOpen color={theme.colors.primary} size={15} />}
            title="Understand Vitamin D trend"
            detail="Down across three connected reports."
          />
          <FocusCard
            icon={<CalendarDays color="#078B76" size={15} />}
            title="Questions for your next appointment"
            detail="A short, educational discussion guide."
          />
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
              Two priorities found
            </AppText>
            <AppText style={styles.footerTitle} weight="800">
              See relevant HAA options
            </AppText>
          </View>
          <Pressable
            onPress={() => navigation.navigate('HealthRecommendations')}
            style={[
              styles.recommendButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <AppText color="#FFFFFF" style={styles.recommendText} weight="700">
              Recommendations
            </AppText>
          </Pressable>
        </View>
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
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle} weight="800">
        {title}
      </AppText>
      <AppText color={asideColor} style={styles.sectionAside} weight="700">
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
    <Pressable
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
        <AppText color={theme.colors.textMuted} style={styles.focusDetail}>
          {detail}
        </AppText>
      </View>
      <ChevronRight color={theme.colors.textMuted} size={15} />
    </Pressable>
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
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniBrand: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, lineHeight: 19 },
  headerSub: { marginTop: 2, fontSize: 9, lineHeight: 11 },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 22 },
  topMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { fontSize: 9, lineHeight: 12, letterSpacing: 0.6 },
  statusPill: {
    borderRadius: 7,
    backgroundColor: '#DDF7F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 7, lineHeight: 9 },
  title: { marginTop: 8, fontSize: 23, lineHeight: 23, letterSpacing: -0.7 },
  subtitle: { marginTop: 9, fontSize: 9, lineHeight: 13 },
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
  audioLabel: { fontSize: 9, lineHeight: 11, letterSpacing: 0.55 },
  audioTitle: { marginTop: 2, fontSize: 13, lineHeight: 16 },
  audioDetail: { marginTop: 3, fontSize: 9, lineHeight: 11 },
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
  markerName: { fontSize: 10, lineHeight: 13 },
  markerValue: { marginTop: 7, fontSize: 22, lineHeight: 24 },
  markerStatus: { marginTop: 6, fontSize: 9, lineHeight: 12 },
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
  sectionTitle: { fontSize: 13, lineHeight: 17 },
  sectionAside: { fontSize: 9, lineHeight: 10 },
  chartCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  chartHeading: { flexDirection: 'row', justifyContent: 'space-between' },
  chartTitle: { fontSize: 12, lineHeight: 15 },
  chartSub: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  chartValue: { fontSize: 11, lineHeight: 14 },
  chartTabs: { flexDirection: 'row', gap: 7, marginTop: 14 },
  chartTab: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontSize: 9, lineHeight: 12 },
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
  calloutText: { fontSize: 8, lineHeight: 10 },
  detailButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
  },
  detailText: { fontSize: 11, lineHeight: 14 },
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
  focusCopy: { flex: 1, marginLeft: 9 },
  focusTitle: { fontSize: 11, lineHeight: 12 },
  focusDetail: { marginTop: 2, fontSize: 9, lineHeight: 11 },
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
  recommendButton: {
    height: 47,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  recommendText: { fontSize: 9, lineHeight: 12 },
});
