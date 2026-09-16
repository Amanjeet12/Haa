import Clock3 from 'lucide-react-native/icons/clock-3';
import Droplets from 'lucide-react-native/icons/droplets';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import X from 'lucide-react-native/icons/x';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { LabTestItem } from '../../api/labTests';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';
import { Lab } from '../labs';

type Props = {
  item: LabTestItem | null;
  lab: Lab;
  selected: boolean;
  cartCount: number;
  cartTotal: number;
  onClose: () => void;
  onBook: (item: LabTestItem) => void;
  onViewCart: () => void;
};

export function TestDetailsSheet({
  item,
  lab,
  selected,
  cartCount,
  cartTotal,
  onClose,
  onBook,
  onViewCart,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  if (!item) return null;
  const fasting = item.test.requirements?.fasting_required;
  const bottomInset = Math.max(insets.bottom, 48);

  return (
    <Modal
      animationType="slide"
      transparent
      statusBarTranslucent
      visible
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView
          edges={[]}
          style={[styles.sheet, { backgroundColor: theme.colors.background }]}
        >
          <View
            style={[styles.handle, { backgroundColor: theme.colors.border }]}
          />
          <Pressable
            onPress={onClose}
            style={[styles.close, { backgroundColor: theme.colors.surface }]}
          >
            <X color={theme.colors.text} size={17} />
          </Pressable>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: bottomInset + 82 },
            ]}
          >
            <View style={styles.typeBadge}>
              <AppText color="#078A73" style={styles.typeText} weight="800">
                {item.test.test_type === 'health_package'
                  ? 'HEALTH PACKAGE'
                  : 'INDIVIDUAL TEST'}
              </AppText>
            </View>
            <View style={styles.titleRow}>
              <AppText style={styles.title} weight="800">
                {item.test.test_name}
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.code}>
                {item.test.test_code}
              </AppText>
            </View>
            <AppText color={theme.colors.textMuted} style={styles.description}>
              {item.test.description}
            </AppText>
            <View style={styles.infoRow}>
              <Info
                icon={<Droplets color={theme.colors.primary} size={12} />}
                label="Sample"
                value={item.test.requirements?.sample_type ?? 'Contact lab'}
              />
              <Info
                icon={<Clock3 color={theme.colors.primary} size={12} />}
                label="Fasting"
                value={
                  fasting
                    ? `${item.test.requirements?.fasting_duration ?? ''} hours`
                    : 'Not required'
                }
              />
              <Info
                icon={<FlaskConical color={theme.colors.primary} size={12} />}
                label="Report"
                value={item.test_timing}
              />
            </View>
            <AppText style={styles.sectionTitle} weight="800">
              {item.test.included_tests?.length ?? 0} included markers
            </AppText>
            <View style={styles.markers}>
              {item.test.included_tests?.map(marker => (
                <View
                  key={marker}
                  style={[
                    styles.marker,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <View style={styles.dot} />
                  <AppText style={styles.markerText} numberOfLines={1}>
                    {marker}
                  </AppText>
                </View>
              ))}
            </View>
            <AppText style={styles.sectionTitle} weight="800">
              Before your test
            </AppText>
            <View style={styles.warning}>
              <Clock3 color="#9A6700" size={14} />
              <AppText color="#7C5800" style={styles.warningText}>
                {fasting
                  ? `Fasting is required for ${
                      item.test.requirements?.fasting_duration ?? ''
                    } hours. Preparation instructions will be repeated in your booking confirmation.`
                  : 'No fasting is required. Follow the instructions shared in your booking confirmation.'}
              </AppText>
            </View>
            <AppText style={styles.sectionTitle} weight="800">
              Provided by
            </AppText>
            <View
              style={[
                styles.provider,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.providerLogo}>
                <FlaskConical color={theme.colors.primary} size={20} />
              </View>
              <View style={styles.providerCopy}>
                <AppText
                  color={theme.colors.primary}
                  style={styles.providerName}
                  weight="800"
                >
                  {lab.name}
                </AppText>
                <AppText
                  color={theme.colors.textMuted}
                  numberOfLines={1}
                  style={styles.providerMeta}
                >
                  {lab.certifications.join(' · ')}
                </AppText>
                <AppText
                  color="#078A73"
                  style={styles.providerMeta}
                  weight="700"
                >
                  Home collection
                </AppText>
              </View>
              <AppText style={styles.providerTime} weight="700">
                {item.test_timing}
              </AppText>
            </View>
          </ScrollView>
          <View
            style={[
              styles.actionBar,
              { bottom: bottomInset, backgroundColor: theme.colors.text },
            ]}
          >
            <View>
              <AppText color="#C9D6E0" style={styles.offerLabel}>
                {selected
                  ? `${cartCount} test${cartCount === 1 ? '' : 's'} in cart`
                  : 'Offer price'}
              </AppText>
              <View style={styles.priceRow}>
                <AppText color="#FFFFFF" style={styles.price} weight="800">
                  ₹{selected ? cartTotal : Number(item.offer_price)}
                </AppText>
                {!selected ? (
                  <AppText color="#94A3B8" style={styles.oldPrice}>
                    ₹{Number(item.normal_price)}
                  </AppText>
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={selected ? onViewCart : () => onBook(item)}
              style={[
                styles.book,
                {
                  backgroundColor: selected ? '#FFFFFF' : theme.colors.primary,
                },
              ]}
            >
              <AppText
                color={selected ? theme.colors.primary : '#FFFFFF'}
                style={styles.bookText}
                weight="800"
              >
                {selected ? 'VIEW CART' : 'BOOK'}
              </AppText>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.info}>
      <View style={styles.infoIcon}>{icon}</View>
      <AppText color="#64748B" style={styles.infoLabel}>
        {label}
      </AppText>
      <AppText style={styles.infoValue} weight="700">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(2,6,23,.55)',
  },
  sheet: {
    height: '86%',
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    overflow: 'hidden',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  close: {
    position: 'absolute',
    right: 13,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  content: { paddingHorizontal: 16, paddingTop: 23 },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCF7EF',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeText: { fontSize: 7, lineHeight: 9 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  title: { flex: 1, fontSize: 16, lineHeight: 19 },
  code: { fontSize: 8, lineHeight: 11 },
  description: { marginTop: 6, fontSize: 10, lineHeight: 14 },
  infoRow: { flexDirection: 'row', gap: 7, marginTop: 14 },
  info: {
    flex: 1,
    minHeight: 64,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 9,
  },
  infoIcon: { height: 15 },
  infoLabel: { marginTop: 2, fontSize: 8, lineHeight: 10 },
  infoValue: { marginTop: 3, fontSize: 9, lineHeight: 12 },
  sectionTitle: {
    marginTop: 17,
    marginBottom: 9,
    fontSize: 14,
    lineHeight: 16,
  },
  markers: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  marker: {
    width: '49%',
    height: 34,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  markerText: { flex: 1, fontSize: 10, lineHeight: 11 },
  warning: {
    borderRadius: 10,
    backgroundColor: '#FFF2C9',
    padding: 11,
    flexDirection: 'row',
    gap: 7,
  },
  warningText: { flex: 1, fontSize: 8, lineHeight: 12 },
  provider: {
    minHeight: 66,
    borderWidth: 1,
    borderRadius: 11,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  providerLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerCopy: { flex: 1 },
  providerName: { fontSize: 11, lineHeight: 14 },
  providerMeta: { marginTop: 2, fontSize: 8, lineHeight: 10 },
  providerTime: { fontSize: 8, lineHeight: 10 },
  actionBar: {
    position: 'absolute',
    left: 9,
    right: 9,
    minHeight: 62,
    borderRadius: 16,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
  },
  offerLabel: { fontSize: 8, lineHeight: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 17, lineHeight: 20 },
  oldPrice: { fontSize: 9, lineHeight: 11, textDecorationLine: 'line-through' },
  book: {
    width: 98,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookText: { fontSize: 10, lineHeight: 13 },
});
