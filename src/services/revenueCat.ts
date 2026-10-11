import Config from 'react-native-config';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesStoreTransaction,
} from 'react-native-purchases';

// Test Store must never initialize in a release build.
export const revenueCatTestEnabled =
  __DEV__ && Config.REVENUECAT_TEST_MODE === 'true';

let initialization: Promise<void> | undefined;
// Replace with the signed-in customer's ID when dynamic identity is connected.
const revenueCatAppUserId = 'customer_1';

export function initializeRevenueCat() {
  if (!initialization) {
    initialization = (async () => {
      if (!revenueCatTestEnabled) {
        throw new Error(
          'RevenueCat Test Store is only enabled in debug builds.',
        );
      }
      const apiKey = Config.REVENUECAT_TEST_API_KEY?.trim();
      if (!apiKey?.startsWith('test_')) {
        throw new Error(
          'Set a RevenueCat Test Store SDK key in .env and rebuild the app.',
        );
      }
      if (!(await Purchases.isConfigured())) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        Purchases.configure({ apiKey, appUserID: revenueCatAppUserId });
      } else if ((await Purchases.getAppUserID()) !== revenueCatAppUserId) {
        await Purchases.logIn(revenueCatAppUserId);
      }
    })().catch(error => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

export async function loadHaaPlusOffering() {
  await initializeRevenueCat();
  const identifier = Config.REVENUECAT_OFFERING_ID?.trim() || 'New Plan';
  const offerings = await Purchases.getOfferings();
  const offering = offerings.all[identifier];
  if (!offering) {
    throw new Error(
      `RevenueCat offering "${identifier}" was not found. Check its identifier in the dashboard.`,
    );
  }
  if (!offering.availablePackages.length) {
    throw new Error(
      `Add Test Store products to the "${identifier}" offering in RevenueCat.`,
    );
  }
  return offering;
}

export function activeHaaEntitlements(customerInfo: CustomerInfo) {
  const identifiers = (
    Config.REVENUECAT_ENTITLEMENT_IDS || 'ai_analysis_pro,haa_plus'
  )
    .split(',')
    .map(identifier => identifier.trim())
    .filter(Boolean);
  return identifiers.filter(
    identifier => customerInfo.entitlements.active[identifier],
  );
}

export function describeTestPurchase(
  customerInfo: CustomerInfo,
  transaction?: PurchasesStoreTransaction,
) {
  console.log('describeTestPurchase', { customerInfo, transaction });
  const productId =
    transaction?.productIdentifier ?? customerInfo.activeSubscriptions[0];
  const subscription = productId
    ? customerInfo.subscriptionsByProductIdentifier[productId]
    : undefined;
  const entitlementIds = activeHaaEntitlements(customerInfo);
  const entitlement = entitlementIds.length
    ? customerInfo.entitlements.active[entitlementIds[0]]
    : undefined;
  return {
    productId: productId ?? null,
    plan:
      productId === 'monthly'
        ? 'Monthly'
        : productId === 'yearly'
        ? 'Yearly'
        : productId,
    status: productId
      ? !subscription
        ? 'Purchase reported, subscription not verified'
        : subscription.isActive === false
        ? 'Expired'
        : entitlement?.periodType === 'TRIAL' ||
          subscription?.periodType === 'TRIAL'
        ? 'Trial active'
        : 'Active test subscription'
      : 'No subscription recorded',
    purchasedAt:
      transaction?.purchaseDate ?? subscription?.purchaseDate ?? null,
    expiresAt: subscription?.expiresDate ?? entitlement?.expirationDate ?? null,
    willRenew: subscription?.willRenew ?? entitlement?.willRenew ?? null,
    entitlementIds,
    customerId: revenueCatAppUserId,
    transactionId:
      transaction?.transactionIdentifier ??
      subscription?.storeTransactionId ??
      null,
    store: subscription?.store ?? entitlement?.store ?? null,
  };
}
