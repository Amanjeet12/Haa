import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ApiLab } from '../../api/labs';
import { useAppTheme } from '../../theme';
import { formatINR } from '../../utils/currency';
import { AppText } from '../AppText';
import { toLab } from './toLab';
import { Lab } from './types';

type Props = {
  labs: ApiLab[];
  onSeeAll: () => void;
  onSelect: (lab: Lab) => void;
};

export function FeaturedLabs({ labs, onSeeAll, onSelect }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText style={styles.heading} weight="700">
            Featured labs near you
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.subtitle}>
            Selected from labs serving this location.
          </AppText>
        </View>
        <Pressable accessibilityRole="button" onPress={onSeeAll}>
          <AppText
            color={theme.colors.primary}
            style={styles.seeAll}
            weight="700"
          >
            See all
          </AppText>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.carouselViewport}
        contentContainerStyle={styles.carousel}
      >
        {labs.map(item => {
          const lab = toLab(item);
          const initials = lab.name
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase();
          const showLogo = Boolean(
            lab.image && !lab.image.toLowerCase().endsWith('.svg'),
          );
          return (
            <Pressable
              key={lab.id}
              accessibilityRole="button"
              accessibilityLabel={`View ${lab.name}`}
              onPress={() => onSelect(lab)}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.cover,
                  { backgroundColor: theme.colors.primarySoft },
                ]}
              >
                {lab.banner ? (
                  <Image
                    source={{ uri: lab.banner }}
                    resizeMode="cover"
                    style={styles.coverImage}
                  />
                ) : null}
                <View
                  style={[
                    styles.logo,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  {showLogo ? (
                    <Image
                      source={{ uri: lab.image }}
                      resizeMode="contain"
                      style={styles.logoImage}
                    />
                  ) : (
                    <AppText style={styles.initials} weight="800">
                      {initials}
                    </AppText>
                  )}
                </View>
                {lab.verified || lab.partner ? (
                  <View
                    style={[
                      styles.verified,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <AppText
                      color={theme.colors.primary}
                      style={styles.verifiedText}
                      weight="800"
                    >
                      HAA VERIFIED
                    </AppText>
                  </View>
                ) : null}
              </View>
              <View style={styles.body}>
                <View style={styles.nameRow}>
                  <AppText style={styles.name} weight="700" numberOfLines={1}>
                    {lab.name}
                  </AppText>
                  {lab.rating > 0 ? (
                    <AppText
                      color={theme.colors.warning}
                      style={styles.rating}
                      weight="800"
                    >
                      ★ {lab.rating.toFixed(1)}
                    </AppText>
                  ) : null}
                </View>
                <AppText color={theme.colors.textMuted} style={styles.meta}>
                  Home collection
                </AppText>
                <View style={styles.certRow}>
                  {lab.certifications.slice(0, 2).map(cert => (
                    <View
                      key={cert}
                      style={[
                        styles.cert,
                        { backgroundColor: theme.colors.surfaceMuted },
                      ]}
                    >
                      <AppText
                        color={theme.colors.success}
                        style={styles.certText}
                        weight="700"
                        numberOfLines={1}
                      >
                        {cert} Accredited
                      </AppText>
                    </View>
                  ))}
                </View>
                <View
                  style={[
                    styles.footer,
                    { borderTopColor: theme.colors.border },
                  ]}
                >
                  <AppText
                    color={theme.colors.textMuted}
                    style={styles.priceLabel}
                  >
                    {lab.price > 0 ? 'Tests from ' : 'Tests and prices'}
                    {lab.price > 0 ? (
                      <AppText style={styles.price} weight="800">
                        {formatINR(lab.price)}
                      </AppText>
                    ) : null}
                  </AppText>
                  <AppText
                    color={theme.colors.primary}
                    style={styles.view}
                    weight="700"
                  >
                    View lab →
                  </AppText>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  headerCopy: { flex: 1 },
  heading: { fontSize: 18, lineHeight: 21, letterSpacing: -0.4 },
  subtitle: { marginTop: 3, fontSize: 11, lineHeight: 15 },
  seeAll: { marginLeft: 8, fontSize: 11, lineHeight: 16 },
  carouselViewport: { marginRight: -16 },
  carousel: { gap: 12, paddingRight: 20 },
  card: { width: 304, overflow: 'hidden', borderRadius: 19, borderWidth: 1 },
  cover: { height: 122, overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  logo: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    width: 74,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: '90%', height: '90%' },
  initials: { fontSize: 19, lineHeight: 24 },
  verified: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 13,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  verifiedText: { fontSize: 8, lineHeight: 10 },
  body: { paddingHorizontal: 14, paddingTop: 13 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flex: 1, fontSize: 14, lineHeight: 18 },
  rating: { fontSize: 11, lineHeight: 15 },
  meta: { marginTop: 5, fontSize: 10, lineHeight: 14 },
  certRow: { flexDirection: 'row', gap: 5, marginTop: 11, minHeight: 28 },
  cert: {
    maxWidth: '49%',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  certText: { fontSize: 8, lineHeight: 11 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  priceLabel: { fontSize: 10, lineHeight: 16 },
  price: { fontSize: 16, lineHeight: 19 },
  view: { fontSize: 10, lineHeight: 15 },
});
