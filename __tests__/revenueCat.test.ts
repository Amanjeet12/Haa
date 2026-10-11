import type { CustomerInfo } from 'react-native-purchases';

function setup(testMode = 'true', apiKey = 'test_example') {
  jest.resetModules();
  jest.doMock('react-native-config', () => ({
    REVENUECAT_TEST_MODE: testMode,
    REVENUECAT_TEST_API_KEY: apiKey,
    REVENUECAT_OFFERING_ID: 'New Plan',
    REVENUECAT_ENTITLEMENT_IDS: 'ai_analysis_pro,haa_plus',
  }));
  const purchases = require('react-native-purchases').default;
  const service = require('../src/services/revenueCat');
  return { purchases, service };
}

test('loads the requested offering instead of the project default and configures once', async () => {
  const { purchases, service } = setup();
  const offering = { identifier: 'New Plan', availablePackages: [{}] };
  purchases.getOfferings.mockResolvedValue({
    current: { identifier: 'default' },
    all: { 'New Plan': offering },
  });
  const results = await Promise.all([
    service.loadHaaPlusOffering(),
    service.loadHaaPlusOffering(),
  ]);
  expect(results).toEqual([offering, offering]);
  expect(purchases.configure).toHaveBeenCalledTimes(1);
  expect(purchases.configure).toHaveBeenCalledWith({
    apiKey: 'test_example',
    appUserID: 'customer_1',
  });
});

test('identifies an existing anonymous session before loading offerings', async () => {
  const { purchases, service } = setup();
  purchases.isConfigured.mockResolvedValue(true);
  purchases.getAppUserID = jest.fn().mockResolvedValue('$RCAnonymousID:test-user');
  purchases.logIn = jest.fn().mockRejectedValueOnce(new Error('Login failed'))
    .mockResolvedValueOnce({});
  await expect(service.loadHaaPlusOffering()).rejects.toThrow('Login failed');
  expect(purchases.getOfferings).not.toHaveBeenCalled();
  await service.initializeRevenueCat();
  expect(purchases.logIn).toHaveBeenCalledWith('customer_1');
  expect(purchases.configure).not.toHaveBeenCalled();
});

test('keeps an existing customer_1 session', async () => {
  const { purchases, service } = setup();
  purchases.isConfigured.mockResolvedValue(true);
  purchases.getAppUserID = jest.fn().mockResolvedValue('customer_1');
  purchases.logIn = jest.fn();
  await service.initializeRevenueCat();
  expect(purchases.logIn).not.toHaveBeenCalled();
  expect(purchases.configure).not.toHaveBeenCalled();
});

test('rejects disabled test mode without configuring the SDK', async () => {
  const { purchases, service } = setup('false');
  await expect(service.initializeRevenueCat()).rejects.toThrow(
    'only enabled in debug',
  );
  expect(purchases.configure).not.toHaveBeenCalled();
});

test('rejects a live store key in the testing flow', async () => {
  const { purchases, service } = setup('true', 'goog_live');
  await expect(service.initializeRevenueCat()).rejects.toThrow(
    'Test Store SDK key',
  );
  expect(purchases.configure).not.toHaveBeenCalled();
});

test('reports missing and empty offerings instead of silently showing a different plan', async () => {
  const { purchases, service } = setup();
  purchases.getOfferings.mockResolvedValueOnce({ all: {} });
  await expect(service.loadHaaPlusOffering()).rejects.toThrow('was not found');
  purchases.getOfferings.mockResolvedValueOnce({
    all: { 'New Plan': { availablePackages: [] } },
  });
  await expect(service.loadHaaPlusOffering()).rejects.toThrow(
    'Add Test Store products',
  );
});

test('only recognizes configured active entitlements', () => {
  const { service } = setup();
  const customerInfo = {
    entitlements: { active: { ai_analysis_pro: {}, unrelated: {} } },
  } as unknown as CustomerInfo;
  expect(service.activeHaaEntitlements(customerInfo)).toEqual([
    'ai_analysis_pro',
  ]);
  expect(
    service.activeHaaEntitlements({ entitlements: { active: {} } }),
  ).toEqual([]);
});

test('shows confirmed product and entitlement details after purchase', () => {
  const { service } = setup();
  const info = {
    originalAppUserId: '$RCAnonymousID:test-user',
    activeSubscriptions: ['monthly'],
    subscriptionsByProductIdentifier: {
      monthly: {
        productIdentifier: 'monthly',
        purchaseDate: '2026-10-10T07:00:00Z',
        expiresDate: '2026-11-10T07:00:00Z',
        isActive: true,
        willRenew: true,
        periodType: 'NORMAL',
        store: 'TEST_STORE',
        storeTransactionId: 'tx-123',
      },
    },
    entitlements: { active: { ai_analysis_pro: { periodType: 'NORMAL' } } },
  } as unknown as CustomerInfo;
  expect(service.describeTestPurchase(info)).toMatchObject({
    plan: 'Monthly',
    productId: 'monthly',
    status: 'Active test subscription',
    entitlementIds: ['ai_analysis_pro'],
    customerId: 'customer_1',
    transactionId: 'tx-123',
    store: 'TEST_STORE',
  });
});

test('does not claim a purchase when RevenueCat has no subscription', () => {
  const { service } = setup();
  const info = {
    originalAppUserId: '$RCAnonymousID:test-user',
    activeSubscriptions: [],
    subscriptionsByProductIdentifier: {},
    entitlements: { active: {} },
  } as unknown as CustomerInfo;
  expect(service.describeTestPurchase(info)).toMatchObject({
    productId: null,
    status: 'No subscription recorded',
    entitlementIds: [],
  });
});
