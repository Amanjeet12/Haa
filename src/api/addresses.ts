import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type CustomerAddressDetails = {
  flatNo?: string;
  flat_no?: string;
  buildingName?: string;
  building_name?: string;
  address?: string;
  fullAddress?: string;
  full_address?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  addressType?: string;
  address_type?: string;
  isDefault?: boolean;
  location?: {
    type?: string;
    title?: string;
    city?: string;
    address?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };
};

export type CustomerAddress = {
  address_id: number;
  customer_id: number;
  billing_address: CustomerAddressDetails;
  shipping_address: CustomerAddressDetails | null;
  createdAt: string;
  updatedAt: string;
};

type AddressesResponse = {
  success: number | string;
  msg: string;
  data: CustomerAddress[];
};

export async function getCustomerAddresses(token: string) {
  const response = await apiRequest<AddressesResponse>(
    `${apiBaseUrl}/customer/address`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch addresses.');
  }
  return response.data;
}

export function addressTitle(address: CustomerAddress) {
  const details = address.billing_address;
  return (
    details.location?.type ||
    details.addressType ||
    details.address_type ||
    details.location?.title ||
    'Address'
  );
}

export function addressLine(address: CustomerAddress) {
  const details = address.billing_address;
  return (
    details.fullAddress ||
    details.full_address ||
    details.address ||
    details.location?.address ||
    ''
  );
}
