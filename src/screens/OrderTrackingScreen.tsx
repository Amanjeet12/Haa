import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Package from 'lucide-react-native/icons/package';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomerOrder, getCustomerOrders } from '../api/orders';
import { AppText } from '../components';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderTracking'>;

export function OrderTrackingScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const [order, setOrder] = useState<CustomerOrder>(route.params.order);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const orders = await getCustomerOrders(token);
      const updated = orders.find(item => item.order_id === route.params.order.order_id || (item.order_no && item.order_no === route.params.order.order_no));
      if (updated) setOrder(updated);
      else setError('This order was not found in your latest orders list.');
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not refresh this order.'); }
    finally { setLoading(false); }
  }, [route.params.order.order_id, route.params.order.order_no, token]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const status = (order.order_status || order.status || 'pending').toLowerCase();
  const stages = [
    { label: 'Order placed', done: true, time: order.createdAt || order.created_at },
    { label: 'Confirmed', done: Boolean(order.confirmed_at) || ['confirmed', 'packed', 'out_for_delivery', 'delivered'].includes(status), time: order.confirmed_at },
    { label: 'Packed', done: Boolean(order.packed_at) || ['packed', 'out_for_delivery', 'delivered'].includes(status), time: order.packed_at },
    { label: 'On the way', done: Boolean(order.out_for_delivery_at) || ['out_for_delivery', 'delivered'].includes(status), time: order.out_for_delivery_at },
    { label: 'Delivered', done: Boolean(order.delivered_at) || status === 'delivered', time: order.delivered_at },
  ];
  const total = Number(order.grand_total ?? order.total_amount);
  const number = order.order_no || order.order_number || (order.order_id ? `#${order.order_id}` : 'Order');
  const formatTime = (value?: string | null) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : null;

  return <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: theme.colors.background }]}><View style={[styles.header, { borderBottomColor: theme.colors.border }]}><Pressable onPress={navigation.goBack} style={styles.back}><ChevronLeft color={theme.colors.text} size={20} /></Pressable><AppText style={styles.headerTitle} weight="800">Track order</AppText><View style={styles.headerSpacer} /></View><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.primary} />}>
    <AppText color={theme.colors.primary} style={styles.eyebrow} weight="800">ORDER {number}</AppText><AppText style={styles.title} weight="800">{status.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase())}</AppText><AppText color={theme.colors.textMuted} style={styles.subtitle}>Pull down to refresh the latest order status.</AppText>
    {error ? <Pressable onPress={refresh} style={styles.error}><AppText color={theme.colors.primary}>{error} Tap to retry.</AppText></Pressable> : null}
    <View style={[styles.timelineCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><AppText style={styles.sectionTitle} weight="800">Delivery progress</AppText>{stages.map((stage, index) => <View key={stage.label} style={styles.stage}><View style={[styles.dot, { backgroundColor: stage.done ? theme.colors.success : theme.colors.surface, borderColor: stage.done ? theme.colors.success : theme.colors.border }]} /><View style={styles.stageCopy}><AppText color={stage.done ? theme.colors.text : theme.colors.textMuted} style={styles.stageLabel} weight={stage.done ? '800' : '500'}>{stage.label}</AppText>{formatTime(stage.time) ? <AppText color={theme.colors.textMuted} style={styles.stageTime}>{formatTime(stage.time)}</AppText> : null}</View>{index === stages.length - 1 ? null : <View style={[styles.connector, { backgroundColor: stage.done && stages[index + 1].done ? theme.colors.success : theme.colors.border }]} />}</View>)}</View>
    <AppText style={styles.productsTitle} weight="800">Products in this order</AppText>
    {order.items?.map((item, index) => {
      const image = item.product_image?.url || item.product_snapshot?.images?.[0]?.url;
      const lineTotal = Number(item.line_total ?? item.unit_price);
      return <Pressable key={item.order_item_id ?? index} onPress={() => navigation.navigate('OrderProductDetails', { item, vendorName: order.vendor?.business_name })} style={[styles.itemCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><View style={[styles.imageWrap, { backgroundColor: theme.colors.primarySoft }]}>{image ? <Image source={{ uri: image }} style={styles.image} /> : <Package color={theme.colors.primary} size={25} />}</View><View style={styles.itemCopy}><AppText style={styles.itemName} weight="800">{item.product_name || 'Product'}</AppText><AppText color={theme.colors.textMuted} style={styles.itemDetail}>Qty {item.quantity ?? 1}{order.vendor?.business_name ? ` · ${order.vendor.business_name}` : ''}</AppText>{Number.isFinite(lineTotal) ? <AppText style={styles.amount} weight="800">₹{lineTotal.toLocaleString('en-IN')}</AppText> : null}<AppText color={theme.colors.primary} style={styles.viewDetails} weight="800">View product details →</AppText></View></Pressable>;
    })}
    {Number.isFinite(total) ? <View style={styles.totalRow}><AppText style={styles.totalLabel} weight="800">Order total</AppText><AppText style={styles.totalLabel} weight="800">₹{total.toLocaleString('en-IN')}</AppText></View> : null}
    {loading ? <ActivityIndicator color={theme.colors.primary} style={styles.loader} /> : null}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  productsTitle: { marginTop: 21, fontSize: 15, lineHeight: 19 }, viewDetails: { marginTop: 7, fontSize: 9, lineHeight: 12 }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingHorizontal: 3 }, totalLabel: { fontSize: 13, lineHeight: 17 },
  screen: { flex: 1 }, header: { height: 56, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }, back: { width: 36, height: 36, justifyContent: 'center' }, headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 21 }, headerSpacer: { width: 36 }, content: { padding: 17, paddingBottom: 32 }, eyebrow: { fontSize: 8, lineHeight: 12, letterSpacing: 0.7 }, title: { marginTop: 4, fontSize: 23, lineHeight: 28 }, subtitle: { marginTop: 4, fontSize: 10, lineHeight: 14 }, error: { marginTop: 13 }, timelineCard: { borderWidth: 1, borderRadius: 17, marginTop: 22, padding: 16 }, sectionTitle: { marginBottom: 14, fontSize: 15, lineHeight: 19 }, stage: { minHeight: 49, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, dot: { width: 14, height: 14, borderWidth: 2, borderRadius: 7, marginTop: 2 }, connector: { position: 'absolute', left: 6, top: 17, width: 2, height: 29 }, stageCopy: { flex: 1 }, stageLabel: { fontSize: 11, lineHeight: 16 }, stageTime: { marginTop: 2, fontSize: 9, lineHeight: 12 }, itemCard: { borderWidth: 1, borderRadius: 17, marginTop: 12, padding: 11, flexDirection: 'row', gap: 12 }, imageWrap: { width: 68, height: 68, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, image: { width: '100%', height: '100%' }, itemCopy: { flex: 1, justifyContent: 'center' }, itemName: { fontSize: 12, lineHeight: 16 }, itemDetail: { marginTop: 4, fontSize: 9, lineHeight: 12 }, amount: { marginTop: 6, fontSize: 12, lineHeight: 16 }, loader: { marginTop: 14 },
});
