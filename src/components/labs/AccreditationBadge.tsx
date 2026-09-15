import BadgeCheck from 'lucide-react-native/icons/badge-check';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../AppText';
import { Accreditation } from './types';

export function AccreditationBadge({ name }: { name: Accreditation }) {
  return <View style={styles.badge}><BadgeCheck color="#078A73" size={11} /><AppText color="#078A73" style={styles.text} weight="600">{name} Accredited</AppText></View>;
}
const styles = StyleSheet.create({ badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#DCF7EF', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 4 }, text: { fontSize: 8, lineHeight: 10 } });
