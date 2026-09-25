import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Package from 'lucide-react-native/icons/package';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderProductDetails'>;

function money(value?: number | string) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
    : null;
}

export function OrderProductDetailsScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const { item, vendorName } = route.params;
  const snapshot = item.product_snapshot;
  const attributes = snapshot?.attributes;
  const image =
    item.product_image?.url ||
    snapshot?.images?.[0]?.url ||
    item.image ||
    item.product?.images?.[0]?.url;
  const name =
    item.product_name ||
    snapshot?.product_name ||
    item.product?.product_name ||
    'Product';
  const price = money(
    item.unit_price ?? snapshot?.offer_price ?? snapshot?.price,
  );
  const listPrice = money(snapshot?.price);
  const about = Object.entries(attributes?.about_product ?? {}).filter(
    ([key, value]) => key.startsWith('point_') && Boolean(value),
  );
  const goodToKnow = attributes?.about_product?.good_to_know;
  const additional = Object.entries(
    attributes?.additional_details ?? {},
  ).filter(([, value]) => value !== null && value !== '');
  const weight = snapshot?.weight
    ? `${snapshot.weight} ${snapshot.weight_unit ?? ''}`.trim()
    : null;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Go back"
          onPress={navigation.goBack}
          style={[styles.back, { borderColor: theme.colors.border }]}
        >
          <ChevronLeft color={theme.colors.text} size={20} />
        </Pressable>
        <AppText style={styles.headerTitle} weight="800">
          Product details
        </AppText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.hero, { backgroundColor: theme.colors.primarySoft }]}
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <Package color={theme.colors.primary} size={55} />
          )}
        </View>
        <View
          style={[
            styles.summary,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <AppText
            color={theme.colors.primary}
            style={styles.brand}
            weight="800"
          >
            {(attributes?.brand || vendorName || 'PRODUCT').toUpperCase()}
          </AppText>
          <AppText style={styles.name} weight="800">
            {name}
          </AppText>
          {snapshot?.short_description ? (
            <AppText color={theme.colors.textMuted} style={styles.description}>
              {snapshot.short_description}
            </AppText>
          ) : null}
          <View style={styles.priceRow}>
            {price ? (
              <AppText style={styles.price} weight="800">
                {price}
              </AppText>
            ) : null}
            {listPrice && listPrice !== price ? (
              <AppText color={theme.colors.textMuted} style={styles.listPrice}>
                {listPrice}
              </AppText>
            ) : null}
          </View>
          <View
            style={[styles.orderMeta, { borderTopColor: theme.colors.border }]}
          >
            <AppText color={theme.colors.textMuted} style={styles.metaLabel}>
              ORDERED QUANTITY
            </AppText>
            <AppText style={styles.metaValue} weight="800">
              {item.quantity ?? 1}
            </AppText>
          </View>
        </View>
        <View
          style={[
            styles.info,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <AppText style={styles.sectionTitle} weight="800">
            Product information
          </AppText>
          {snapshot?.description ? (
            <AppText
              color={theme.colors.textMuted}
              style={styles.longDescription}
            >
              {snapshot.description}
            </AppText>
          ) : null}
          {snapshot?.category?.category_name ? (
            <InfoRow label="Category" value={snapshot.category.category_name} />
          ) : null}
          {snapshot?.sub_category?.sub_category_name ? (
            <InfoRow
              label="Subcategory"
              value={snapshot.sub_category.sub_category_name}
            />
          ) : null}
          {attributes?.brand ? (
            <InfoRow label="Brand" value={attributes.brand} />
          ) : null}
          {snapshot?.unit ? (
            <InfoRow label="Unit" value={snapshot.unit} />
          ) : null}
          {weight ? <InfoRow label="Weight" value={weight} /> : null}
          {attributes?.vegan !== undefined ? (
            <InfoRow label="Vegan" value={attributes.vegan ? 'Yes' : 'No'} />
          ) : null}
          {attributes?.estimated_delivery ? (
            <InfoRow
              label="Estimated delivery"
              value={attributes.estimated_delivery}
            />
          ) : null}
          {snapshot?.sku ? <InfoRow label="SKU" value={snapshot.sku} /> : null}
          {about.length ? (
            <AppText style={styles.subheading} weight="800">
              About this product
            </AppText>
          ) : null}
          {about.map(([key, value]) => (
            <View key={key} style={styles.bulletRow}>
              <View
                style={[
                  styles.bullet,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <AppText style={styles.bulletText}>{value}</AppText>
            </View>
          ))}
          {goodToKnow ? (
            <View
              style={[
                styles.note,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <AppText style={styles.noteTitle} weight="800">
                Good to know
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.noteText}>
                {goodToKnow}
              </AppText>
            </View>
          ) : null}
          {additional.length ? (
            <AppText style={styles.subheading} weight="800">
              Additional details
            </AppText>
          ) : null}
          {additional.map(([key, value]) => (
            <InfoRow key={key} label={key} value={String(value)} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
      <AppText color={theme.colors.textMuted} style={styles.infoLabel}>
        {label}
      </AppText>
      <AppText style={styles.infoValue} weight="700">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 56,
    borderBottomWidth: 1,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 21 },
  headerSpacer: { width: 36 },
  content: { paddingBottom: 28 },
  hero: { height: 258, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: '100%', height: '100%' },
  summary: {
    marginHorizontal: 15,
    marginTop: -20,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  brand: { fontSize: 8, lineHeight: 12, letterSpacing: 0.7 },
  name: { marginTop: 7, fontSize: 21, lineHeight: 26 },
  description: { marginTop: 5, fontSize: 10, lineHeight: 15 },
  priceRow: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: { fontSize: 22, lineHeight: 27 },
  listPrice: {
    fontSize: 10,
    lineHeight: 14,
    textDecorationLine: 'line-through',
  },
  orderMeta: {
    marginTop: 16,
    paddingTop: 11,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: { fontSize: 8, lineHeight: 11, letterSpacing: 0.6 },
  metaValue: { fontSize: 12, lineHeight: 16 },
  info: {
    borderWidth: 1,
    borderRadius: 18,
    marginHorizontal: 15,
    marginTop: 13,
    padding: 16,
  },
  sectionTitle: { marginBottom: 6, fontSize: 16, lineHeight: 21 },
  longDescription: { marginBottom: 9, fontSize: 10, lineHeight: 15 },
  infoRow: {
    minHeight: 38,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
  },
  infoLabel: { flex: 1, fontSize: 10, lineHeight: 14 },
  infoValue: { flex: 1, fontSize: 10, lineHeight: 14, textAlign: 'right' },
  subheading: { marginTop: 19, marginBottom: 10, fontSize: 12, lineHeight: 16 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 5 },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 15 },
  note: { marginTop: 10, borderRadius: 12, padding: 11 },
  noteTitle: { fontSize: 10, lineHeight: 14 },
  noteText: { marginTop: 4, fontSize: 10, lineHeight: 15 },
});
