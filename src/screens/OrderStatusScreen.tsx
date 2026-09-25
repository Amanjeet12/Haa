import { NativeStackScreenProps } from '@react-navigation/native-stack';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleX from 'lucide-react-native/icons/circle-x';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../components';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderStatus'>;

export function OrderStatusScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const { success, orderNumber, reason } = route.params;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.icon,
          { backgroundColor: success ? '#DCF7EF' : '#FFF0F2' },
        ]}
      >
        {success ? (
          <CircleCheck color="#078A73" size={42} />
        ) : (
          <CircleX color={theme.colors.primary} size={42} />
        )}
      </View>
      <AppText style={styles.title} weight="800">
        {success ? 'Order placed' : 'Order not placed'}
      </AppText>
      <AppText color={theme.colors.textMuted} style={styles.message}>
        {success
          ? 'Your cash-on-delivery order has been confirmed.'
          : reason ||
            'We could not place your order. Your items are still in the cart.'}
      </AppText>
      {success && orderNumber ? (
        <View
          style={[
            styles.reference,
            { backgroundColor: theme.colors.surfaceMuted },
          ]}
        >
          <AppText color={theme.colors.textMuted} style={styles.referenceLabel}>
            ORDER NUMBER
          </AppText>
          <AppText style={styles.referenceValue} weight="800">
            {orderNumber}
          </AppText>
        </View>
      ) : null}
      <Pressable
        onPress={() => navigation.navigate('Home', { screen: 'Orders' })}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
      >
        <AppText color="#FFFFFF" weight="800">
          View my orders
        </AppText>
      </Pressable>
      {!success ? (
        <Pressable
          onPress={() => navigation.navigate('Home', { screen: 'Cart' })}
          style={styles.secondary}
        >
          <AppText color={theme.colors.primary} weight="800">
            Back to cart
          </AppText>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 22, fontSize: 24, lineHeight: 29, textAlign: 'center' },
  message: {
    marginTop: 8,
    maxWidth: 310,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  reference: {
    width: '100%',
    marginTop: 24,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  referenceLabel: { fontSize: 8, lineHeight: 10, letterSpacing: 1 },
  referenceValue: { marginTop: 6, fontSize: 15, lineHeight: 19 },
  button: {
    width: '100%',
    minHeight: 50,
    marginTop: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { padding: 16 },
});
