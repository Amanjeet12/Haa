import { useEffect, useRef } from 'react';
import { OneSignal } from 'react-native-onesignal';

import { appConfig } from '../config/app';
import { useAppSelector } from '../store';

export function usePushNotifications() {
  const customerId = useAppSelector(
    state => state.auth.session?.customer.customer_id,
  );
  const checkingSession = useAppSelector(
    state => state.auth.status === 'checking',
  );
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    OneSignal.initialize(appConfig.oneSignalAppId);
    initialized.current = true;
    // Ask guests too, without opening Settings after a previous denial.
    OneSignal.Notifications.requestPermission(false).catch(error => {
      if (__DEV__) console.warn('[Push] Permission request failed', error);
    });
  }, []);

  useEffect(() => {
    // OneSignal persists identity: wait for auth restoration before clearing it.
    if (checkingSession) return;
    if (customerId !== undefined && customerId !== null) {
      console.log('[Push] Logging in customer', customerId);
      OneSignal.login(`customer_${customerId}`);
    } else {
      // Detach the customer while retaining an anonymous guest subscription.
      OneSignal.logout();
    }
  }, [checkingSession, customerId]);
}
