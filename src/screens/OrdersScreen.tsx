import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Clock3 from 'lucide-react-native/icons/clock-3';
import Package from 'lucide-react-native/icons/package';
import ShoppingBag from 'lucide-react-native/icons/shopping-bag';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomerOrder, getCustomerOrders } from '../api/orders';
import { AppText, BottomTabHeader } from '../components';
import { useAppSelector } from '../store';
import {
  screenGradientColors,
  screenGradientLocations,
  useAppTheme,
} from '../theme';
import { RootStackParamList } from '../types/navigation';

type Filter = 'all' | 'quick' | 'global';

function orderKind(order: CustomerOrder): 'quick' | 'global' {
  if (order.shop_type === 'quick_delivery') return 'quick';
  if (order.shop_type === 'ecommerce') return 'global';
  return order.zone_id != null ||
    order.vendor?.vendor_type === 'zone_based' ||
    order.vendor_type === 'zone_based' ||
    order.items?.some(
      item =>
        item.shop_type === 'quick_delivery' ||
        item.product_snapshot?.shop_type === 'quick_delivery' ||
        item.product?.shop_type === 'quick_delivery',
    )
    ? 'quick'
    : 'global';
}

function orderStatus(order: CustomerOrder) {
  return (order.order_status || order.status || 'placed')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function orderNumber(order: CustomerOrder) {
  return (
    order.order_number ||
    order.order_no ||
    (order.order_id ? `#${order.order_id}` : 'Order')
  );
}

function orderAmount(order: CustomerOrder) {
  const amount = Number(order.grand_total ?? order.total_amount);
  return Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : null;
}

function orderDate(order: CustomerOrder) {
  const value = order.createdAt || order.created_at;
  return value && !Number.isNaN(Date.parse(value))
    ? new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;
}

function orderProduct(order: CustomerOrder) {
  const first = order.items?.[0];
  return {
    name:
      first?.product_name ||
      first?.product?.product_name ||
      'Products in your order',
    image:
      first?.product_image?.url ||
      first?.image ||
      first?.product_snapshot?.images?.[0]?.url ||
      first?.product?.images?.[0]?.url,
    brand: first?.product_snapshot?.attributes?.brand,
    detail: first?.product_snapshot?.short_description,
    estimate: first?.product_snapshot?.attributes?.estimated_delivery,
  };
}

function statusLabel(status: string) {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

export function OrdersScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const token = useAppSelector(state => state.auth.session?.token);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setOrders(await getCustomerOrders(token));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load orders.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = orders.filter(
    order => filter === 'all' || orderKind(order) === filter,
  );
  const previous = filtered.filter(order =>
    ['delivered', 'completed', 'fulfilled'].includes(orderStatus(order)),
  );
  const active = filtered.filter(
    order =>
      ![
        'delivered',
        'completed',
        'fulfilled',
        'cancelled',
        'canceled',
        'failed',
      ].includes(orderStatus(order)),
  );
  const other = filtered.filter(order =>
    ['cancelled', 'canceled', 'failed'].includes(orderStatus(order)),
  );
  const openTracking = (order: CustomerOrder) =>
    navigation
      .getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('OrderTracking', { order });
  const openProduct = (order: CustomerOrder) => {
    const item = order.items?.[0];
    if (item)
      navigation
        .getParent<NativeStackNavigationProp<RootStackParamList>>()
        ?.navigate('OrderProductDetails', {
          item,
          vendorName: order.vendor?.business_name,
        });
  };

  return (
    <LinearGradient
      colors={screenGradientColors(theme)}
      locations={screenGradientLocations}
      style={styles.flex}
    >
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            token ? (
              <RefreshControl
                refreshing={loading}
                onRefresh={load}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          <BottomTabHeader />
          <AppText
            color={theme.colors.primary}
            style={styles.eyebrow}
            weight="800"
          >
            — YOUR ORDERS
          </AppText>
          <AppText style={styles.pageTitle} weight="500">
            Your{' '}
            <AppText
              color={theme.colors.primary}
              style={styles.pageTitle}
              weight="500"
            >
              orders.
            </AppText>
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.pageSubtitle}>
            Track Quick Commerce and Global Store orders in one place.
          </AppText>
          <View style={styles.filters}>
            {(
              [
                ['all', 'All orders'],
                ['quick', 'Quick delivery'],
                ['global', 'Global Store'],
              ] as const
            ).map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setFilter(value)}
                style={[
                  styles.filter,
                  {
                    backgroundColor:
                      filter === value
                        ? theme.colors.text
                        : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <AppText
                  color={
                    filter === value ? theme.colors.surface : theme.colors.text
                  }
                  style={styles.filterText}
                  weight="800"
                >
                  {label}
                </AppText>
              </Pressable>
            ))}
          </View>
          {loading && !orders.length ? (
            <ActivityIndicator
              color={theme.colors.primary}
              style={styles.state}
            />
          ) : error ? (
            <Pressable onPress={load} style={styles.state}>
              <AppText style={styles.stateTitle} weight="800">
                Could not load orders
              </AppText>
              <AppText color={theme.colors.primary} style={styles.stateDetail}>
                Tap to try again
              </AppText>
            </Pressable>
          ) : !filtered.length ? (
            <View style={styles.state}>
              <ShoppingBag color={theme.colors.primary} size={30} />
              <AppText style={styles.stateTitle} weight="800">
                No orders yet
              </AppText>
              <AppText
                color={theme.colors.textMuted}
                style={styles.stateDetail}
              >
                Your orders will appear here.
              </AppText>
            </View>
          ) : (
            <>
              {active.length ? (
                <>
                  <View style={styles.sectionHeader}>
                    <AppText style={styles.sectionTitle} weight="800">
                      Active orders
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.sectionCount}
                    >
                      {active.length} in progress
                    </AppText>
                  </View>
                  {active.map((order, index) =>
                    orderKind(order) === 'quick' ? (
                      <QuickOrderCard
                        key={`active-${orderNumber(order)}-${index}`}
                        order={order}
                        onTrack={() => openTracking(order)}
                        onProductPress={() => openProduct(order)}
                      />
                    ) : (
                      <CompactOrderCard
                        key={`active-${orderNumber(order)}-${index}`}
                        order={order}
                        onTrack={() => openTracking(order)}
                        onProductPress={() => openProduct(order)}
                      />
                    ),
                  )}
                </>
              ) : null}
              {previous.length ? (
                <>
                  <View style={[styles.sectionHeader, styles.previousHeader]}>
                    <AppText style={styles.sectionTitle} weight="800">
                      Previous orders
                    </AppText>
                    <AppText
                      color={theme.colors.textMuted}
                      style={styles.sectionCount}
                    >
                      {previous.length} delivered
                    </AppText>
                  </View>
                  {previous.map((order, index) => (
                    <CompactOrderCard
                      key={`previous-${orderNumber(order)}-${index}`}
                      order={order}
                      previous
                      onProductPress={() => openProduct(order)}
                    />
                  ))}
                </>
              ) : null}
              {other.length ? (
                <>
                  <View style={[styles.sectionHeader, styles.previousHeader]}>
                    <AppText style={styles.sectionTitle} weight="800">
                      Other orders
                    </AppText>
                  </View>
                  {other.map((order, index) => (
                    <CompactOrderCard
                      key={`other-${orderNumber(order)}-${index}`}
                      order={order}
                      onProductPress={() => openProduct(order)}
                    />
                  ))}
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function QuickOrderCard({
  order,
  onTrack,
  onProductPress,
}: {
  order: CustomerOrder;
  onTrack: () => void;
  onProductPress: () => void;
}) {
  const { theme } = useAppTheme();
  const status = orderStatus(order);
  const stages = ['Placed', 'Packed', 'On the way', 'Delivered'];
  const stageIndex = ['packed', 'ready_for_pickup'].includes(status)
    ? 1
    : ['shipped', 'out_for_delivery', 'on_the_way', 'in_transit'].includes(
        status,
      )
    ? 2
    : 0;
  const headline =
    stageIndex === 2
      ? 'On the way to you'
      : stageIndex === 1
      ? 'Getting your order ready'
      : 'Order received';
  const eta =
    order.delivery_eta ||
    order.estimated_delivery_time ||
    order.estimated_delivery ||
    orderProduct(order).estimate;
  const amount = orderAmount(order);
  const date = orderDate(order);
  return (
    <View
      style={[
        styles.quickCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <LinearGradient colors={['#073C4D', '#07A3BD']} style={styles.quickHero}>
        <View style={styles.quickTop}>
          <AppText color="#BEE9F0" style={styles.quickEyebrow} weight="800">
            QUICK COMMERCE · {orderNumber(order)}
          </AppText>
          {eta ? (
            <View style={styles.etaPill}>
              <Clock3 color="#078A73" size={11} />
              <AppText color="#078A73" style={styles.etaText} weight="800">
                {eta}
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText color="#FFFFFF" style={styles.quickTitle} weight="800">
          {headline}
        </AppText>
        <AppText color="#D4F0F4" style={styles.quickSubtitle}>
          {order.items?.length
            ? `${order.items.length} ${
                order.items.length === 1 ? 'item' : 'items'
              }`
            : 'Quick delivery'}
          {date ? ` · Ordered ${date}` : ''}
        </AppText>
      </LinearGradient>
      <View style={styles.quickBody}>
        <View style={styles.quickSummary}>
          <View style={styles.grow}>
            <AppText style={styles.quickStatus} weight="800">
              {statusLabel(status)}
            </AppText>
            <Pressable onPress={onProductPress}>
              <AppText color={theme.colors.textMuted} style={styles.quickMeta}>
                {orderProduct(order).name} →
              </AppText>
            </Pressable>
          </View>
          {amount ? (
            <AppText
              color={theme.colors.primary}
              style={styles.quickAmount}
              weight="800"
            >
              {amount}
            </AppText>
          ) : null}
        </View>
        <View style={styles.progress}>
          {stages.map((stage, index) => (
            <View key={stage} style={styles.progressStep}>
              <View
                style={[
                  styles.progressDot,
                  {
                    borderColor:
                      index <= stageIndex
                        ? theme.colors.success
                        : theme.colors.border,
                    backgroundColor:
                      index <= stageIndex
                        ? theme.colors.success
                        : theme.colors.surface,
                  },
                ]}
              />
              <AppText
                color={
                  index <= stageIndex
                    ? theme.colors.success
                    : theme.colors.textMuted
                }
                style={styles.progressLabel}
                weight={index === stageIndex ? '800' : '500'}
              >
                {stage}
              </AppText>
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onTrack}
          style={[
            styles.trackButton,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <AppText color="#FFFFFF" style={styles.trackText} weight="800">
            Track live order →
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function CompactOrderCard({
  order,
  previous = false,
  onTrack,
  onProductPress,
}: {
  order: CustomerOrder;
  previous?: boolean;
  onTrack?: () => void;
  onProductPress: () => void;
}) {
  const { theme } = useAppTheme();
  const product = orderProduct(order);
  const amount = orderAmount(order);
  const date = orderDate(order);
  const kind = orderKind(order);
  return (
    <View
      style={[
        styles.compactCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Pressable
        onPress={onProductPress}
        style={[
          styles.compactImage,
          { backgroundColor: theme.colors.primarySoft },
        ]}
      >
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <Package color={theme.colors.primary} size={26} />
        )}
      </Pressable>
      <View style={styles.grow}>
        <View style={styles.compactTop}>
          <AppText
            color={theme.colors.textMuted}
            style={styles.compactEyebrow}
            weight="800"
          >
            {kind === 'quick' ? 'QUICK COMMERCE' : 'GLOBAL STORE'} ·{' '}
            {statusLabel(orderStatus(order)).toUpperCase()}
          </AppText>
          <AppText color={theme.colors.textMuted} style={styles.compactNumber}>
            {orderNumber(order)}
          </AppText>
        </View>
        <Pressable onPress={onProductPress}>
          <AppText style={styles.compactTitle} numberOfLines={1} weight="800">
            {previous
              ? `${kind === 'quick' ? 'Quick Commerce' : 'Global Store'} order`
              : product.name}
          </AppText>
        </Pressable>
        <AppText
          color={theme.colors.textMuted}
          style={styles.compactMeta}
          numberOfLines={1}
        >
          {product.brand || order.vendor?.business_name || 'Order'}
          {date ? ` · ${date}` : ''}
        </AppText>
        {amount ? (
          <AppText style={styles.compactAmount} weight="800">
            {amount}
          </AppText>
        ) : null}
        {onTrack ? (
          <Pressable
            accessibilityRole="button"
            onPress={onTrack}
            style={[styles.compactTrack, { borderColor: theme.colors.border }]}
          >
            <AppText style={styles.compactTrackText} weight="800">
              Track shipment
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 9, lineHeight: 12, letterSpacing: 0.8, marginBottom: 4 },
  pageTitle: { fontSize: 25, lineHeight: 29, letterSpacing: -0.8 },
  pageSubtitle: { marginTop: 4, maxWidth: 310, fontSize: 10, lineHeight: 14 },
  trackButton: {
    height: 37,
    borderRadius: 10,
    marginTop: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackText: { fontSize: 10, lineHeight: 13 },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  compactNumber: { fontSize: 7, lineHeight: 10 },
  compactTrack: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 7,
  },
  compactTrackText: { fontSize: 8, lineHeight: 11 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 110 },
  filters: { flexDirection: 'row', gap: 7, paddingTop: 18, paddingBottom: 16 },
  filter: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  filterText: { fontSize: 9, lineHeight: 12 },
  state: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stateTitle: { fontSize: 15, lineHeight: 20 },
  stateDetail: { fontSize: 10, lineHeight: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 9,
  },
  sectionTitle: { fontSize: 17, lineHeight: 21 },
  sectionCount: { fontSize: 9, lineHeight: 12 },
  previousHeader: { marginTop: 18 },
  grow: { flex: 1 },
  quickCard: {
    borderWidth: 1,
    borderRadius: 17,
    overflow: 'hidden',
    marginBottom: 11,
    elevation: 2,
    shadowOpacity: 0.07,
    shadowRadius: 5,
  },
  quickHero: { minHeight: 136, padding: 16 },
  quickTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickEyebrow: { flex: 1, fontSize: 8, lineHeight: 12, letterSpacing: 0.7 },
  etaPill: {
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etaText: { fontSize: 8, lineHeight: 11 },
  quickTitle: { marginTop: 11, fontSize: 19, lineHeight: 24 },
  quickSubtitle: { marginTop: 5, fontSize: 9, lineHeight: 13 },
  quickBody: { padding: 14 },
  quickSummary: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickStatus: { fontSize: 12, lineHeight: 16 },
  quickMeta: { marginTop: 3, fontSize: 9, lineHeight: 12 },
  quickAmount: { fontSize: 12, lineHeight: 16 },
  progress: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: { width: '24%', alignItems: 'center', gap: 6 },
  progressDot: { width: 12, height: 12, borderWidth: 2, borderRadius: 6 },
  progressLabel: { fontSize: 8, lineHeight: 11, textAlign: 'center' },
  compactCard: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    elevation: 1,
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  compactImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: '100%' },
  compactEyebrow: { fontSize: 7, lineHeight: 10, letterSpacing: 0.4 },
  compactTitle: { marginTop: 3, fontSize: 12, lineHeight: 16 },
  compactMeta: { marginTop: 3, fontSize: 9, lineHeight: 12 },
  compactAmount: { marginTop: 6, fontSize: 11, lineHeight: 14 },
});
