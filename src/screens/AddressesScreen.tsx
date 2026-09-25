import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import MapPin from 'lucide-react-native/icons/map-pin';
import Plus from 'lucide-react-native/icons/plus';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  addressLine,
  addressTitle,
  CustomerAddress,
  getCustomerAddresses,
} from '../api/addresses';
import { AppText } from '../components';
import { useAppSelector } from '../store';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Addresses'>;

export function AddressesScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const token = useAppSelector(state => state.auth.session?.token);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setAddresses(await getCustomerAddresses(token));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load addresses.',
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
  const savedAddresses = addresses.filter(address =>
    Boolean(address.billing_address),
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Pressable
            onPress={navigation.goBack}
            style={[styles.back, { backgroundColor: theme.colors.surface }]}
          >
            <ChevronLeft color={theme.colors.text} size={20} />
          </Pressable>
          <AppText style={styles.headerTitle} weight="800">
            Saved addresses
          </AppText>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {loading && !addresses.length ? (
            <ActivityIndicator
              color={theme.colors.primary}
              style={styles.state}
            />
          ) : error ? (
            <View style={styles.state}>
              <AppText color={theme.colors.danger} style={styles.stateText}>
                {error}
              </AppText>
              <Pressable onPress={load}>
                <AppText color={theme.colors.primary} weight="800">
                  Try again
                </AppText>
              </Pressable>
            </View>
          ) : (
            <>
              <AppText style={styles.title} weight="800">
                Saved addresses
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.subtitle}>
                Choose an address for bookings or product deliveries.
              </AppText>
              <Pressable
                onPress={() => navigation.navigate('AddressForm')}
                style={[
                  styles.add,
                  {
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primarySoft,
                  },
                ]}
              >
                <Plus color={theme.colors.primary} size={18} />
                <AppText
                  color={theme.colors.primary}
                  style={styles.addText}
                  weight="800"
                >
                  Add new address
                </AppText>
              </Pressable>
              {savedAddresses.length ? (
                savedAddresses.map(address => (
                  <AddressCard
                    key={address.address_id}
                    address={address}
                    onPress={() =>
                      navigation.navigate('AddressForm', { address })
                    }
                  />
                ))
              ) : (
                <AppText
                  color={theme.colors.textMuted}
                  style={styles.emptySection}
                >
                  No saved addresses yet.
                </AppText>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AddressCard({
  address,
  onPress,
}: {
  address: CustomerAddress;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const details = address.billing_address;
  if (!details) return null;
  const city = details.city || details.location?.city;
  const pincode = details.pincode || details.location?.pincode;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.pin, { backgroundColor: theme.colors.primarySoft }]}>
        <MapPin color={theme.colors.primary} size={18} />
      </View>
      <View style={styles.grow}>
        <View style={styles.cardTitleRow}>
          <AppText style={styles.cardTitle} weight="800">
            {addressTitle(address)}
          </AppText>
          {details.isDefault && (
            <View style={styles.defaultBadge}>
              <AppText color="#078A73" style={styles.defaultText} weight="800">
                Default
              </AppText>
            </View>
          )}
        </View>
        <AppText color={theme.colors.textMuted} style={styles.addressLine}>
          {addressLine(address)}
        </AppText>
        <AppText color={theme.colors.textMuted} style={styles.meta}>
          {[city, pincode].filter(Boolean).join(' · ')}
        </AppText>
      </View>
      <ChevronRight color={theme.colors.textMuted} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 21 },
  headerSpacer: { width: 36 },
  content: { padding: 16, paddingBottom: 34 },
  title: { fontSize: 20, lineHeight: 25 },
  shippingTitle: { marginTop: 20 },
  subtitle: { marginTop: 4, fontSize: 9, lineHeight: 13 },
  add: {
    minHeight: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 13,
    marginVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  addText: { fontSize: 11, lineHeight: 14 },
  card: {
    minHeight: 86,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 10,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pin: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grow: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardTitle: { fontSize: 12, lineHeight: 16, textTransform: 'capitalize' },
  defaultBadge: {
    backgroundColor: '#DCF7EF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  defaultText: { fontSize: 7, lineHeight: 9 },
  addressLine: { marginTop: 4, fontSize: 9, lineHeight: 12 },
  meta: { marginTop: 3, fontSize: 8, lineHeight: 10 },
  state: { alignItems: 'center', gap: 9, paddingVertical: 44 },
  stateText: { fontSize: 10, lineHeight: 14, textAlign: 'center' },
  emptySection: { marginBottom: 8, fontSize: 10, lineHeight: 14 },
});
