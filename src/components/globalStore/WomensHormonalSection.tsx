import ChevronRight from 'lucide-react-native/icons/chevron-right';
import React from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { images } from '../../assets/images';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

const products = [
  { id: 'balance', country: 'Featured', brand: 'EVERA WELLNESS', name: 'Advanced Hormone Balance Complex', detail: '60 plant-based capsules', price: '₹2,499', arrival: '5–8 days', image: images.onboardingCards },
  { id: 'comfort', country: 'Featured', brand: 'NOVA FEMME', name: 'Electric Menstrual Comfort Belt', detail: 'Three heat settings · USB-C', price: '₹3,299', arrival: '5–7 days', image: images.homeBanner },
  { id: 'tracking', country: '🇺🇸 United States', brand: 'OVIA TECH', name: 'Fertility Tracking Sensor Kit', detail: 'Reusable sensor · App-enabled', price: '₹5,999', arrival: '7–10 days', image: images.careImage },
  { id: 'care', country: '🇨🇦 Canada', brand: 'FLORA CARE', name: 'Daily Intimate Care Microbiome Care', detail: '30 delayed-release capsules', price: '₹2,199', arrival: '7–9 days', image: images.homeBanner },
] as const;

export function WomensHormonalSection({ onSeeAll }: { onSeeAll: () => void }) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 36 - 10) / 2;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><AppText style={styles.heading} weight="800">Women’s & hormonal health++</AppText><AppText color={theme.colors.textMuted} style={styles.subtitle}>Specialist tools and daily support</AppText></View>
        <Pressable onPress={onSeeAll}><AppText color={theme.colors.primary} style={styles.viewAll} weight="800">See all</AppText></Pressable>
      </View>

      <View style={styles.grid}>
        {products.map(product => (
            <View key={product.id} style={[styles.card, { width: cardWidth, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, shadowColor: theme.colors.shadow }]}>
              <View style={styles.art}>
                <Image source={product.image} resizeMode="cover" style={styles.image} />
                <View style={styles.country}><AppText style={styles.countryText} weight="800">{product.country}</AppText></View>
              </View>
              <View style={styles.body}>
                <AppText color={theme.colors.primary} style={styles.brand} weight="800">{product.brand}</AppText>
                <AppText style={styles.name} numberOfLines={2} weight="800">{product.name}</AppText>
                <AppText color={theme.colors.textMuted} style={styles.detail} numberOfLines={1}>{product.detail}</AppText>
                <View style={styles.priceRow}><AppText style={styles.price} weight="800">{product.price}</AppText><View><AppText color={theme.colors.textMuted} style={styles.arrivalLabel}>Arrives in</AppText><AppText color={theme.colors.textMuted} style={styles.arrival} weight="700">{product.arrival}</AppText></View></View>
                <Pressable style={[styles.add, { borderColor: theme.colors.primary }]}><AppText color={theme.colors.primary} style={styles.addText} weight="800">ADD TO BAG</AppText></Pressable>
              </View>
            </View>
        ))}
      </View>

      <Pressable onPress={onSeeAll} style={[styles.seeAll, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.thumb}><Image source={images.careImage} resizeMode="cover" style={styles.image} /></View><AppText style={styles.seeAllText} weight="800">See all Women’s & hormonal health</AppText><ChevronRight color={theme.colors.text} size={15} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 18, marginBottom: 10 }, headerCopy: { flex: 1 },
  heading: { fontSize: 19, lineHeight: 23, letterSpacing: -0.4 }, subtitle: { marginTop: 3, fontSize: 9, lineHeight: 12 }, viewAll: { paddingBottom: 1, fontSize: 9, lineHeight: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 18 },
  card: { overflow: 'hidden', borderWidth: 1, borderRadius: 16, elevation: 2, shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  art: { aspectRatio: 1.25, overflow: 'hidden', backgroundColor: '#F5E8EC' }, image: { width: '100%', height: '100%' },
  country: { position: 'absolute', left: 6, top: 6, maxWidth: '68%', borderRadius: 7, backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 4 }, countryText: { fontSize: 6, lineHeight: 8 },
  body: { minHeight: 141, padding: 8 }, brand: { fontSize: 7, lineHeight: 9, letterSpacing: 0.35 }, name: { minHeight: 34, marginTop: 3, fontSize: 11, lineHeight: 14 }, detail: { marginTop: 4, fontSize: 7, lineHeight: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }, price: { fontSize: 12, lineHeight: 15 }, arrivalLabel: { textAlign: 'right', fontSize: 6, lineHeight: 8 }, arrival: { textAlign: 'right', fontSize: 7, lineHeight: 9 },
  add: { height: 32, marginTop: 9, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, addText: { fontSize: 8, lineHeight: 10 },
  seeAll: { height: 48, marginHorizontal: 18, marginTop: 12, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  thumb: { width: 48, height: 27, overflow: 'hidden', borderRadius: 9 }, seeAllText: { flexShrink: 1, fontSize: 10, lineHeight: 13 },
});
