import { Platform } from 'react-native';

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

export async function loginCustomer(phone: string, pin: string) {
  return apiRequest<LoginResponse>(`${apiBaseUrl}/customer/login`, {
    method: 'POST',
    body: JSON.stringify({
      phone: phone.startsWith('+') ? phone : `+91${phone}`,
      pin,
      device_info: { platform: Platform.OS },
    }),
  });
}
