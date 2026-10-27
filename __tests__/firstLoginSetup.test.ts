import { configureStore } from '@reduxjs/toolkit';

import { verifyLoginOtp } from '../src/api/auth';
import {
  authReducer,
  finishFirstFamilyMemberSetup,
  restoreSession,
  signIn,
} from '../src/store/authSlice';

jest.mock('../src/api/auth', () => ({ verifyLoginOtp: jest.fn() }));

test('first-time OTP login requires a family member step until saved or skipped', async () => {
  jest.mocked(verifyLoginOtp).mockResolvedValueOnce({
    success: 1,
    msg: 'OTP verified successfully',
    isOTPVerified: true,
    firstTimeLogin: true,
    customer: { customer_id: 17, name: 'User', phone: '9546938484' } as never,
    jwt_token: 'test-token',
  });
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(restoreSession.fulfilled(null, 'restore'));

  await store.dispatch(signIn({ phone: '9546938484', otp: '123456' }));
  expect(store.getState().auth.session?.needsFirstFamilyMember).toBe(true);

  await store.dispatch(finishFirstFamilyMemberSetup());
  expect(store.getState().auth.session?.needsFirstFamilyMember).toBe(false);
});

test('returning OTP login opens the app directly', async () => {
  jest.mocked(verifyLoginOtp).mockResolvedValueOnce({
    success: 1,
    msg: 'OTP verified successfully',
    isOTPVerified: true,
    firstTimeLogin: false,
    customer: { customer_id: 17, name: 'User', phone: '9546938484' } as never,
    jwt_token: 'test-token',
  });
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(restoreSession.fulfilled(null, 'restore'));

  await store.dispatch(signIn({ phone: '9546938484', otp: '123456' }));
  expect(store.getState().auth.session?.needsFirstFamilyMember).toBe(false);
});
