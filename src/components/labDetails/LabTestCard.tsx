import Check from 'lucide-react-native/icons/check';
import Clock3 from 'lucide-react-native/icons/clock-3';
import Droplets from 'lucide-react-native/icons/droplets';
import ListChecks from 'lucide-react-native/icons/list-checks';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LabTestItem } from '../../api/labTests';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

type Props = {
  item: LabTestItem;
  selected: boolean;
  onPress: () => void;
  onBook: () => void;
};
export function LabTestCard({ item, selected, onPress, onBook }: Props) {
  const { theme } = useAppTheme();
  const healthPackage = item.test.test_type === 'health_package';
  const fasting = item.test.requirements?.fasting_required
    ? `${item.test.requirements.fasting_duration ?? ''} hours`
    : 'Not required';
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.typeBadge, { backgroundColor: theme.isDark ? '#123A34' : '#DCF7EF' }]}>
          <AppText color={theme.isDark ? '#5EEAD4' : '#078A73'} style={styles.typeText} weight="800">
            {healthPackage ? 'HEALTH PACKAGE' : 'INDIVIDUAL TEST'}
          </AppText>
        </View>
        <AppText color={theme.colors.textMuted} style={styles.code}>
          {item.test.test_code}
        </AppText>
      </View>
      <AppText style={styles.title} weight="800">
        {item.test.test_name}
      </AppText>
      <AppText
        color={theme.colors.textMuted}
        numberOfLines={2}
        style={styles.description}
      >
        {item.test.description}
      </AppText>
      <View style={styles.infoRow}>
        <Info
          label="Sample"
          value={item.test.requirements?.sample_type ?? 'Contact lab'}
        />
        <Info label="Fasting" value={fasting} />
        <Info label="Report" value={item.test_timing} />
      </View>
      <View style={styles.included}>
        <ListChecks color={theme.colors.primary} size={14} />
        <AppText style={styles.includedText} weight="700">
          {item.test.included_tests?.length ?? 0} included marker
          {item.test.included_tests?.length === 1 ? '' : 's'}
        </AppText>
      </View>
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <View>
          <AppText color={theme.colors.textMuted} style={styles.offerLabel}>
            Offer price
          </AppText>
          <View style={styles.priceRow}>
            <AppText style={styles.price} weight="800">
              ₹{Number(item.offer_price)}
            </AppText>
            <AppText color={theme.colors.textMuted} style={styles.oldPrice}>
              ₹{Number(item.normal_price)}
            </AppText>
          </View>
        </View>
          <Pressable
            onPress={onBook}
          style={[
            styles.book,
            {
              backgroundColor: selected
                ? theme.colors.primarySoft
                : theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          {selected && (
            <Check color={theme.colors.primary} size={14} strokeWidth={3} />
          )}
          <AppText
            color={selected ? theme.colors.primary : '#FFFFFF'}
            style={styles.bookText}
            weight="800"
          >
            {selected ? 'IN CART' : 'BOOK'}
          </AppText>
        </Pressable>
      </View>
    </Pressable>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.info, { backgroundColor: theme.colors.surfaceMuted }]}>
      <AppText color={theme.colors.textMuted} style={styles.infoLabel}>
        {label}
      </AppText>
      <View style={styles.infoValueRow}>
        {label === 'Sample' ? (
          <Droplets color={theme.colors.text} size={11} />
        ) : label === 'Report' ? (
          <Clock3 color={theme.colors.text} size={11} />
        ) : null}
        <AppText style={styles.infoValue} weight="700">
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 13,
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeText: { fontSize: 7, lineHeight: 9 },
  code: { fontSize: 8, lineHeight: 10 },
  title: { marginTop: 9, fontSize: 15, lineHeight: 19 },
  description: { marginTop: 5, fontSize: 9, lineHeight: 13 },
  infoRow: { flexDirection: 'row', gap: 8, marginTop: 13 },
  info: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    padding: 8,
  },
  infoLabel: { fontSize: 7, lineHeight: 9 },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  infoValue: { fontSize: 8, lineHeight: 10 },
  included: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 11,
  },
  includedText: { fontSize: 8, lineHeight: 10 },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  offerLabel: { fontSize: 8, lineHeight: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 18, lineHeight: 21 },
  oldPrice: { fontSize: 9, lineHeight: 11, textDecorationLine: 'line-through' },
  book: {
    minWidth: 92,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookText: { fontSize: 10, lineHeight: 13 },
});
