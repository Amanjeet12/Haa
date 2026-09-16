import Trash2 from 'lucide-react-native/icons/trash';
import Users from 'lucide-react-native/icons/users';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCart, removeTestFromCart } from '../store/cartSlice';
import { useAppTheme } from '../theme';

export function CartScreen() {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const cart = useAppSelector(state => state.cart);
  const total = cart.items.reduce(
    (sum, item) =>
      sum +
      Number(item.labTest.offer_price) *
        Math.max(item.beneficiaryIds.length, 1),
    0,
  );
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <AppText style={styles.title} weight="800">
          Your cart
        </AppText>
        {cart.items.length > 0 && (
          <Pressable onPress={() => dispatch(clearCart())}>
            <AppText
              color={theme.colors.primary}
              style={styles.clear}
              weight="700"
            >
              Clear cart
            </AppText>
          </Pressable>
        )}
      </View>
      {!cart.items.length ? (
        <View style={styles.empty}>
          <AppText style={styles.emptyTitle} weight="700">
            Your cart is empty
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.emptyText}>
            Book tests from one lab to see them here.
          </AppText>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.lab,
                { backgroundColor: theme.colors.primarySoft },
              ]}
            >
              <AppText
                color={theme.colors.primary}
                style={styles.labLabel}
                weight="700"
              >
                TESTS PROVIDED BY
              </AppText>
              <AppText style={styles.labName} weight="800">
                {cart.labName}
              </AppText>
            </View>
            {cart.items.map(entry => (
              <View
                key={entry.labTest.lab_test_id}
                style={[
                  styles.item,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.itemTop}>
                  <View style={styles.itemCopy}>
                    <AppText style={styles.itemName} weight="700">
                      {entry.labTest.test.test_name}
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.itemMeta}
                    >
                      {entry.labTest.test.test_code} ·{' '}
                      {entry.labTest.test_timing}
                    </AppText>
                  </View>
                  <Pressable
                    hitSlop={10}
                    onPress={() =>
                      dispatch(removeTestFromCart(entry.labTest.lab_test_id))
                    }
                  >
                    <Trash2 color={theme.colors.primary} size={17} />
                  </Pressable>
                </View>
                <View style={styles.itemBottom}>
                  <View style={styles.people}>
                    <Users color={theme.colors.textMuted} size={14} />
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.peopleText}
                    >
                      {entry.beneficiaryIds.length
                        ? `${entry.beneficiaryIds.length} people assigned`
                        : 'Assign people at checkout'}
                    </AppText>
                  </View>
                  <AppText style={styles.price} weight="800">
                    ₹{Number(entry.labTest.offer_price)}
                  </AppText>
                </View>
              </View>
            ))}
          </ScrollView>
          <View
            style={[
              styles.checkout,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <View>
              <AppText color={theme.colors.textMuted} style={styles.totalLabel}>
                Total
              </AppText>
              <AppText style={styles.total} weight="800">
                ₹{total}
              </AppText>
            </View>
            <Pressable
              style={[
                styles.checkoutButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <AppText color="#FFFFFF" style={styles.checkoutText} weight="800">
                CONTINUE TO CHECKOUT
              </AppText>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, lineHeight: 23 },
  clear: { fontSize: 10, lineHeight: 13 },
  content: { paddingHorizontal: 16, paddingBottom: 96 },
  lab: { borderRadius: 12, padding: 12, marginBottom: 10 },
  labLabel: { fontSize: 7, lineHeight: 9 },
  labName: { marginTop: 3, fontSize: 13, lineHeight: 17 },
  item: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 9 },
  itemTop: { flexDirection: 'row', gap: 8 },
  itemCopy: { flex: 1 },
  itemName: { fontSize: 12, lineHeight: 16 },
  itemMeta: { marginTop: 3, fontSize: 8, lineHeight: 10 },
  itemBottom: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  people: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  peopleText: { fontSize: 8, lineHeight: 10 },
  price: { fontSize: 15, lineHeight: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, lineHeight: 20 },
  emptyText: { marginTop: 4, fontSize: 10, lineHeight: 14 },
  checkout: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 76,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 8, lineHeight: 10 },
  total: { fontSize: 18, lineHeight: 22 },
  checkoutButton: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutText: { fontSize: 9, lineHeight: 12 },
});
