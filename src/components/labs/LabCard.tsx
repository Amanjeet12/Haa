import BadgeCheck from 'lucide-react-native/icons/badge-check';
import Clock3 from 'lucide-react-native/icons/clock-3';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import Star from 'lucide-react-native/icons/star';
import React from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';
import { AccreditationBadge } from './AccreditationBadge';
import { Lab } from './types';

export function LabCard({ lab, onPress }: { lab: Lab; onPress?: () => void }) {
  const { theme } = useAppTheme();
  const canRenderLogo = lab.image && !lab.image.toLowerCase().endsWith('.svg');
  const fallbackCoverStyle = { backgroundColor: lab.accent };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <ImageBackground
        imageStyle={styles.coverImage}
        source={lab.banner ? { uri: lab.banner } : undefined}
        style={[styles.cover, !lab.banner && fallbackCoverStyle]}
      >
        <LinearGradient
          colors={['rgba(8,35,61,0)', 'rgba(8,35,61,0.08)', 'rgba(8,35,61,0.58)']}
          locations={[0, 0.54, 1]}
          style={styles.imageGradient}
        >
          {!lab.banner ? (
            <FlaskConical
              color="rgba(8,35,61,0.15)"
              size={76}
              strokeWidth={1.2}
              style={styles.coverDecoration}
            />
          ) : null}
          <View style={styles.logo}>
            {canRenderLogo ? (
              <Image
                resizeMode="contain"
                source={{ uri: lab.image }}
                style={styles.logoImage}
              />
            ) : (
              <FlaskConical color={theme.colors.primary} size={20} />
            )}
            <AppText numberOfLines={1} style={styles.logoText} weight="800">
              {lab.name.split(' ')[0]}
            </AppText>
          </View>
          {lab.verified || lab.partner ? (
            <View style={styles.verified}>
              <BadgeCheck color={theme.colors.text} size={12} />
              <AppText style={styles.verifiedText} weight="700">
                {lab.partner ? 'Premium Partner' : 'HAA Verified'}
              </AppText>
            </View>
          ) : null}
        </LinearGradient>
      </ImageBackground>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <AppText
            color={theme.colors.primary}
            numberOfLines={1}
            style={styles.name}
            weight="800"
          >
            {lab.name}
          </AppText>
          <View style={styles.rating}>
            <Star color="#D97706" fill="#D97706" size={15} />
            <AppText style={styles.ratingText} weight="800">
              {lab.rating.toFixed(1)}
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.reviews}>
              ({lab.reviews} review{lab.reviews === 1 ? '' : 's'})
            </AppText>
          </View>
        </View>

        <View style={styles.badges}>
          {lab.certifications.map(item => (
            <AccreditationBadge key={item} name={item} />
          ))}
        </View>

        <View
          style={[styles.meta, { borderBottomColor: theme.colors.border }]}
        >
          <Clock3 color={theme.colors.textMuted} size={14} />
          <AppText color={theme.colors.textMuted} style={styles.metaText}>
            Reports within {lab.reportTime}
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.from}>
            From
          </AppText>
          <AppText style={styles.price} weight="800">
            ₹{lab.price}
          </AppText>
        </View>

        <View style={styles.specialties}>
          {lab.specialties.map(item => (
            <View
              key={item}
              style={[
                styles.specialty,
                { backgroundColor: theme.colors.surfaceMuted },
              ]}
            >
              <AppText
                color={theme.colors.textMuted}
                style={styles.specialtyText}
              >
                {item}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    elevation: 5,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  cover: { height: 112 },
  coverImage: { resizeMode: 'cover' },
  imageGradient: { flex: 1, justifyContent: 'flex-end', padding: 13 },
  coverDecoration: { position: 'absolute', right: 22, top: 17 },
  logo: {
    minWidth: 112,
    maxWidth: 150,
    height: 44,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  logoImage: { width: 34, height: 27 },
  logoText: { flexShrink: 1, fontSize: 10, lineHeight: 13 },
  verified: {
    position: 'absolute',
    right: 10,
    top: 10,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    elevation: 2,
  },
  verifiedText: { fontSize: 8, lineHeight: 10 },
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 13 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  name: { flex: 1, fontSize: 14, lineHeight: 18 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, lineHeight: 15 },
  reviews: { fontSize: 7, lineHeight: 9 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 11,
    paddingBottom: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metaText: { flexShrink: 1, fontSize: 9, lineHeight: 12 },
  from: { marginLeft: 'auto', fontSize: 9, lineHeight: 12 },
  price: { fontSize: 16, lineHeight: 19 },
  specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  specialty: { borderRadius: 11, paddingHorizontal: 10, paddingVertical: 6 },
  specialtyText: { fontSize: 8, lineHeight: 10 },
});
