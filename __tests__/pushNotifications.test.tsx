import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { OneSignal } from 'react-native-onesignal';

import {
  authReducer,
  restoreSession,
  signIn,
  signOut,
} from '../src/store/authSlice';
import { usePushNotifications } from '../src/services/usePushNotifications';
import type { AuthSession } from '../src/store/authSlice';

function PushLifecycle() {
  usePushNotifications();
  return null;
}

const session = (id: number): AuthSession => ({
  customer: { customer_id: id } as AuthSession['customer'],
  token: 'test-token',
});

beforeEach(() => jest.clearAllMocks());

test('prompts guests, waits for restoration, and tracks login, logout and account changes', async () => {
  const store = configureStore({ reducer: { auth: authReducer } });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <Provider store={store}>
        <PushLifecycle />
      </Provider>,
    );
  });
  expect(OneSignal.initialize).toHaveBeenCalledWith(
    '0d7b5bcd-c378-4baa-8092-5a078c02347d',
  );
  expect(OneSignal.Notifications.requestPermission).toHaveBeenCalledWith(false);
  expect(OneSignal.logout).not.toHaveBeenCalled();

  await act(async () => {
    store.dispatch(restoreSession.fulfilled(null, 'restore'));
  });
  expect(OneSignal.logout).toHaveBeenCalledTimes(1);
  const credentials = { phone: '1234567890', pin: '1234' };
  await act(async () => {
    store.dispatch(signIn.fulfilled(session(42), 'login', credentials));
  });
  expect(OneSignal.login).toHaveBeenLastCalledWith('customer_42');
  await act(async () => {
    store.dispatch(signOut.fulfilled(undefined, 'logout'));
  });
  expect(OneSignal.logout).toHaveBeenCalledTimes(2);
  await act(async () => {
    store.dispatch(signIn.fulfilled(session(99), 'login2', credentials));
  });
  expect(OneSignal.login).toHaveBeenLastCalledWith('customer_99');
  expect(OneSignal.Notifications.requestPermission).toHaveBeenCalledTimes(1);
  await act(async () => {
    renderer.unmount();
  });
});

test('relinks a saved customer without logging them out during startup', async () => {
  const store = configureStore({ reducer: { auth: authReducer } });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <Provider store={store}>
        <PushLifecycle />
      </Provider>,
    );
  });
  await act(async () => {
    store.dispatch(restoreSession.fulfilled(session(42), 'restore'));
  });
  expect(OneSignal.login).toHaveBeenCalledWith('customer_42');
  expect(OneSignal.logout).not.toHaveBeenCalled();
  await act(async () => {
    renderer.unmount();
  });
});
