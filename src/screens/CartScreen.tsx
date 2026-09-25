import Minus from 'lucide-react-native/icons/minus';
import MapPin from 'lucide-react-native/icons/map-pin';
import Plus from 'lucide-react-native/icons/plus';
import ShoppingBag from 'lucide-react-native/icons/shopping-bag';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addressLine, CustomerAddress, getCustomerAddresses } from '../api/addresses';
import { ApiError } from '../api/client';
import { createCustomerOrder, OrderInput } from '../api/orders';
import { AppText, BottomTabHeader } from '../components';
import { AddressesSheet } from '../components/booking/AddressesSheet';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCommerceCart, CommerceCartItem, setCommerceItemQuantity } from '../store/commerceCartSlice';
import { screenGradientColors, screenGradientLocations, useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

export function CartScreen() {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { items, source } = useAppSelector(state => state.commerceCart);
  const token = useAppSelector(state => state.auth.session?.token);
  const customer = useAppSelector(state => state.auth.session?.customer);
  const selectedZoneId = useAppSelector(state => state.zones.selected?.zone_id);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressesOpen, setAddressesOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const groups = items.reduce<{ name: string; items: CommerceCartItem[] }[]>((result, item) => {
    const name = item.vendorName || (source === 'global' ? 'Global Store' : 'Quick Commerce');
    const group = result.find(entry => entry.name === name);
    if (group) group.items.push(item);
    else result.push({ name, items: [item] });
    return result;
  }, []);
  const selectedAddress = addresses.find(address => address.address_id === selectedAddressId) ?? addresses.find(address => address.billing_address?.isDefault) ?? addresses[0];
  const loadAddresses = useCallback(async () => {
    if (!token || !items.length) return;
    setAddressesLoading(true);
    setAddressError(null);
    try {
      const result = (await getCustomerAddresses(token)).filter(address => Boolean(address.billing_address));
      setAddresses(result);
      setSelectedAddressId(current => result.some(address => address.address_id === current) ? current : result.find(address => address.billing_address?.isDefault)?.address_id ?? result[0]?.address_id ?? null);
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Could not load addresses.');
    } finally {
      setAddressesLoading(false);
    }
  }, [token, items.length]);
  useFocusEffect(useCallback(() => { loadAddresses(); }, [loadAddresses]));
  const addressSummary = (address: CustomerAddress) => {
    const details = address.billing_address;
    if (!details) return 'No saved address';
    const street = addressLine(address) || [details.flatNo || details.flat_no, details.buildingName || details.building_name, details.landmark].filter(Boolean).join(', ');
    const city = details.location?.city || details.city;
    const pincode = details.location?.pincode || details.pincode;
    return [street, [city, pincode].filter(Boolean).join(' - ')].filter(Boolean).join(', ') || details.location?.title || 'Saved address';
  };
  const placeOrder = async () => {
    if (placingOrder) return;
    if (!token || !customer) { Alert.alert('Sign in required', 'Sign in before placing your order.'); return; }
    if (!selectedAddress) { Alert.alert('Choose an address', 'Select a saved delivery address before placing your order.'); setAddressesOpen(true); return; }
    if (source !== 'ecommerce' && source !== 'global') return;
    const details = selectedAddress.billing_address;
    if (!details) { Alert.alert('Choose an address', 'Select a saved address before placing your order.'); return; }
    const location = details.location;
    const city = location?.city || details.city || '';
    const pincode = location?.pincode || details.pincode || '';
    const latitude = Number(location?.latitude ?? location?.lat);
    const longitude = Number(location?.longitude ?? location?.lng);
    const addressText = addressLine(selectedAddress);
    if (!addressText || !city || !pincode || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      Alert.alert('Incomplete address', 'Please update the selected address with its street, city, pincode, and map location.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Manage addresses', onPress: () => navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Addresses') },
      ]);
      return;
    }
    const orderItems = items.map(item => ({ product_id: Number(item.id), quantity: item.quantity }));
    if (orderItems.some(item => !Number.isInteger(item.product_id) || item.product_id <= 0)) {
      Alert.alert('Unavailable item', 'This cart contains an item that cannot be ordered online.');
      return;
    }
    const zoneId = items.find(item => item.zoneId)?.zoneId ?? selectedZoneId;
    if (source === 'ecommerce' && !zoneId) {
      Alert.alert('Choose a location', 'Select a delivery zone before placing your order.');
      return;
    }
    const input: OrderInput = {
      ...(source === 'ecommerce' ? { zone_id: zoneId } : {}),
      payment_method: 'cod',
      delivery_address: {
        fullName: customer.name,
        phone: customer.phone,
        email: customer.email ?? '',
        isDefault: details.isDefault ?? false,
        addressType: details.addressType || details.address_type || location?.type || 'home',
        flatNo: details.flatNo || details.flat_no || '',
        buildingName: details.buildingName || details.building_name || '',
        landmark: details.landmark || '',
        address: addressText,
        city,
        pincode,
        latitude,
        longitude,
      },
      customer_note: 'Online payment order from checkout',
      items: orderItems,
    };
    setPlacingOrder(true);
    try {
      const order = await createCustomerOrder(token, input);
      dispatch(clearCommerceCart());
      navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('OrderStatus', {
        success: true,
        orderNumber: order?.order_number || order?.order_no || (order?.order_id ? String(order.order_id) : undefined),
      });
    } catch (error) {
      const payload = error instanceof ApiError ? error.payload as { msg?: string; message?: string } | undefined : undefined;
      navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('OrderStatus', {
        success: false,
        reason: payload?.msg || payload?.message || (error instanceof Error ? error.message : 'Please try again.'),
      });
    } finally { setPlacingOrder(false); }
  };

  return (
    <LinearGradient colors={screenGradientColors(theme)} locations={screenGradientLocations} style={styles.safe}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.hero}>
          <BottomTabHeader />
          <AppText color={theme.colors.primary} style={styles.eyebrow} weight="800">— READY WHEN YOU ARE</AppText>
          <AppText style={styles.title} weight="500">Your <AppText color={theme.colors.primary} style={styles.title} weight="500">cart.</AppText></AppText>
          {source ? <AppText color={theme.colors.textMuted} style={styles.source}>{source === 'global' ? 'Global Store order' : 'E-commerce order'}</AppText> : null}
        </View>

        {!items.length ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primarySoft }]}><ShoppingBag color={theme.colors.primary} size={25} /></View>
            <AppText style={styles.emptyTitle} weight="700">Your cart is empty</AppText>
            <AppText color={theme.colors.textMuted} style={styles.emptyText}>E-commerce and Global Store items you add will appear here.</AppText>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              <View style={[styles.addressCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.addressIcon, { backgroundColor: theme.colors.primarySoft }]}><MapPin color={theme.colors.primary} size={19} /></View>
                <View style={styles.addressCopy}><AppText style={styles.addressTitle} weight="800">Delivering to</AppText><AppText color={theme.colors.textMuted} style={styles.addressText} numberOfLines={2}>{selectedAddress ? addressSummary(selectedAddress) : addressesLoading ? 'Loading saved addresses…' : addressError ? 'Could not load saved addresses' : token ? 'No saved address yet' : 'Sign in to choose an address'}</AppText></View>
                <Pressable accessibilityRole="button" onPress={() => { setAddressesOpen(true); if (addressError) loadAddresses(); }}><AppText color={theme.colors.primary} style={styles.changeText} weight="800">Change</AppText></Pressable>
              </View>
              <AppText style={styles.itemsHeading} weight="600">Your items</AppText>
              {groups.map(group => {
                const delivery = group.items.find(item => item.estimatedDelivery)?.estimatedDelivery;
                return <View key={group.name} style={[styles.groupCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={[styles.groupHeader, { backgroundColor: theme.colors.surfaceMuted, borderBottomColor: theme.colors.border }]}><View style={styles.groupCopy}><AppText style={styles.groupName} weight="800">{group.name}</AppText><AppText color={theme.colors.textMuted} style={styles.groupSub}>Items from this seller</AppText></View>{delivery ? <View style={[styles.deliveryBadge, { backgroundColor: theme.colors.primarySoft }]}><AppText color={theme.colors.success} style={styles.deliveryText} weight="800">● {delivery}</AppText></View> : null}</View>
                  {group.items.map((item, index) => <View key={item.id} style={[styles.item, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
                    <View style={[styles.imageWrap, { backgroundColor: theme.colors.primarySoft }]}><Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} resizeMode="cover" style={styles.image} /></View>
                    <View style={styles.copy}><AppText color={theme.colors.textMuted} numberOfLines={1} style={styles.brand} weight="800">{(item.brand || group.name).toUpperCase()}</AppText><AppText numberOfLines={2} style={styles.name} weight="800">{item.name}</AppText>{item.detail ? <AppText color={theme.colors.textMuted} numberOfLines={2} style={styles.detail}>{item.detail}</AppText> : null}</View>
                    <View style={styles.actions}><AppText style={styles.price} weight="800">₹{(item.price * item.quantity).toLocaleString('en-IN')}</AppText><View style={styles.quantity}><Pressable accessibilityLabel={`Remove one ${item.name}`} onPress={() => dispatch(setCommerceItemQuantity({ id: item.id, quantity: item.quantity - 1 }))} style={[styles.quantityButton, { borderColor: theme.colors.border }]}><Minus color={theme.colors.text} size={14} /></Pressable><AppText style={styles.quantityText} weight="800">{item.quantity}</AppText><Pressable accessibilityLabel={`Add one ${item.name}`} onPress={() => dispatch(setCommerceItemQuantity({ id: item.id, quantity: item.quantity + 1 }))} style={[styles.quantityButton, { borderColor: theme.colors.border }]}><Plus color={theme.colors.text} size={14} /></Pressable></View></View>
                  </View>)}
                  <View style={[styles.groupFooter, { backgroundColor: theme.colors.surfaceMuted, borderTopColor: theme.colors.border }]}><AppText color={theme.colors.textMuted} style={styles.footerText}>{source === 'global' ? 'Standard delivery' : 'Local delivery'}</AppText><AppText color={theme.colors.success} style={styles.footerText} weight="800">{delivery ? `Arrives in ${delivery}` : 'Delivery at checkout'}</AppText></View>
                </View>;
              })}
              <View style={styles.billCard}>
                <AppText color="#FFFFFF" style={styles.billTitle} weight="600">Bill details</AppText>
                <View style={styles.billRow}><AppText color="#B7C3D1" style={styles.billLabel}>Item total</AppText><AppText color="#B7C3D1" style={styles.billValue}>₹{total.toLocaleString('en-IN')}</AppText></View>
                <View style={styles.billRow}><AppText color="#B7C3D1" style={styles.billLabel}>Delivery fee</AppText><AppText color="#B7C3D1" style={styles.billValue}>Free</AppText></View>
                <View style={styles.billRow}><AppText color="#B7C3D1" style={styles.billLabel}>Handling</AppText><AppText color="#B7C3D1" style={styles.billValue}>Free</AppText></View>
                <View style={styles.billDivider} />
                <View style={styles.billTotalRow}><AppText color="#FFFFFF" style={styles.billTotal} weight="600">To pay</AppText><AppText color="#FFFFFF" style={styles.billTotal} weight="800">₹{total.toLocaleString('en-IN')}</AppText></View>
              </View>
            </ScrollView>
            <View style={[styles.checkout, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
              <Pressable accessibilityRole="button" disabled={placingOrder} onPress={placeOrder} style={[styles.checkoutButton, { backgroundColor: theme.colors.primary, opacity: placingOrder ? 0.6 : 1 }]}><AppText color="#FFFFFF" style={styles.checkoutText} weight="800">{placingOrder ? 'Placing order…' : 'Proceed to checkout'}</AppText>{placingOrder ? <ActivityIndicator color="#FFFFFF" /> : <AppText color="#FFFFFF" style={styles.checkoutAmount} weight="800">₹{total.toLocaleString('en-IN')}</AppText>}</Pressable>
            </View>
          </>
        )}
        <AddressesSheet visible={addressesOpen} title="Choose delivery address" subtitle="Where should we deliver your order?" addresses={addresses} selectedId={selectedAddress?.address_id ?? null} loading={addressesLoading} error={addressError} onRetry={loadAddresses} onClose={() => setAddressesOpen(false)} onSelect={address => { setSelectedAddressId(address.address_id); setAddressesOpen(false); }} onCreate={() => { setAddressesOpen(false); navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('AddressForm'); }} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, hero: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 18 },
  eyebrow: { fontSize: 9, lineHeight: 12, letterSpacing: 0.8, marginBottom: 4 }, title: { fontSize: 25, lineHeight: 29, letterSpacing: -0.8 }, source: { marginTop: 4, fontSize: 9, lineHeight: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }, emptyIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, emptyTitle: { fontSize: 15, lineHeight: 20 }, emptyText: { marginTop: 4, textAlign: 'center', fontSize: 10, lineHeight: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 110, gap: 10 }, itemsHeading: { marginTop: 10, marginBottom: 2, fontSize: 18, lineHeight: 23 }, groupCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' }, groupHeader: { minHeight: 70, borderBottomWidth: 1, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, groupCopy: { flex: 1 }, groupName: { fontSize: 14, lineHeight: 18 }, groupSub: { marginTop: 4, fontSize: 9, lineHeight: 12 }, deliveryBadge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7 }, deliveryText: { fontSize: 9, lineHeight: 12 }, item: { minHeight: 112, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 }, imageWrap: { width: 66, height: 76, borderRadius: 17, overflow: 'hidden' }, image: { width: '100%', height: '100%' }, copy: { flex: 1 }, brand: { fontSize: 8, lineHeight: 11, letterSpacing: 0.5 }, name: { marginTop: 4, fontSize: 12, lineHeight: 16 }, detail: { marginTop: 4, fontSize: 9, lineHeight: 13 }, price: { fontSize: 12, lineHeight: 16 }, actions: { alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'space-between' }, quantity: { flexDirection: 'row', alignItems: 'center', gap: 6 }, quantityButton: { width: 29, height: 29, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, quantityText: { minWidth: 12, textAlign: 'center', fontSize: 11 }, groupFooter: { minHeight: 39, borderTopWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, footerText: { fontSize: 10, lineHeight: 14 },
  billCard: { marginTop: 12, padding: 20, borderRadius: 22, backgroundColor: '#071E33' }, billTitle: { marginBottom: 13, fontSize: 18, lineHeight: 23 }, billRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }, billLabel: { fontSize: 12, lineHeight: 17 }, billValue: { fontSize: 12, lineHeight: 17 }, billDivider: { height: 1, backgroundColor: '#365065', marginTop: 6, marginBottom: 13 }, billTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, billTotal: { fontSize: 17, lineHeight: 22 },
  checkout: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12 }, checkoutButton: { height: 50, borderRadius: 14, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, checkoutText: { fontSize: 12, lineHeight: 16 }, checkoutAmount: { fontSize: 13, lineHeight: 17 },
  addressCard: { minHeight: 68, borderWidth: 1, borderRadius: 17, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }, addressIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, addressCopy: { flex: 1 }, addressTitle: { fontSize: 12, lineHeight: 16 }, addressText: { marginTop: 3, fontSize: 10, lineHeight: 14 }, changeText: { fontSize: 11, lineHeight: 14 },
});
