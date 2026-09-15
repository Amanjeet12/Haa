import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { ApiError } from '../api/client';
import { Customer, loginCustomer } from '../api/auth';
import { storageKeys } from '../config/app';
import { readJson, removeStoredValue, writeJson } from '../storage/storage';

export type AuthSession = { customer: Customer; token: string };

type AuthState = {
  session: AuthSession | null;
  status: 'checking' | 'idle' | 'loading';
  error: string | null;
  loggedOut: boolean;
};

const initialState: AuthState = {
  session: null,
  status: 'checking',
  error: null,
  loggedOut: false,
};

function apiErrorMessage(error: unknown) {
  if (
    error instanceof ApiError &&
    error.payload &&
    typeof error.payload === 'object'
  ) {
    const payload = error.payload as { msg?: unknown; message?: unknown };
    if (typeof payload.msg === 'string') return payload.msg;
    if (typeof payload.message === 'string') return payload.message;
  }
  return error instanceof Error && error.name === 'AbortError'
    ? 'The request timed out. Please try again.'
    : 'Login failed. Check your phone number and PIN.';
}

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async () => readJson<AuthSession>(storageKeys.authSession),
);

export const signIn = createAsyncThunk<
  AuthSession,
  { phone: string; pin: string },
  { rejectValue: string }
>('auth/signIn', async (credentials, { rejectWithValue }) => {
  try {
    const response = await loginCustomer(credentials.phone, credentials.pin);
    if (
      Number(response.success) !== 1 ||
      !response.jwt_token ||
      !response.customer
    ) {
      return rejectWithValue(response.msg || 'Login failed.');
    }

    // Never persist the PIN hash returned by the API.
    const customer = { ...response.customer };
    delete customer.pin;
    const session: AuthSession = { customer, token: response.jwt_token };

    try {
      await writeJson(storageKeys.authSession, session);
    } catch (error) {
      // A storage problem must not turn a successful API login into a failure.
      if (__DEV__) {
        console.warn('[Auth storage] Login succeeded but persistence failed', {
          error,
        });
      }
    }

    if (__DEV__) {
      console.log('[Auth] Login fulfilled', {
        customerId: customer.customer_id,
        hasToken: Boolean(session.token),
      });
    }

    return session;
  } catch (error) {
    return rejectWithValue(apiErrorMessage(error));
  }
});

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await removeStoredValue(storageKeys.authSession);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.session = action.payload;
        state.status = 'idle';
      })
      .addCase(restoreSession.rejected, state => {
        state.status = 'idle';
      })
      .addCase(signIn.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.session = action.payload;
        state.status = 'idle';
        state.loggedOut = false;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Login failed.';
      })
      .addCase(signOut.fulfilled, state => {
        state.session = null;
        state.status = 'idle';
        state.error = null;
        state.loggedOut = true;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;
