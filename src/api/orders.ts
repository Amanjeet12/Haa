import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type OrderInput = {
  zone_id?: number;
  payment_method: 'cod';
  delivery_address: {
    fullName: string;
    phone: string;
    email: string;
    isDefault: boolean;
    addressType: string;
    flatNo: string;
    buildingName: string;
    landmark: string;
    address: string;
    city: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
  customer_note: string;
  items: Array<{ product_id: number; quantity: number }>;
};

export type OrderProductSnapshot = {
  product_name?: string;
  sku?: string;
  unit?: string;
  weight?: string | number;
  weight_unit?: string;
  price?: number | string;
  offer_price?: number | string;
  short_description?: string;
  description?: string;
  shop_type?: string;
  images?: Array<{ url?: string }>;
  category?: { category_name?: string };
  sub_category?: { sub_category_name?: string };
  attributes?: {
    brand?: string;
    vegan?: boolean;
    estimated_delivery?: string;
    about_product?: Record<string, string | undefined>;
    additional_details?: Record<string, string | number | boolean | null>;
  };
};

export type CustomerOrderItem = {
  order_item_id?: number;
  product_id?: number;
  product_name?: string;
  quantity?: number;
  unit_price?: number | string;
  line_total?: number | string;
  shop_type?: string;
  product_image?: { url?: string };
  product_snapshot?: OrderProductSnapshot;
  product?: { product_name?: string; shop_type?: string; images?: Array<{ url?: string }> };
  image?: string;
};

export type CustomerOrder = {
  order_id?: number;
  order_number?: string;
  order_no?: string;
  zone_id?: number | null;
  shop_type?: string;
  vendor_type?: string;
  status?: string;
  order_status?: string;
  estimated_delivery?: string;
  estimated_delivery_time?: string;
  delivery_eta?: string;
  estimated_delivery_at?: string | null;
  confirmed_at?: string | null;
  packed_at?: string | null;
  out_for_delivery_at?: string | null;
  delivered_at?: string | null;
  vendor?: { business_name?: string; vendor_type?: string; logo?: { url?: string } };
  total_amount?: number | string;
  grand_total?: number | string;
  createdAt?: string;
  created_at?: string;
  items?: CustomerOrderItem[];
};

type OrderResponse = { success: number | string; msg?: string; data?: CustomerOrder };
type OrdersResponse = { success: number | string; msg?: string; data?: CustomerOrder[] | { orders?: CustomerOrder[] } };

export async function createCustomerOrder(token: string, input: OrderInput) {
  const response = await apiRequest<OrderResponse>(`${apiBaseUrl}/customer/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to place the order.');
  }
  return response.data;
}

export async function getCustomerOrders(token: string) {
  const response = await apiRequest<OrdersResponse>(`${apiBaseUrl}/customer/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (Number(response.success) !== 1) throw new Error(response.msg || 'Unable to load orders.');
  return Array.isArray(response.data) ? response.data : response.data?.orders ?? [];
}
