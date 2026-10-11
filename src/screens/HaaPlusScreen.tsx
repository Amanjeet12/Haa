import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesStoreTransaction,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

import { AppButton, AppText, HealthFlowHeader } from '../components';
import {
  describeTestPurchase,
  loadHaaPlusOffering,
  revenueCatTestEnabled,
} from '../services/revenueCat';
import { useAppTheme } from '../theme';
import type { HomeStackParamList } from '../types/navigation';
import { HaaPlusPreviewScreen } from './HaaPlusPreviewScreen';

type Props = NativeStackScreenProps<HomeStackParamList, 'HaaPlus'>;
type Receipt = ReturnType<typeof describeTestPurchase>;

export function HaaPlusScreen(props: Props) {
  return revenueCatTestEnabled ? (
    <HaaPlusTestPaywall {...props} />
  ) : (
    <HaaPlusPreviewScreen {...props} />
  );
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not available';
}

function HaaPlusTestPaywall({ navigation }: Props) {
  const { theme } = useAppTheme();
  const [offering, setOffering] = useState<PurchasesOffering>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [receipt, setReceipt] = useState<Receipt>();
  const [paywallKey, setPaywallKey] = useState(0);
  const [purchaseError, setPurchaseError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>();
  const resultHandled = useRef(false);

  useEffect(() => {
    let active = true;
    setError('');
    setOffering(undefined);
    loadHaaPlusOffering()
      .then(value => {
        if (active) setOffering(value);
      })
      .catch(reason => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Unable to load plans. Please try again.',
          );
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const showReceipt = (
    info: CustomerInfo,
    transaction?: PurchasesStoreTransaction,
  ) => {
    resultHandled.current = true;
    setReceipt(describeTestPurchase(info, transaction));
  };

  const onPaywallDismiss = () => {
    if (resultHandled.current) return;
    // The native paywall can dismiss before its purchase callback reaches JS.
    // Read RevenueCat's current customer record before claiming a purchase succeeded.
    setTimeout(() => {
      if (resultHandled.current) return;
      Purchases.getCustomerInfo()
        .then(showReceipt)
        .catch(reason =>
          setPurchaseError(
            reason instanceof Error
              ? reason.message
              : 'Unable to verify purchase status.',
          ),
        );
    }, 500);
  };

  const retryPaywall = () => {
    resultHandled.current = false;
    setReceipt(undefined);
    setPurchaseError('');
    setSelectedProduct(undefined);
    setPaywallKey(value => value + 1);
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <HealthFlowHeader
        title="HAA Plus"
        subtitle="Test purchase - No real charges"
        onBack={navigation.goBack}
        close
      />
      {receipt ? (
        <ScrollView contentContainerStyle={styles.receipt}>
          <AppText style={styles.title} weight="800">
            Purchase details
          </AppText>
          <AppText color={theme.colors.textMuted}>
            {receipt.productId
              ? 'Reported by RevenueCat Test Store'
              : 'RevenueCat has no confirmed subscription for this customer.'}
          </AppText>
          <View
            style={[
              styles.details,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <ReceiptRow label="Status" value={receipt.status} />
            <ReceiptRow label="Plan" value={receipt.plan ?? 'None'} />
            <ReceiptRow
              label="Product ID"
              value={receipt.productId ?? selectedProduct ?? 'None'}
            />
            <ReceiptRow
              label="Purchased"
              value={formatDate(receipt.purchasedAt)}
            />
            <ReceiptRow label="Expires" value={formatDate(receipt.expiresAt)} />
            <ReceiptRow
              label="Auto-renews"
              value={
                receipt.willRenew === null
                  ? 'Unknown'
                  : receipt.willRenew
                  ? 'Yes'
                  : 'No'
              }
            />
            <ReceiptRow
              label="Entitlements"
              value={receipt.entitlementIds.join(', ') || 'None active'}
            />
            <ReceiptRow
              label="Store"
              value={receipt.store ?? 'Not available'}
            />
            <ReceiptRow
              label="Transaction ID"
              value={receipt.transactionId ?? 'Not available'}
            />
            <ReceiptRow label="Customer ID" value={receipt.customerId} />
          </View>
          {!receipt.entitlementIds.length && receipt.productId ? (
            <AppText color={theme.colors.textMuted}>
              A product was recorded, but no HAA Plus entitlement is active.
              Check its entitlement attachment in RevenueCat.
            </AppText>
          ) : null}
          {!receipt.productId ? (
            <AppText color={theme.colors.textMuted}>
              Complete the Test Store dialog with “TEST VALID PURCHASE,” then
              check this customer ID in RevenueCat Sandbox.
            </AppText>
          ) : null}
          <AppButton
            label="Show test paywall again"
            onPress={retryPaywall}
            fullWidth
          />
        </ScrollView>
      ) : purchaseError ? (
        <View style={styles.message}>
          <AppText weight="700">Purchase was not confirmed</AppText>
          <AppText style={styles.description}>{purchaseError}</AppText>
          <AppButton label="Try again" onPress={retryPaywall} />
        </View>
      ) : offering ? (
        <RevenueCatUI.Paywall
          key={paywallKey}
          style={styles.screen}
          options={{ offering, displayCloseButton: true }}
          onDismiss={onPaywallDismiss}
          onPurchaseStarted={({ packageBeingPurchased }) =>
            setSelectedProduct(packageBeingPurchased.product.identifier)
          }
          onPurchaseCompleted={({ customerInfo, storeTransaction }) =>
            showReceipt(customerInfo, storeTransaction)
          }
          onRestoreCompleted={({ customerInfo }) => showReceipt(customerInfo)}
          onPurchaseError={({ error: paywallError }) =>
            setPurchaseError(paywallError.message)
          }
          onRestoreError={({ error: restoreError }) =>
            setPurchaseError(restoreError.message)
          }
        />
      ) : (
        <View style={styles.message}>
          {error ? (
            <>
              <AppText weight="700">Unable to load the paywall</AppText>
              <AppText style={styles.description}>{error}</AppText>
              <AppButton
                label="Try again"
                onPress={() => setAttempt(value => value + 1)}
              />
            </>
          ) : (
            <>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <AppText>Loading HAA Plus plans...</AppText>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.row}>
      <AppText color={theme.colors.textMuted} style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText style={styles.rowValue} weight="700">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  description: { textAlign: 'center' },
  receipt: { padding: 20, gap: 16 },
  title: { fontSize: 24 },
  details: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 14 },
  row: { gap: 4 },
  rowLabel: { fontSize: 12 },
  rowValue: { fontSize: 15 },
});
