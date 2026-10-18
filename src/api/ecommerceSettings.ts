import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

type EcommerceSettingsResponse = {
  success: number | string;
  msg: string;
  data?: { ecommerce_enabled?: boolean };
};

export async function getEcommerceEnabled(): Promise<boolean> {
  const response = await apiRequest<EcommerceSettingsResponse>(
    `${apiBaseUrl}/customer/settings/ecommerce`,
  );
  if (
    Number(response.success) !== 1 ||
    typeof response.data?.ecommerce_enabled !== 'boolean'
  ) {
    throw new Error(response.msg || 'Unable to fetch ecommerce settings.');
  }
  return response.data.ecommerce_enabled;
}
