import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { ApiError } from '../api/client';
import { Customer, verifyLoginOtp } from '../api/auth';
import { storageKeys } from '../config/app';
import { readJson, removeStoredValue, writeJson } from '../storage/storage';

export type AuthSession = {
  customer: Customer;
  token: string;
  needsFirstFamilyMember?: boolean;
};

type AuthState = {
  session: AuthSession | null;
  status: 'checking' | 'idle' | 'loading';
  error: string | null;
  loggedOut: boolean;
  returnToReviewBooking: boolean;
  returnToHealthView: boolean;
};

const initialState: AuthState = {
  session: null,
  status: 'checking',
  error: null,
  loggedOut: false,
  returnToReviewBooking: false,
  returnToHealthView: false,
};

function apiErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 0) {
    return 'No internet connection.';
  }
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
    : 'OTP verification failed. Please try again.';
}

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async () => readJson<AuthSession>(storageKeys.authSession),
);

export const signIn = createAsyncThunk<
  AuthSession,
  { phone: string; otp: string },
  { rejectValue: string }
>('auth/signIn', async (credentials, { rejectWithValue }) => {
  try {
    const response = await verifyLoginOtp(credentials.phone, credentials.otp);
    if (
      Number(response.success) !== 1 ||
      !response.jwt_token ||
      !response.customer ||
      response.isOTPVerified === false
    ) {
      return rejectWithValue(response.msg || 'Login failed.');
    }

    // Never persist a PIN hash if the API includes one.
    const customer = { ...response.customer };
    delete customer.pin;
    const session: AuthSession = {
      customer,
      token: response.jwt_token,
      needsFirstFamilyMember: response.firstTimeLogin === true,
    };

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
  try {
    await removeStoredValue(storageKeys.authSession);
  } catch (error) {
    if (__DEV__) console.warn('[Auth storage] Could not clear session', error);
  }
});

export const finishFirstFamilyMemberSetup = createAsyncThunk<
  void,
  void,
  { state: { auth: AuthState } }
>('auth/finishFirstFamilyMemberSetup', async (_, { getState }) => {
  const session = getState().auth.session;
  if (session) {
    try {
      await writeJson(storageKeys.authSession, {
        ...session,
        needsFirstFamilyMember: false,
      });
    } catch (error) {
      if (__DEV__)
        console.warn('[Auth storage] Could not save setup progress', error);
    }
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: state => {
      state.error = null;
    },
    requestBookingLogin: state => {
      state.returnToReviewBooking = true;
      state.returnToHealthView = false;
    },
    clearBookingLoginReturn: state => {
      state.returnToReviewBooking = false;
    },
    requestHealthViewLogin: state => {
      state.returnToHealthView = true;
      state.returnToReviewBooking = false;
    },
    clearHealthViewLoginReturn: state => {
      state.returnToHealthView = false;
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
      .addCase(finishFirstFamilyMemberSetup.fulfilled, state => {
        if (state.session) state.session.needsFirstFamilyMember = false;
      })
      .addCase(signOut.pending, state => {
        state.session = null;
        state.status = 'idle';
        state.error = null;
        state.loggedOut = true;
        state.returnToHealthView = false;
      });
  },
});

export const {
  clearAuthError,
  requestBookingLogin,
  clearBookingLoginReturn,
  requestHealthViewLogin,
  clearHealthViewLoginReturn,
} = authSlice.actions;
export const authReducer = authSlice.reducer;
