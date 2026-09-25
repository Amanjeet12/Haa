import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type CustomerAddressDetails = {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  lat?: number;
  lng?: number;
  flatNo?: string;
  flat_no?: string;
  buildingName?: string;
  building_name?: string;
  address?: string;
  fullAddress?: string;
  full_address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  addressType?: string;
  address_type?: string;
  isDefault?: boolean;
  location?: {
    type?: string;
    title?: string;
    city?: string;
    state?: string;
    address?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };
};

export type BillingAddressInput = {
  isDefault: boolean;
  addressType: string;
  flatNo: string;
  buildingName: string;
  landmark: string;
  address: string;
  location: {
    title: string;
    city: string;
    state?: string;
    type: string;
    address: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
};

export type AddressInput = {
  billing_address: BillingAddressInput | CustomerAddressDetails | null;
  shipping_address: CustomerAddressDetails | null;
};

export type CustomerAddress = {
  address_id: number;
  customer_id: number;
  billing_address: CustomerAddressDetails | null;
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

type AddressMutationResponse = {
  success: number | string;
  msg: string;
  data?: CustomerAddress;
};

export async function createCustomerAddress(
  token: string,
  input: AddressInput,
) {
  const response = await apiRequest<AddressMutationResponse>(
    `${apiBaseUrl}/customer/address`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    },
  );
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to create address.');
  }
  return response.data;
}

export async function updateCustomerAddress(
  token: string,
  addressId: number,
  input: AddressInput,
) {
  const response = await apiRequest<AddressMutationResponse>(
    `${apiBaseUrl}/customer/address/${addressId}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    },
  );
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to update address.');
  }
  return response.data;
}

export async function deleteCustomerAddress(token: string, addressId: number) {
  const response = await apiRequest<AddressMutationResponse>(
    `${apiBaseUrl}/customer/address/${addressId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  );
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to delete address.');
  }
}

export function addressTitle(address: CustomerAddress) {
  const details = address.billing_address;
  if (!details) return 'Address';
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
  if (!details) return '';
  return (
    details.fullAddress ||
    details.full_address ||
    [details.line1, details.line2].filter(Boolean).join(', ') ||
    details.address ||
    details.location?.address ||
    ''
  );
}
