import BadgeCheck from 'lucide-react-native/icons/badge-check';
import Clock3 from 'lucide-react-native/icons/clock-3';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import Star from 'lucide-react-native/icons/star';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';
import { AccreditationBadge } from './AccreditationBadge';
import { Lab } from './types';

export function LabCard({ lab }: { lab: Lab }) {
  const { theme } = useAppTheme();
  return (
    <Pressable style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}>
      <LinearGradient colors={[lab.accent, '#E6EDF2']} end={{ x: 1, y: 1 }} style={styles.cover}>
        <View style={styles.logo}><FlaskConical color={theme.colors.primary} size={19} /><AppText style={styles.logoText} weight="800">{lab.name.split(' ')[0]}</AppText></View>
        <FlaskConical color="rgba(8,35,61,.22)" size={70} strokeWidth={1.2} />
        {(lab.verified || lab.partner) && <View style={styles.verified}><BadgeCheck color={theme.colors.text} size={11} /><AppText style={styles.verifiedText} weight="700">{lab.partner ? 'Premium Partner' : 'HAA Verified'}</AppText></View>}
      </LinearGradient>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <AppText color={theme.colors.primary} numberOfLines={1} style={styles.name} weight="800">{lab.name}</AppText>
          <View style={styles.rating}><Star color="#F59E0B" fill="#F59E0B" size={12} /><AppText style={styles.ratingText} weight="800">{lab.rating.toFixed(1)}</AppText><AppText color={theme.colors.textMuted} style={styles.reviews}>({lab.reviews} reviews)</AppText></View>
        </View>
        <View style={styles.badges}>{lab.accreditations.map(item => <AccreditationBadge key={item} name={item} />)}</View>
        <View style={[styles.meta, { borderBottomColor: theme.colors.border }]}><Clock3 color={theme.colors.textMuted} size={12} /><AppText color={theme.colors.textMuted} style={styles.metaText}>Reports within {lab.reportTime}</AppText><AppText color={theme.colors.textMuted} style={styles.from}>From</AppText><AppText style={styles.price} weight="800">₹{lab.price}</AppText></View>
        <View style={styles.specialties}>{lab.specialties.map(item => <View key={item} style={[styles.specialty, { backgroundColor: theme.colors.surfaceMuted }]}><AppText color={theme.colors.textMuted} style={styles.specialtyText}>{item}</AppText></View>)}</View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12, elevation: 4, shadowOpacity: .1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cover: { height: 89, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, logo: { minWidth: 70, height: 31, borderRadius: 7, backgroundColor: '#FFFFFF', paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }, logoText: { fontSize: 9, lineHeight: 11 },
  verified: { position: 'absolute', right: 8, top: 8, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 7, height: 22, flexDirection: 'row', alignItems: 'center', gap: 3 }, verifiedText: { fontSize: 7, lineHeight: 9 }, body: { padding: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, name: { flex: 1, fontSize: 12, lineHeight: 16 }, rating: { flexDirection: 'row', alignItems: 'center', gap: 3 }, ratingText: { fontSize: 10, lineHeight: 12 }, reviews: { fontSize: 7, lineHeight: 9 }, badges: { flexDirection: 'row', gap: 6, marginTop: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingBottom: 9, borderBottomWidth: StyleSheet.hairlineWidth, gap: 5 }, metaText: { fontSize: 8, lineHeight: 10 }, from: { marginLeft: 'auto', fontSize: 8, lineHeight: 10 }, price: { fontSize: 13, lineHeight: 16 },
  specialties: { flexDirection: 'row', gap: 6, marginTop: 9 }, specialty: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 }, specialtyText: { fontSize: 7, lineHeight: 9 },
});
