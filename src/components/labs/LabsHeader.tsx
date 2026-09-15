import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import MapPin from 'lucide-react-native/icons/map-pin';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

type Props = {
  location: string;
  labCount: number | null;
  loadingLabs: boolean;
  onBack: () => void;
  onChangeLocation: () => void;
};

export function LabsHeader({
  location,
  labCount,
  loadingLabs,
  onBack,
  onChangeLocation,
}: Props) {
  const { theme } = useAppTheme();
  return (
    <>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={onBack} style={[styles.back, { backgroundColor: theme.colors.surface }]}>
          <ChevronLeft color={theme.colors.text} size={20} />
        </Pressable>
        <AppText style={styles.title} weight="800">Labs</AppText>
        <View style={styles.spacer} />
      </View>
      <View style={[styles.location, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.pin, { backgroundColor: theme.colors.primarySoft }]}><MapPin color={theme.colors.primary} size={16} /></View>
        <View style={styles.locationCopy}>
          <AppText style={styles.locationName} weight="700">{location}</AppText>
          <AppText color={theme.colors.textMuted} style={styles.locationDetail}>
            {loadingLabs
              ? 'Checking available labs…'
              : `${labCount ?? 0} ${labCount === 1 ? 'lab' : 'labs'} available`}
          </AppText>
        </View>
        <Pressable hitSlop={10} onPress={onChangeLocation} style={styles.changeButton}>
          <AppText color={theme.colors.primary} style={styles.change} weight="700">Change</AppText>
          <ChevronDown color={theme.colors.primary} size={13} strokeWidth={2.5} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: { height: 54, alignItems: 'center', flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16 },
  back: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 22 },
  spacer: { width: 36 },
  location: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  pin: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  locationCopy: { flex: 1 },
  locationName: { fontSize: 12, lineHeight: 16 },
  locationDetail: { fontSize: 9, lineHeight: 12 },
  change: { fontSize: 9, lineHeight: 12 },
  changeButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
