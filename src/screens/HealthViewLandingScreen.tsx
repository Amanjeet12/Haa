import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Check from 'lucide-react-native/icons/check';
import Sparkles from 'lucide-react-native/icons/sparkles';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FamilyMember, getFamilyMembers } from '../api/familyMembers';
import {
  FamilyReportAnalysis,
  getFamilyMemberReportAnalyses,
} from '../api/reportAnalyses';
import { AppText, HealthFlowHeader } from '../components';
import { useAppDispatch, useAppSelector } from '../store';
import { clearHealthViewLoginReturn } from '../store/authSlice';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'HealthView'>;
type Tab = 'new' | 'history';

function displayName(member: FamilyMember) {
  return member.isDefault || member.relation.toLowerCase() === 'self'
    ? 'Myself'
    : member.name;
}

function initials(member: FamilyMember) {
  return member.isDefault || member.relation.toLowerCase() === 'self'
    ? 'ME'
    : member.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('');
}

function formatDate(value: string | null | undefined) {
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

export function HealthViewLandingScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.auth.session?.token);
  const [tab, setTab] = useState<Tab>('new');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(false);
  const [analyses, setAnalyses] = useState<FamilyReportAnalysis[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(false);
  const [analysesError, setAnalysesError] = useState(false);
  const [nextStart, setNextStart] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const selectedMember = members.find(
    member => member.member_id === selectedId,
  );

  const loadMembers = useCallback(async () => {
    if (!token) {
      setMembersLoading(false);
      return;
    }
    setMembersLoading(true);
    setMembersError(false);
    try {
      const family = await getFamilyMembers(token);
      setMembers(family);
      setSelectedId(current =>
        family.some(member => member.member_id === current)
          ? current
          : (
              family.find(
                member =>
                  member.isDefault || member.relation.toLowerCase() === 'self',
              ) ?? family[0]
            )?.member_id ?? null,
      );
    } catch {
      setMembersError(true);
    } finally {
      setMembersLoading(false);
    }
  }, [token]);

  const loadAnalyses = useCallback(
    async (start = 0) => {
      if (!token || selectedId === null) {
        setAnalyses([]);
        setNextStart(null);
        return;
      }
      setAnalysesLoading(true);
      setAnalysesError(false);
      try {
        const result = await getFamilyMemberReportAnalyses(
          token,
          selectedId,
          start,
        );
        setAnalyses(current =>
          start === 0 ? result.analyses : [...current, ...result.analyses],
        );
        setNextStart(result.meta.hasMore ? result.meta.nextStart : null);
        setTotal(result.meta.total);
      } catch {
        setAnalysesError(true);
      } finally {
        setAnalysesLoading(false);
      }
    },
    [token, selectedId],
  );

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers]),
  );
  useFocusEffect(
    useCallback(() => {
      loadAnalyses();
    }, [loadAnalyses]),
  );

  const chooseMember = (id: number) => {
    setSelectedId(id);
    setAnalyses([]);
  };
  const recent = analyses[0];

  const analysisCard = (analysis: FamilyReportAnalysis) => (
    <Pressable
      key={analysis.report_analysis_id}
      accessibilityRole="button"
      onPress={() =>
        selectedId !== null &&
        navigation.navigate('HealthTrends', {
          analysisId: analysis.report_analysis_id,
          memberId: selectedId,
          memberName: selectedMember ? displayName(selectedMember) : undefined,
          outsideReports: [],
          answers: [],
          reportCount: analysis.source_pdf_urls.length,
          reportDate: analysis.report_date,
          reportTitle: analysis.headline ?? undefined,
        })
      }
      style={[
        styles.analysisCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.sparkleIcon,
          { backgroundColor: theme.colors.primarySoft },
        ]}
      >
        <Sparkles color={theme.colors.primary} size={18} />
      </View>
      <View style={styles.cardCopy}>
        <AppText style={styles.cardTitle} weight="800" numberOfLines={1}>
          {analysis.headline || 'Report analysis'}
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.cardDetail}>
          {analysis.source_pdf_urls.length}{' '}
          {analysis.source_pdf_urls.length === 1 ? 'report' : 'reports'} ·
          Analyzed {formatDate(analysis.analyzed_at ?? analysis.createdAt)}
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.cardDetail}>
          Report date: {formatDate(analysis.report_date)}
        </AppText>
      </View>
      <ArrowRight color={theme.colors.primary} size={18} />
    </Pressable>
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
          title="HAA Health View"
          subtitle="AI pilot"
          onBack={() => {
            dispatch(clearHealthViewLoginReturn());
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.replace('HomeLanding');
          }}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepRow}>
            <AppText color={theme.colors.textMuted} style={styles.stepText}>
              STEP 1 OF 3
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.stepText}>
              Person
            </AppText>
          </View>
          <View style={styles.progressRow}>
            <View
              style={[
                styles.progress,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <View
              style={[
                styles.progress,
                { backgroundColor: theme.colors.border },
              ]}
            />
            <View
              style={[
                styles.progress,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </View>
          <AppText style={styles.heroTitle} weight="800">
            Your reports. Your clarity.
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.heroSubtitle}>
            Start a new analysis or revisit your previous results.
          </AppText>
          <View
            style={[
              styles.tabs,
              { backgroundColor: theme.colors.surfaceMuted },
            ]}
          >
            {(['new', 'history'] as const).map(item => (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === item }}
                onPress={() => {
                  setTab(item);
                }}
                style={[
                  styles.tab,
                  tab === item && { backgroundColor: theme.colors.surface },
                ]}
              >
                <AppText
                  color={
                    tab === item ? theme.colors.text : theme.colors.textMuted
                  }
                  style={styles.tabText}
                  weight={tab === item ? '800' : '500'}
                >
                  {item === 'new' ? '+ New analysis' : '◷ Previous analyses'}
                </AppText>
              </Pressable>
            ))}
          </View>

          {tab === 'new' ? (
            <>
              {recent ? (
                <>
                  <View style={styles.sectionHeadingRow}>
                    <AppText style={styles.sectionTitle} weight="800">
                      Recent analysis
                    </AppText>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setTab('history')}
                    >
                      <AppText
                        color={theme.colors.primary}
                        style={styles.historyLink}
                        weight="700"
                      >
                        View history →
                      </AppText>
                    </Pressable>
                  </View>
                  {analysisCard(recent)}
                </>
              ) : null}
              {analysesLoading && !analyses.length ? (
                <ActivityIndicator
                  color={theme.colors.primary}
                  style={styles.state}
                />
              ) : null}
              {analysesError ? (
                <Pressable onPress={() => loadAnalyses()} style={styles.state}>
                  <AppText color={theme.colors.primary}>
                    Could not load analyses. Tap to retry.
                  </AppText>
                </Pressable>
              ) : null}
              <View style={styles.section}>
                <AppText style={styles.sectionTitle} weight="800">
                  Choose a profile
                </AppText>
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.sectionSubtitle}
                >
                  Whose reports would you like to understand?
                </AppText>
                {membersLoading ? (
                  <ActivityIndicator
                    color={theme.colors.primary}
                    style={styles.state}
                  />
                ) : null}
                {membersError ? (
                  <Pressable onPress={loadMembers} style={styles.state}>
                    <AppText color={theme.colors.primary}>
                      Could not load profiles. Tap to retry.
                    </AppText>
                  </Pressable>
                ) : null}
                {members.map(member => {
                  const selected = member.member_id === selectedId;
                  return (
                    <Pressable
                      key={member.member_id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => chooseMember(member.member_id)}
                      style={[
                        styles.profileCard,
                        {
                          backgroundColor: selected
                            ? theme.colors.primarySoft2
                            : theme.colors.surface,
                          borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: theme.colors.primarySoft },
                        ]}
                      >
                        <AppText color={theme.colors.primary} weight="800">
                          {initials(member)}
                        </AppText>
                      </View>
                      <View style={styles.cardCopy}>
                        <AppText style={styles.profileName} weight="800">
                          {displayName(member)}
                        </AppText>
                        <AppText
                          color={theme.colors.textMuted}
                          style={styles.profileDetail}
                        >
                          {selected
                            ? 'Your reports & previous analyses'
                            : `${member.relation} · ${member.name}`}
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
                        {selected ? <Check color="#FFFFFF" size={12} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
                <View style={styles.profilePrivacy}>
                  <ShieldCheck color={theme.colors.success} size={13} />
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.profilePrivacyText}
                  >
                    Each profile has its own reports and analysis history.
                  </AppText>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.section}>
                <AppText style={styles.sectionTitle} weight="800">
                  View history for
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.memberRail}
                >
                  {members.map(member => {
                    const selected = member.member_id === selectedId;
                    return (
                      <Pressable
                        key={member.member_id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => chooseMember(member.member_id)}
                        style={[
                          styles.memberTile,
                          {
                            backgroundColor: selected
                              ? theme.colors.primarySoft2
                              : theme.colors.surface,
                            borderColor: selected
                              ? theme.colors.primary
                              : theme.colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.smallAvatar,
                            {
                              backgroundColor: selected
                                ? theme.colors.primarySoft
                                : theme.colors.surfaceMuted,
                            },
                          ]}
                        >
                          <AppText
                            color={
                              selected
                                ? theme.colors.primary
                                : theme.colors.textMuted
                            }
                            weight="800"
                          >
                            {initials(member)}
                          </AppText>
                        </View>
                        <AppText
                          color={
                            selected ? theme.colors.primary : theme.colors.text
                          }
                          style={styles.memberName}
                          weight={selected ? '800' : '500'}
                          numberOfLines={1}
                        >
                          {displayName(member)}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
              <View
                style={[styles.sectionHeadingRow, styles.historyHeadingRow]}
              >
                <AppText style={styles.sectionTitle} weight="800">
                  Analysis history
                </AppText>
                <AppText color={theme.colors.textMuted} style={styles.count}>
                  {selectedMember
                    ? `${displayName(selectedMember)} · ${total}`
                    : ''}
                </AppText>
              </View>
              <AppText
                color={theme.colors.textMuted}
                style={[styles.sectionSubtitle, styles.historySubtitle]}
              >
                Previous analyses for your profile. Open one to view its results
                and trends.
              </AppText>
              {analyses.map(analysisCard)}
              {analysesLoading ? (
                <ActivityIndicator
                  color={theme.colors.primary}
                  style={styles.state}
                />
              ) : null}
              {analysesError ? (
                <Pressable
                  onPress={() =>
                    loadAnalyses(analyses.length ? nextStart ?? 0 : 0)
                  }
                  style={styles.state}
                >
                  <AppText color={theme.colors.primary}>
                    Could not load analyses. Tap to retry.
                  </AppText>
                </Pressable>
              ) : null}
              {!analysesLoading && !analysesError && !analyses.length ? (
                <AppText color={theme.colors.textMuted} style={styles.empty}>
                  No analyses for this profile yet.
                </AppText>
              ) : null}
              {nextStart !== null && !analysesLoading ? (
                <Pressable
                  onPress={() => loadAnalyses(nextStart)}
                  style={styles.loadMore}
                >
                  <AppText color={theme.colors.primary} weight="700">
                    Load more
                  </AppText>
                </Pressable>
              ) : null}
            </>
          )}
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
          <View style={styles.footerCopy}>
            <AppText color={theme.colors.textMuted} style={styles.footerLabel}>
              Selected profile
            </AppText>
            <AppText style={styles.footerName} weight="800" numberOfLines={1}>
              {selectedMember
                ? displayName(selectedMember)
                : 'Choose a profile'}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: selectedId === null }}
            disabled={selectedId === null}
            onPress={() =>
              selectedId !== null &&
              navigation.navigate('HealthReportSelection', {
                memberId: selectedId,
              })
            }
            style={[
              styles.footerButton,
              {
                backgroundColor:
                  selectedId === null
                    ? theme.colors.textMuted
                    : theme.colors.primary,
              },
            ]}
          >
            <AppText
              color="#FFFFFF"
              weight="800"
              style={styles.footerButtonText}
            >
              {tab === 'new' ? 'Select reports' : 'Start new analysis'} →
            </AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 30 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepText: { fontSize: 11, lineHeight: 15 },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  progress: { flex: 1, height: 4, borderRadius: 3 },
  heroTitle: {
    marginTop: 24,
    fontSize: 23,
    lineHeight: 28,
    letterSpacing: -0.8,
  },
  heroSubtitle: { marginTop: 10, fontSize: 12, lineHeight: 18 },
  tabs: { flexDirection: 'row', padding: 5, borderRadius: 15, marginTop: 22 },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: { fontSize: 12 },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  historyHeadingRow: { marginTop: 8, marginBottom: 0 },
  section: { marginTop: 26 },
  sectionTitle: { fontSize: 17, lineHeight: 22, letterSpacing: -0.3 },
  sectionSubtitle: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 12,
  },
  historySubtitle: { marginTop: 4 },
  historyLink: { fontSize: 12 },
  analysisCard: {
    minHeight: 91,
    borderWidth: 1,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
  },
  sparkleIcon: {
    width: 42,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 13, lineHeight: 18 },
  cardDetail: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  profileCard: {
    minHeight: 82,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    marginBottom: 11,
  },
  avatar: {
    width: 47,
    height: 47,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  profileName: { fontSize: 14, lineHeight: 19 },
  profileDetail: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  profilePrivacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
    marginBottom: 7,
  },
  profilePrivacyText: { flex: 1, fontSize: 10, lineHeight: 14 },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  memberRail: { gap: 9, paddingVertical: 12 },
  memberTile: {
    width: 106,
    height: 106,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  memberName: { fontSize: 11, textAlign: 'center' },
  count: { fontSize: 10, paddingHorizontal: 9, paddingVertical: 6 },
  state: { marginVertical: 15, alignSelf: 'center' },
  empty: { marginVertical: 12, fontSize: 11, lineHeight: 16 },
  loadMore: { alignSelf: 'center', padding: 12 },
  footer: {
    minHeight: 78,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerCopy: { flex: 1, minWidth: 0 },
  footerLabel: { fontSize: 10, lineHeight: 14 },
  footerName: { fontSize: 14, lineHeight: 19, marginTop: 2 },
  footerButton: {
    minHeight: 51,
    borderRadius: 14,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonText: { fontSize: 12 },
});
