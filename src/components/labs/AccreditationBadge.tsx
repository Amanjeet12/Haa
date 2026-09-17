import BadgeCheck from 'lucide-react-native/icons/badge-check';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../AppText';
import { useAppTheme } from '../../theme';
export function AccreditationBadge({ name }: { name: string }) {
  const { theme } = useAppTheme();
  const accent = theme.isDark ? '#5EEAD4' : '#078A73';
  return <View style={[styles.badge, { backgroundColor: theme.isDark ? '#123A34' : '#DCF7EF' }]}><BadgeCheck color={accent} size={11} /><AppText color={accent} style={styles.text} weight="600">{name}</AppText></View>;
}
const styles = StyleSheet.create({ badge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 4 }, text: { fontSize: 8, lineHeight: 10 } });
