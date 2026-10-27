import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type Customer = {
  customer_id: number;
  name: string;
  phone: string;
  email: string | null;
  profilePhoto: string | null;
  personalDetails: unknown | null;
  fcmToken: string | null;
  device_info: { platform: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type LoginApiCustomer = Customer & { pin?: string };

export type LoginResponse = {
  success: number | string;
  msg: string;
  customer: LoginApiCustomer;
  jwt_token: string;
};

export type SendOtpResponse = {
  success: number | string;
  msg?: string;
  customer_id?: number;
  firstTimeLogin?: boolean;
  otp_sent?: boolean;
  test_mode?: boolean;
  otpResponse?: { Status?: string; Details?: string };
  payload?: { Status?: string; Details?: string };
};

export async function sendLoginOtp(phone: string) {
  return apiRequest<SendOtpResponse>(`${apiBaseUrl}/customer/login`, {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export type VerifyOtpResponse = LoginResponse & {
  isOTPVerified?: boolean;
  firstTimeLogin?: boolean;
};

export async function verifyLoginOtp(phone: string, otp: string) {
  return apiRequest<VerifyOtpResponse>(`${apiBaseUrl}/customer/otp_verify`, {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
}
