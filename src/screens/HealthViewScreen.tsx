import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Check from 'lucide-react-native/icons/check';
import FileText from 'lucide-react-native/icons/file-text';
import Plus from 'lucide-react-native/icons/plus';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import UserPlus from 'lucide-react-native/icons/user-plus';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';

import { AppText, HealthFlowHeader } from '../components';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import type { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'HealthView'>;

const people = [
  { id: 'self', initial: 'K', name: 'Krishna', detail: 'Self · 2 reports' },
  { id: 'father', initial: 'F', name: 'Father', detail: '1 linked report' },
  { id: 'mother', initial: 'M', name: 'Mother', detail: '1 linked report' },
];

const reports = [
  {
    title: 'Annual Health Checkup',
    detail: 'Afiya Healthcare · 12 Aug 2026',
    connected: true,
  },
  {
    title: 'Wellness Package',
    detail: 'Dr Lal PathLabs · 05 Feb 2025',
    connected: true,
  },
  {
    title: 'Add an outside report',
    detail: 'PDF or clear report images',
    connected: false,
  },
];

const pilotItems = [
  ['Reports trends', 'See how the same markers move across connected reports.'],
  [
    'Short health check-ins',
    'Add how you feel, so results have useful personal context.',
  ],
  [
    'Relevant HAA recommendations',
    'Explore appropriate lab tests and wellness products across HAA services.',
  ],
];

export function HealthViewScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const [selectedPerson, setSelectedPerson] = useState('self');
  const [outsideReportName, setOutsideReportName] = useState<string | null>(
    null,
  );

  const chooseOutsideReport = async () => {
    try {
      const [document] = await pick({ type: [types.pdf, types.images] });
      if (!document.hasRequestedType) {
        Alert.alert('Unsupported file', 'Choose a PDF or report image.');
        return;
      }
      setOutsideReportName(document.name ?? 'Selected report');
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }
      Alert.alert(
        'Could not select report',
        'Please try choosing the file again.',
      );
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
          subtitle="AI pilot"
          onBack={navigation.goBack}
          rightIcon={<ShieldCheck color="#0A8B77" size={18} />}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleRow}>
            <View style={styles.titleCopy}>
              <AppText style={styles.title} weight="800">
                Whose health view are we building?
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.subtitle}>
                Each family profile keeps bookings, reports, questionnaires and
                AI trend summaries separate.
              </AppText>
            </View>
            <View
              style={[
                styles.familyIcon,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <UserPlus color="#FFFFFF" size={20} />
            </View>
          </View>

          <View style={styles.peopleGrid}>
            {people.map(person => {
              const selected = selectedPerson === person.id;
              return (
                <Pressable
                  key={person.id}
                  accessibilityRole="button"
                  onPress={() => setSelectedPerson(person.id)}
                  style={[
                    styles.personCard,
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
                      {
                        backgroundColor: selected
                          ? theme.colors.primary
                          : theme.colors.surfaceMuted,
                      },
                    ]}
                  >
                    <AppText
                      color={selected ? '#FFFFFF' : theme.colors.text}
                      style={styles.avatarText}
                      weight="800"
                    >
                      {person.initial}
                    </AppText>
                  </View>
                  <View style={styles.personCopy}>
                    <AppText style={styles.personName} weight="700">
                      {person.name}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.personDetail}
                    >
                      {person.detail}
                    </AppText>
                  </View>
                  {selected ? (
                    <View style={styles.selectedDot}>
                      <Check color="#FFFFFF" size={9} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              style={[
                styles.personCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                <Plus color={theme.colors.primary} size={17} />
              </View>
              <View style={styles.personCopy}>
                <AppText style={styles.personName} weight="700">
                  Add family member
                </AppText>
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.personDetail}
                >
                  Parent, child or other
                </AppText>
              </View>
            </Pressable>
          </View>

          <View
            style={[
              styles.privacyBanner,
              { backgroundColor: theme.isDark ? '#12322F' : '#DDF7F0' },
            ]}
          >
            <ShieldCheck color="#078B76" size={16} />
            <AppText color={theme.colors.textMuted} style={styles.privacyText}>
              Reports below are linked to{' '}
              <AppText
                color={theme.colors.text}
                style={styles.privacyText}
                weight="700"
              >
                Krishna · SELF
              </AppText>
            </AppText>
          </View>

          <SectionHeader
            title="Reports ready to connect"
            aside="From HAA lab partners"
          />
          <View
            style={[
              styles.reportPanel,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {reports.map((report, index) => (
              <Pressable
                key={report.title}
                accessibilityRole="button"
                onPress={report.connected ? undefined : chooseOutsideReport}
                style={[
                  styles.reportRow,
                  index < reports.length - 1 && {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View
                  style={[
                    styles.reportIcon,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}
                >
                  <FileText color={theme.colors.primary} size={16} />
                </View>
                <View style={styles.reportCopy}>
                  <AppText style={styles.reportTitle} weight="700">
                    {report.title}
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.reportDetail}
                  >
                    {report.connected
                      ? report.detail
                      : outsideReportName ?? report.detail}
                  </AppText>
                </View>
                {report.connected || outsideReportName ? (
                  <View style={styles.checkCircle}>
                    <Check color="#FFFFFF" size={11} />
                  </View>
                ) : (
                  <AppText
                    color={theme.colors.primary}
                    style={styles.addLabel}
                    weight="800"
                  >
                    ADD
                  </AppText>
                )}
              </Pressable>
            ))}
          </View>

          <SectionHeader title="What the pilot includes" />
          <View style={styles.pilotList}>
            {pilotItems.map(([title, detail], index) => (
              <View
                key={title}
                style={[
                  styles.pilotItem,
                  { backgroundColor: theme.isDark ? '#12322F' : '#DDF7F0' },
                ]}
              >
                <View style={styles.numberCircle}>
                  <AppText color="#FFFFFF" style={styles.number} weight="800">
                    {index + 1}
                  </AppText>
                </View>
                <View style={styles.pilotCopy}>
                  <AppText style={styles.pilotTitle} weight="700">
                    {title}
                  </AppText>
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.pilotDetail}
                  >
                    {detail}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.disclaimer}>
            <ShieldCheck color="#0A8B77" size={13} />
            <AppText
              color={theme.colors.textMuted}
              style={styles.disclaimerText}
            >
              Your health view is private and educational. It does not provide a
              diagnosis.
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
          <View>
            <AppText
              color={theme.colors.textMuted}
              style={styles.footerEyebrow}
            >
              2 reports found
            </AppText>
            <AppText style={styles.footerTitle} weight="800">
              Ready to build your view
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('HealthCheckIn')}
            style={[
              styles.continueButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <AppText color="#FFFFFF" style={styles.continueText} weight="700">
              Continue
            </AppText>
            <ArrowRight color="#FFFFFF" size={15} />
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SectionHeader({ title, aside }: { title: string; aside?: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle} weight="800">
        {title}
      </AppText>
      {aside ? (
        <AppText color={theme.colors.textMuted} style={styles.sectionAside}>
          {aside}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  miniBrand: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: { fontSize: 15, lineHeight: 18 },
  brandSub: { marginTop: 1, textAlign: 'center', fontSize: 8, lineHeight: 10 },
  content: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  titleCopy: { flex: 1 },
  title: { fontSize: 23, lineHeight: 25, letterSpacing: -0.7 },
  subtitle: { marginTop: 9, fontSize: 10, lineHeight: 14 },
  familyIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
    marginTop: 17,
  },
  personCard: {
    width: '48.5%',
    minHeight: 63,
    borderWidth: 1,
    borderRadius: 13,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 11 },
  personCopy: { flex: 1, marginLeft: 9 },
  personName: { fontSize: 10, lineHeight: 13 },
  personDetail: { marginTop: 2, fontSize: 8, lineHeight: 10 },
  selectedDot: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DF1F2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyBanner: {
    height: 39,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 10,
  },
  privacyText: { fontSize: 10, lineHeight: 11 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 14, lineHeight: 18 },
  sectionAside: { fontSize: 8, lineHeight: 11 },
  reportPanel: { borderWidth: 1, borderRadius: 15, overflow: 'hidden' },
  reportRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },
  reportIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCopy: { flex: 1, marginLeft: 10 },
  reportTitle: { fontSize: 10, lineHeight: 13 },
  reportDetail: { marginTop: 2, fontSize: 8, lineHeight: 10 },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#078B76',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { fontSize: 8, lineHeight: 11 },
  pilotList: { gap: 7 },
  pilotItem: {
    minHeight: 53,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  numberCircle: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: '#078B76',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontSize: 10 },
  pilotCopy: { flex: 1, marginLeft: 10 },
  pilotTitle: { fontSize: 11, lineHeight: 13 },
  pilotDetail: { marginTop: 1, fontSize: 9, lineHeight: 11 },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 3,
  },
  disclaimerText: { flex: 1, fontSize: 9, lineHeight: 11 },
  footer: {
    minHeight: 76,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerEyebrow: { fontSize: 8, lineHeight: 10 },
  footerTitle: { marginTop: 2, fontSize: 13, lineHeight: 16 },
  continueButton: {
    height: 48,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
  },
  continueText: { fontSize: 10, lineHeight: 13 },
});
