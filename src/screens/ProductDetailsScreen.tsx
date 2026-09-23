import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Heart from 'lucide-react-native/icons/heart';
import Minus from 'lucide-react-native/icons/minus';
import PackageCheck from 'lucide-react-native/icons/package-check';
import Plus from 'lucide-react-native/icons/plus';
import Star from 'lucide-react-native/icons/star';
import Zap from 'lucide-react-native/icons/zap';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../components';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen({ navigation, route }: Props) {
  const { product } = route.params;
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const zone = useAppSelector(state => state.zones.selected);
  const [quantity, setQuantity] = useState(1);
  const [favourite, setFavourite] = useState(false);
  const saving = product.oldPrice ? product.oldPrice - product.price : 0;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Pressable accessibilityLabel="Go back" onPress={navigation.goBack} style={[styles.headerButton, { borderColor: theme.colors.border }]}><ArrowLeft color={theme.colors.text} size={19} /></Pressable>
        <AppText style={styles.headerTitle} weight="800">Product Details</AppText>
        <Pressable accessibilityLabel="Add to favourites" onPress={() => setFavourite(value => !value)} style={[styles.headerButton, { borderColor: theme.colors.border }]}><Heart color={favourite ? theme.colors.primary : theme.colors.text} fill={favourite ? theme.colors.primary : 'transparent'} size={18} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 98 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={product.image} resizeMode="cover" style={styles.heroImage} />
          {product.discount ? <View style={[styles.discount, { backgroundColor: theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.discountText} weight="800">{product.discount}</AppText></View> : null}
          <View style={styles.heroEta}><Zap color="#078A73" size={10} /><AppText color="#078A73" style={styles.heroEtaText} weight="800">19 min</AppText></View>
        </View>

        <View style={[styles.productCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
          <View style={styles.brandRow}><AppText color={theme.colors.primary} style={styles.brand} weight="800">HAA WELLNESS</AppText><View style={styles.rating}><Star color="#F59E0B" fill="#F59E0B" size={12} /><AppText style={styles.ratingText} weight="800">4.8</AppText><AppText color={theme.colors.textMuted} style={styles.reviews}>238 reviews</AppText></View></View>
          <AppText style={styles.name} weight="800">{product.name}</AppText>
          <AppText color={theme.colors.textMuted} style={styles.description}>Comfortable, reliable protection designed for everyday care and wellbeing.</AppText>
          <View style={styles.priceRow}><AppText style={styles.price} weight="800">₹{product.price}</AppText>{product.oldPrice ? <AppText color={theme.colors.textMuted} style={styles.oldPrice}>₹{product.oldPrice}</AppText> : null}{saving > 0 ? <View style={styles.save}><AppText color="#078A73" style={styles.saveText} weight="800">Save ₹{saving}</AppText></View> : null}</View>
          <AppText color={theme.colors.textMuted} style={styles.tax}>Pack of {product.detail} · Inclusive of all taxes</AppText>
          <View style={[styles.benefits, { borderTopColor: theme.colors.border }]}>
            <Benefit icon={<CircleCheck color={theme.colors.primary} size={17} />} label="Quality checked" />
            <Benefit icon={<PackageCheck color={theme.colors.primary} size={17} />} label="Discreet pack" />
            <Benefit icon={<Zap color={theme.colors.primary} size={17} />} label="Quick delivery" />
          </View>
        </View>

        <View style={[styles.delivery, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.deliveryIcon}><Zap color="#078A73" size={17} /></View>
          <View style={styles.deliveryCopy}><AppText style={styles.deliveryTitle} weight="800">Delivery to {zone?.zone_name ?? 'Rajbagh'}</AppText><AppText color={theme.colors.textMuted} style={styles.deliveryDetail}>Srinagar · 190008</AppText></View>
          <View><AppText color="#078A73" style={styles.deliveryTime} weight="800">18–25</AppText><AppText color="#078A73" style={styles.deliveryMinutes} weight="700">minutes</AppText></View>
        </View>

        <View style={styles.info}>
          <AppText style={styles.infoTitle} weight="800">Product information</AppText>
          <AppText color={theme.colors.textMuted} style={styles.infoSubtitle}>Everything you may want to know before ordering.</AppText>
          <InfoRow label="Product details" theme={theme} />
          <InfoRow label="How to use" theme={theme} />
          <InfoRow label="Materials & safety" theme={theme} />
          <InfoRow label="Storage information" theme={theme} />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { bottom: Math.max(insets.bottom, 8), backgroundColor: '#061F36', shadowColor: theme.colors.shadow }]}>
        <View style={styles.quantity}><Pressable onPress={() => setQuantity(value => Math.max(1, value - 1))} style={styles.quantityButton}><Minus color={theme.colors.text} size={15} /></Pressable><AppText style={styles.quantityText} weight="800">{quantity}</AppText><Pressable onPress={() => setQuantity(value => value + 1)} style={styles.quantityButton}><Plus color={theme.colors.text} size={15} /></Pressable></View>
        <Pressable style={[styles.addToCart, { backgroundColor: theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.addLabel} weight="800">Add to cart</AppText><AppText color="#FFFFFF" style={styles.addPrice} weight="800">₹{product.price * quantity}</AppText></Pressable>
      </View>
    </SafeAreaView>
  );
}

function Benefit({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <View style={styles.benefit}>{icon}<AppText style={styles.benefitText} weight="700">{label}</AppText></View>;
}

function InfoRow({ label, theme }: { label: string; theme: ReturnType<typeof useAppTheme>['theme'] }) {
  return <Pressable style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}><AppText style={styles.infoLabel} weight="700">{label}</AppText><ChevronRight color={theme.colors.textMuted} size={16} /></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, headerTitle: { flex: 1, textAlign: 'center', fontSize: 18 },
  hero: { height: 245, backgroundColor: '#EEF2F5' }, heroImage: { width: '100%', height: '100%' }, discount: { position: 'absolute', left: 12, top: 10, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 }, discountText: { fontSize: 8 },
  heroEta: { position: 'absolute', top: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFFFFF', borderRadius: 11, paddingHorizontal: 8, paddingVertical: 5 }, heroEtaText: { fontSize: 8 },
  productCard: { marginHorizontal: 16, marginTop: -8, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 15, elevation: 3, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontSize: 8, letterSpacing: 0.5 }, rating: { flexDirection: 'row', alignItems: 'center', gap: 3 }, ratingText: { fontSize: 9 }, reviews: { fontSize: 7 },
  name: { marginTop: 8, fontSize: 20, lineHeight: 24, letterSpacing: -0.5 }, description: { marginTop: 5, fontSize: 9, lineHeight: 14 },
  priceRow: { marginTop: 12, flexDirection: 'row', alignItems: 'baseline', gap: 7 }, price: { fontSize: 21 }, oldPrice: { fontSize: 10, textDecorationLine: 'line-through' }, save: { borderRadius: 6, backgroundColor: '#DDF7EF', paddingHorizontal: 7, paddingVertical: 4 }, saveText: { fontSize: 8 }, tax: { marginTop: 5, fontSize: 8 },
  benefits: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth }, benefit: { flex: 1, alignItems: 'center', gap: 5 }, benefitText: { fontSize: 7 },
  delivery: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1 }, deliveryIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#DEF5EF', alignItems: 'center', justifyContent: 'center' }, deliveryCopy: { flex: 1 }, deliveryTitle: { fontSize: 11 }, deliveryDetail: { marginTop: 2, fontSize: 8 }, deliveryTime: { textAlign: 'right', fontSize: 11 }, deliveryMinutes: { textAlign: 'right', fontSize: 7 },
  info: { paddingHorizontal: 16, paddingTop: 17 }, infoTitle: { fontSize: 15 }, infoSubtitle: { marginTop: 3, marginBottom: 5, fontSize: 8 }, infoRow: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth }, infoLabel: { fontSize: 10 },
  bottomBar: { position: 'absolute', left: 14, right: 14, height: 68, borderRadius: 21, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 8, elevation: 14, shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  quantity: { width: 94, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }, quantityButton: { width: 28, height: 38, alignItems: 'center', justifyContent: 'center' }, quantityText: { fontSize: 13 },
  addToCart: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 }, addLabel: { fontSize: 11 }, addPrice: { fontSize: 10 },
});
