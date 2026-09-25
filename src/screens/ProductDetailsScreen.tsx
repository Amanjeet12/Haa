import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import CircleCheck from 'lucide-react-native/icons/circle-check';
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
import { useAppDispatch, useAppSelector } from '../store';
import { addCommerceItem, setCommerceItemQuantity } from '../store/commerceCartSlice';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen({ navigation, route }: Props) {
  const { product } = route.params;
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const zone = useAppSelector(state => state.zones.selected);
  const commerceCart = useAppSelector(state => state.commerceCart);
  const [favourite, setFavourite] = useState(false);
  const saving = product.oldPrice ? product.oldPrice - product.price : 0;
  const isGlobal = product.source === 'global';
  const isApiProduct = product.apiProduct === true;
  const deliveryEstimate = product.estimatedDelivery?.trim();
  const aboutProduct = Object.entries(product.attributes?.about_product ?? {}).filter((entry): entry is [string, string] => entry[0].startsWith('point_') && Boolean(entry[1]));
  const goodToKnow = product.attributes?.about_product?.good_to_know;
  const additionalDetails = Object.entries(product.attributes?.additional_details ?? {}).filter(([, value]) => value !== null && value !== '');
  const cartItem = commerceCart.source === (product.source ?? 'ecommerce') ? commerceCart.items.find(item => item.id === product.id) : undefined;
  const quantity = cartItem?.quantity ?? 0;
  const addToCart = () => dispatch(addCommerceItem({
    source: product.source ?? 'ecommerce',
    product: { id: product.id, name: product.name, price: product.price, image: product.image, detail: product.detail, brand: product.attributes?.brand, vendorName: product.vendorName, estimatedDelivery: product.estimatedDelivery, zoneId: product.source === 'ecommerce' ? zone?.zone_id : undefined },
  }));

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Pressable accessibilityLabel="Go back" onPress={navigation.goBack} style={[styles.headerButton, { borderColor: theme.colors.border }]}><ArrowLeft color={theme.colors.text} size={19} /></Pressable>
        <AppText style={styles.headerTitle} weight="800">Product Details</AppText>
        <Pressable accessibilityLabel="Add to favourites" onPress={() => setFavourite(value => !value)} style={[styles.headerButton, { borderColor: theme.colors.border }]}><Heart color={favourite ? theme.colors.primary : theme.colors.text} fill={favourite ? theme.colors.primary : 'transparent'} size={18} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 98 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={typeof product.image === 'string' ? { uri: product.image } : product.image} resizeMode="cover" style={styles.heroImage} />
          {product.discount ? <View style={[styles.discount, { backgroundColor: theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.discountText} weight="800">{product.discount}</AppText></View> : null}
          {deliveryEstimate || !isGlobal ? <View style={styles.heroEta}><Zap color="#078A73" size={10} /><AppText color="#078A73" style={styles.heroEtaText} weight="800">{deliveryEstimate ?? '19 min'}</AppText></View> : null}
        </View>

        <View style={[styles.productCard, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
          <View style={styles.brandRow}><AppText color={theme.colors.primary} style={styles.brand} weight="800">{product.seller.toUpperCase()}</AppText>{!isApiProduct ? <View style={styles.rating}><Star color="#F59E0B" fill="#F59E0B" size={12} /><AppText style={styles.ratingText} weight="800">4.8</AppText><AppText color={theme.colors.textMuted} style={styles.reviews}>238 reviews</AppText></View> : null}</View>
          <AppText style={styles.name} weight="800">{product.name}</AppText>
          {product.description ? <AppText color={theme.colors.textMuted} style={styles.description}>{product.description}</AppText> : null}
          <View style={styles.priceRow}><AppText style={styles.price} weight="800">₹{product.price}</AppText>{product.oldPrice ? <AppText color={theme.colors.textMuted} style={styles.oldPrice}>₹{product.oldPrice}</AppText> : null}{saving > 0 ? <View style={styles.save}><AppText color="#078A73" style={styles.saveText} weight="800">Save ₹{saving}</AppText></View> : null}</View>
          <AppText color={theme.colors.textMuted} style={styles.tax}>{isGlobal ? (product.unit ?? product.detail) : `Pack of ${product.detail}`} · Inclusive of all taxes</AppText>
          <View style={[styles.benefits, { borderTopColor: theme.colors.border }]}>
            <Benefit icon={<CircleCheck color={theme.colors.primary} size={17} />} label="Quality checked" />
            <Benefit icon={<PackageCheck color={theme.colors.primary} size={17} />} label="Discreet pack" />
            <Benefit icon={<Zap color={theme.colors.primary} size={17} />} label={isGlobal ? 'Tracked delivery' : 'Quick delivery'} />
          </View>
        </View>

        <View style={[styles.delivery, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.deliveryIcon}><Zap color="#078A73" size={17} /></View>
          <View style={styles.deliveryCopy}><AppText style={styles.deliveryTitle} weight="800">{isApiProduct ? 'Estimated delivery' : `Delivery to ${zone?.zone_name ?? 'Rajbagh'}`}</AppText>{!isApiProduct ? <AppText color={theme.colors.textMuted} style={styles.deliveryDetail}>Srinagar · 190008</AppText> : null}</View>
          <AppText color="#078A73" style={styles.deliveryTime} weight="800">{isApiProduct ? (deliveryEstimate ?? 'Contact seller') : '18–25 min'}</AppText>
        </View>

        <View style={[styles.info, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <AppText style={styles.infoTitle} weight="800">Product information</AppText>
          {product.description ? <AppText color={theme.colors.textMuted} style={styles.infoDescription}>{product.description}</AppText> : null}
          {product.attributes?.brand ? <InfoRow label="Brand" value={product.attributes.brand} theme={theme} /> : null}
          {product.unit ? <InfoRow label="Unit" value={product.unit} theme={theme} /> : null}
          {product.weight ? <InfoRow label="Weight" value={`${product.weight} ${product.weightUnit ?? ''}`.trim()} theme={theme} /> : null}
          {product.attributes?.vegan !== undefined ? <InfoRow label="Vegan" value={product.attributes.vegan ? 'Yes' : 'No'} theme={theme} /> : null}
          {deliveryEstimate ? <InfoRow label="Estimated delivery" value={deliveryEstimate} theme={theme} /> : null}
          {aboutProduct.length ? <AppText style={styles.infoSectionTitle} weight="800">About this product</AppText> : null}
          {aboutProduct.map(([key, value]) => <View key={key} style={styles.aboutPoint}><View style={[styles.aboutDot, { backgroundColor: theme.colors.primary }]} /><AppText style={styles.aboutText}>{value}</AppText></View>)}
          {goodToKnow ? <View style={[styles.goodToKnow, { backgroundColor: theme.colors.primarySoft }]}><AppText style={styles.goodToKnowTitle} weight="800">Good to know</AppText><AppText color={theme.colors.textMuted} style={styles.goodToKnowText}>{goodToKnow}</AppText></View> : null}
          {additionalDetails.length ? <AppText style={styles.infoSectionTitle} weight="800">Additional details</AppText> : null}
          {additionalDetails.map(([key, value]) => <InfoRow key={key} label={key} value={String(value)} theme={theme} />)}
          {product.sku ? <InfoRow label="SKU" value={product.sku} theme={theme} /> : null}
        </View>
      </ScrollView>

      <View key={quantity > 0 ? 'cart-filled' : 'cart-empty'} style={[styles.bottomBar, { bottom: Math.max(insets.bottom, 8), backgroundColor: quantity ? '#061F36' : 'transparent' }]}>
        {quantity > 0 ? <View style={styles.quantity}><Pressable accessibilityLabel="Decrease quantity" onPress={() => cartItem && dispatch(setCommerceItemQuantity({ id: cartItem.id, quantity: cartItem.quantity - 1 }))} style={styles.quantityButton}><Minus color={theme.colors.text} size={15} /></Pressable><AppText style={styles.quantityText} weight="800">{quantity}</AppText><Pressable accessibilityLabel="Increase quantity" onPress={addToCart} style={styles.quantityButton}><Plus color={theme.colors.text} size={15} /></Pressable></View> : null}
        <Pressable disabled={product.isInStock === false} onPress={addToCart} style={[styles.addToCart, { backgroundColor: product.isInStock === false ? theme.colors.textMuted : theme.colors.primary }]}><AppText color="#FFFFFF" style={styles.addLabel} weight="800">{product.isInStock === false ? 'Out of stock' : 'Add to cart'}</AppText>{product.isInStock !== false ? <AppText color="#FFFFFF" style={styles.addPrice} weight="800">₹{product.price.toLocaleString('en-IN')}</AppText> : null}</Pressable>
      </View>
    </SafeAreaView>
  );
}

function Benefit({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <View style={styles.benefit}>{icon}<AppText style={styles.benefitText} weight="700">{label}</AppText></View>;
}

function InfoRow({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useAppTheme>['theme'] }) {
  return <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}><AppText color={theme.colors.textMuted} style={styles.infoLabel} weight="700">{label}</AppText><AppText style={styles.infoValue} weight="600">{value}</AppText></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, headerTitle: { flex: 1, textAlign: 'center', fontSize: 18 },
  hero: { height: 245, backgroundColor: '#EEF2F5' }, heroImage: { width: '100%', height: '100%' }, discount: { position: 'absolute', left: 12, top: 10, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 }, discountText: { fontSize: 8 },
  heroEta: { position: 'absolute', top: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFFFFF', borderRadius: 11, paddingHorizontal: 8, paddingVertical: 5 }, heroEtaText: { fontSize: 8 },
  productCard: { marginHorizontal: 16, marginTop: -8, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, elevation: 3, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { fontSize: 8, letterSpacing: 0.5 }, rating: { flexDirection: 'row', alignItems: 'center', gap: 3 }, ratingText: { fontSize: 9 }, reviews: { fontSize: 7 },
  name: { marginTop: 6, fontSize: 20, lineHeight: 24, letterSpacing: -0.5 }, description: { marginTop: 4, fontSize: 9, lineHeight: 14 },
  priceRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 7 }, price: { fontSize: 21 }, oldPrice: { fontSize: 10, textDecorationLine: 'line-through' }, save: { borderRadius: 6, backgroundColor: '#DDF7EF', paddingHorizontal: 7, paddingVertical: 3 }, saveText: { fontSize: 8 }, tax: { marginTop: 3, fontSize: 8 },
  benefits: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth }, benefit: { flex: 1, alignItems: 'center', gap: 4 }, benefitText: { fontSize: 7 },
  delivery: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1 }, deliveryIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#DEF5EF', alignItems: 'center', justifyContent: 'center' }, deliveryCopy: { flex: 1 }, deliveryTitle: { fontSize: 11 }, deliveryDetail: { marginTop: 2, fontSize: 8 }, deliveryTime: { textAlign: 'right', fontSize: 11 }, deliveryMinutes: { textAlign: 'right', fontSize: 7 },
  info: { marginHorizontal: 14, marginTop: 12, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18 }, infoTitle: { fontSize: 17, lineHeight: 22 }, infoDescription: { marginTop: 6, marginBottom: 10, fontSize: 10, lineHeight: 15 }, infoSectionTitle: { marginTop: 18, marginBottom: 6, fontSize: 12, lineHeight: 16 }, infoRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth }, infoLabel: { width: '38%', fontSize: 10, lineHeight: 14 }, infoValue: { flex: 1, textAlign: 'right', fontSize: 10, lineHeight: 14 }, aboutPoint: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }, aboutDot: { width: 6, height: 6, borderRadius: 3 }, aboutText: { flex: 1, fontSize: 10, lineHeight: 15 }, goodToKnow: { marginTop: 14, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }, goodToKnowTitle: { fontSize: 11, lineHeight: 15 }, goodToKnowText: { marginTop: 4, fontSize: 10, lineHeight: 15 },
  bottomBar: { position: 'absolute', left: 14, right: 14, height: 68, borderRadius: 21, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 9, padding: 8 },
  quantity: { width: 94, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }, quantityButton: { width: 28, height: 38, alignItems: 'center', justifyContent: 'center' }, quantityText: { fontSize: 13 },
  addToCart: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 }, addLabel: { fontSize: 11 }, addPrice: { fontSize: 10 },
});
