import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Activity from 'lucide-react-native/icons/activity';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText, BrandMark, Card, Screen } from '../components';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { formatDisplayDate } from '../utils/formatters';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const healthMetrics = [
  { label: 'Heart rate', value: '--', unit: 'bpm' },
  { label: 'Daily steps', value: '--', unit: 'steps' },
];

export function HomeScreen({ navigation }: Props) {
  const { theme } = useAppTheme();

  return (
    <Screen>
      <View style={styles.intro}>
        <BrandMark />
        <View style={styles.introCopy}>
          <AppText variant="caption" color={theme.colors.textMuted}>
            {formatDisplayDate(new Date())}
          </AppText>
          <AppText variant="title" weight="800">
            Your health, in one place
          </AppText>
        </View>
      </View>

      <Card
        style={[styles.hero, { backgroundColor: theme.colors.primarySoft }]}
      >
        <View style={styles.heroIcon}>
          <ShieldCheck color={theme.colors.primary} size={28} />
        </View>
        <AppText variant="subtitle" weight="700">
          Finish setting up your profile
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.heroBody}>
          Add your basic health details to receive a more useful daily overview.
        </AppText>
        <AppButton
          label="Get started"
          onPress={() => navigation.navigate('Settings')}
          icon={<ChevronRight color={theme.colors.onPrimary} size={19} />}
        />
      </Card>

      <AppText variant="subtitle" weight="700" style={styles.sectionTitle}>
        Today
      </AppText>
      <View style={styles.metricsRow}>
        {healthMetrics.map((metric, index) => (
          <Card key={metric.label} style={styles.metricCard}>
            {index === 0 ? (
              <Activity color={theme.colors.primary} size={22} />
            ) : (
              <CalendarDays color={theme.colors.primary} size={22} />
            )}
            <AppText variant="title" weight="800" style={styles.metricValue}>
              {metric.value}
            </AppText>
            <AppText variant="caption" color={theme.colors.textMuted}>
              {metric.label} · {metric.unit}
            </AppText>
          </Card>
        ))}
      </View>

      <Card style={styles.emptyCard}>
        <AppText variant="subtitle" weight="700">
          No activity yet
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.emptyBody}>
          Your appointments, medications, and health activity will appear here.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  introCopy: {
    flex: 1,
    gap: 2,
  },
  hero: {
    padding: 22,
  },
  heroIcon: {
    marginBottom: 18,
  },
  heroBody: {
    marginTop: 6,
    marginBottom: 20,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
  },
  metricValue: {
    marginTop: 18,
  },
  emptyCard: {
    marginTop: 12,
  },
  emptyBody: {
    marginTop: 4,
  },
});
