import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Clock3 from 'lucide-react-native/icons/clock-3';
import MapPin from 'lucide-react-native/icons/map-pin';
import Search from 'lucide-react-native/icons/search';
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

import { useAppTheme } from '../../theme';
import { AppText } from '../AppText';

export type LabLocation = {
  id: number;
  name: string;
  detail: string;
  availability: string;
};
type Props = {
  visible: boolean;
  selected: string;
  locations: LabLocation[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSearchPress: () => void;
  onRetry: () => void;
  onSelect: (location: LabLocation) => void;
};

export function LocationSheet({
  visible,
  selected,
  locations,
  loading,
  error,
  onClose,
  onSearchPress,
  onRetry,
  onSelect,
}: Props) {
  const { theme } = useAppTheme();
  return (
    <Modal
      animationType="slide"
      transparent
      statusBarTranslucent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SafeAreaView
          edges={['bottom']}
          style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
        >
          <View
            style={[styles.handle, { backgroundColor: theme.colors.border }]}
          />
          <View style={styles.header}>
            <View>
              <AppText style={styles.title} weight="800">
                Choose your location
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.subtitle}>
                Areas where Haa Health is available
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              style={[
                styles.close,
                { backgroundColor: theme.colors.surfaceMuted },
              ]}
            >
              <X color={theme.colors.text} size={20} />
            </Pressable>
          </View>
          <Pressable
            onPress={onSearchPress}
            style={[
              styles.search,
              { backgroundColor: theme.colors.surfaceMuted },
            ]}
          >
            <Search color={theme.colors.textMuted} size={18} />
            <AppText color={theme.colors.textMuted} style={styles.searchText}>
              Search city name
            </AppText>
          </Pressable>
          {loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={theme.colors.primary} />
              <AppText color={theme.colors.textMuted} style={styles.stateText}>
                Loading available zones…
              </AppText>
            </View>
          ) : error ? (
            <View style={styles.state}>
              <AppText style={styles.stateTitle} weight="700">
                Could not load locations
              </AppText>
              <AppText color={theme.colors.textMuted} style={styles.stateText}>
                {error}
              </AppText>
              <Pressable
                onPress={onRetry}
                style={[
                  styles.retry,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <AppText color="#FFFFFF" style={styles.retryText} weight="700">
                  Try again
                </AppText>
              </Pressable>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {locations.map(item => {
                const active = selected === item.name;
                const available = item.availability !== 'Services coming soon';
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelect(item)}
                    style={[
                      styles.row,
                      { borderBottomColor: theme.colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.pin,
                        {
                          backgroundColor: active
                            ? theme.colors.primary
                            : theme.colors.primarySoft,
                        },
                      ]}
                    >
                      <MapPin
                        color={active ? '#FFFFFF' : theme.colors.primary}
                        size={17}
                      />
                    </View>
                    <View style={styles.copy}>
                      <AppText style={styles.name} weight="700">
                        {item.name}
                      </AppText>
                      <AppText
                        color={theme.colors.textMuted}
                        style={styles.detail}
                      >
                        {item.detail}
                      </AppText>
                      <View style={styles.available}>
                        <Clock3
                          color={available ? '#078A73' : theme.colors.warning}
                          size={11}
                        />
                        <AppText
                          color={available ? '#078A73' : theme.colors.warning}
                          style={styles.availableText}
                          weight="600"
                        >
                          {item.availability}
                        </AppText>
                      </View>
                    </View>
                    <ChevronRight color={theme.colors.textMuted} size={18} />
                  </Pressable>
                );
              })}
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
    backgroundColor: 'rgba(2,6,23,.5)',
  },
  sheet: {
    maxHeight: '88%',
    minHeight: 360,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 16,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  title: { fontSize: 21, lineHeight: 26 },
  subtitle: { fontSize: 10, lineHeight: 14 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchText: { fontSize: 12, lineHeight: 16 },
  row: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  name: { fontSize: 12, lineHeight: 16 },
  detail: { fontSize: 8, lineHeight: 11 },
  available: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  availableText: { fontSize: 8, lineHeight: 10 },
  state: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 46,
    paddingHorizontal: 24,
  },
  stateTitle: { fontSize: 14, lineHeight: 18 },
  stateText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
  retry: {
    marginTop: 14,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryText: { fontSize: 10, lineHeight: 13 },
});
