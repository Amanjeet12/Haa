import Check from 'lucide-react-native/icons/check';
import MapPin from 'lucide-react-native/icons/map-pin';
import X from 'lucide-react-native/icons/x';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
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
} from '../../api/addresses';
import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

type Props = {
  visible: boolean;
  addresses: CustomerAddress[];
  selectedId: number | null;
  loading: boolean;
  onClose: () => void;
  onSelect: (address: CustomerAddress) => void;
};

export function AddressesSheet({
  visible,
  addresses,
  selectedId,
  loading,
  onClose,
  onSelect,
}: Props) {
  const { theme } = useAppTheme();
  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView
          edges={['bottom']}
          style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          <View style={styles.header}>
            <View>
              <AppText style={styles.title} weight="800">
                Choose collection address
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.subtitle}>
                Where should our phlebotomist visit?
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.close, { backgroundColor: theme.colors.surfaceMuted }]}
            >
              <X color={theme.colors.text} size={19} />
            </Pressable>
          </View>
          {loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={theme.colors.primary} />
              <AppText color={theme.colors.textMuted} style={styles.stateText}>
                Loading saved addresses…
              </AppText>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {addresses.map(address => {
                const selected = address.address_id === selectedId;
                return (
                  <Pressable
                    key={address.address_id}
                    onPress={() => onSelect(address)}
                    style={[styles.address, { borderBottomColor: theme.colors.border }]}
                  >
                    <View
                      style={[styles.icon, { backgroundColor: theme.colors.primarySoft }]}
                    >
                      <MapPin color={theme.colors.primary} size={18} />
                    </View>
                    <View style={styles.copy}>
                      <AppText
                        color={selected ? theme.colors.primary : theme.colors.text}
                        style={styles.name}
                        weight="700"
                      >
                        {addressTitle(address)}
                      </AppText>
                      <AppText color={theme.colors.textMuted} style={styles.addressLine}>
                        {addressLine(address)}
                      </AppText>
                    </View>
                    {selected && (
                      <View style={styles.selected}>
                        <Check color="#078A73" size={13} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
              {!addresses.length && (
                <View style={styles.state}>
                  <AppText style={styles.stateTitle} weight="700">
                    No saved addresses
                  </AppText>
                  <AppText color={theme.colors.textMuted} style={styles.stateText}>
                    Add an address to choose a collection location.
                  </AppText>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
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
    maxHeight: '72%',
    minHeight: 350,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  title: { fontSize: 18, lineHeight: 22 },
  subtitle: { marginTop: 2, fontSize: 9, lineHeight: 12 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  address: {
    minHeight: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  name: { fontSize: 12, lineHeight: 16, textTransform: 'capitalize' },
  addressLine: { marginTop: 3, fontSize: 9, lineHeight: 13 },
  selected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCF7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  state: { alignItems: 'center', paddingVertical: 42, paddingHorizontal: 24 },
  stateTitle: { fontSize: 13, lineHeight: 17 },
  stateText: { marginTop: 6, textAlign: 'center', fontSize: 9, lineHeight: 12 },
});
