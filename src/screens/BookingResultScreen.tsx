import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleX from 'lucide-react-native/icons/circle-x';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components';
import { useAppTheme } from '../theme';
import { HomeStackParamList } from '../types/navigation';

type SuccessProps = NativeStackScreenProps<HomeStackParamList, 'BookingSuccess'>;
type FailedProps = NativeStackScreenProps<HomeStackParamList, 'BookingFailed'>;

export function BookingSuccessScreen({ navigation, route }: SuccessProps) {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.icon, { backgroundColor: '#DCF7EF' }]}>
        <CircleCheck color="#078A73" size={42} />
      </View>
      <AppText style={styles.title} weight="800">Booking confirmed</AppText>
      <AppText color={theme.colors.textMuted} style={styles.message}>
        Your payment was successful and your home collection is booked.
      </AppText>
      <View style={[styles.reference, { backgroundColor: theme.colors.surfaceMuted }]}>
        <AppText color={theme.colors.textMuted} style={styles.referenceLabel}>BOOKING NUMBER</AppText>
        <AppText style={styles.referenceValue} weight="800">{route.params.bookingNo}</AppText>
      </View>
      <Pressable
        onPress={() => navigation.popToTop()}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
      >
        <AppText color="#FFFFFF" weight="800">Back to home</AppText>
      </Pressable>
    </SafeAreaView>
  );
}

export function BookingFailedScreen({ navigation, route }: FailedProps) {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.icon, { backgroundColor: '#FFF0F2' }]}>
        <CircleX color={theme.colors.primary} size={42} />
      </View>
      <AppText style={styles.title} weight="800">Payment unsuccessful</AppText>
      <AppText color={theme.colors.textMuted} style={styles.message}>
        {route.params.reason || 'The payment could not be completed.'}
      </AppText>
      <View style={[styles.reference, { backgroundColor: theme.colors.surfaceMuted }]}>
        <AppText color={theme.colors.textMuted} style={styles.referenceLabel}>BOOKING NUMBER</AppText>
        <AppText style={styles.referenceValue} weight="800">{route.params.bookingNo}</AppText>
      </View>
      <Pressable
        onPress={() => navigation.popToTop()}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
      >
        <AppText color="#FFFFFF" weight="800">Back to home</AppText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { width: 82, height: 82, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 22, fontSize: 24, lineHeight: 29, textAlign: 'center' },
  message: { marginTop: 8, maxWidth: 310, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  reference: { width: '100%', marginTop: 24, borderRadius: 14, padding: 16, alignItems: 'center' },
  referenceLabel: { fontSize: 8, lineHeight: 10, letterSpacing: 1 },
  referenceValue: { marginTop: 6, fontSize: 15, lineHeight: 19 },
  button: { width: '100%', minHeight: 50, marginTop: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
