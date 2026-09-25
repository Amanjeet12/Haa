import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type Product = {
  product_id: number;
  vendor_id: number;
  category_id: number;
  sub_category_id: number;
  shop_type: string;
  product_name: string;
  slug: string;
  sku: string;
  description: string | null;
  short_description: string | null;
  images: Array<{ url: string }>;
  price: string;
  offer_price: string | null;
  stock_quantity: number;
  unit: string;
  attributes?: {
    brand?: string;
    vegan?: boolean;
    estimated_delivery?: string;
    about_product?: Record<string, string | undefined>;
    additional_details?: Record<string, string | number | boolean | null>;
  };
  weight?: string | null;
  weight_unit?: string | null;
  tags: string[];
  isActive: boolean;
  vendor?: { business_name: string };
  final_price: number;
  discount_amount: number;
  discount_percentage: number;
  is_in_stock: boolean;
};

type ProductsResponse = {
  success: number | string;
  msg: string;
  data: Product[];
  meta?: {
    total: number;
    hasMore: boolean;
    nextStart: number | null;
    nextEnd: number | null;
  };
};

export async function getProductsPage(categoryId: number, subCategoryId?: number, start?: number, end?: number) {
  const params = new URLSearchParams({
    vendor_type: 'global',
    category_id: String(categoryId),
    status: 'active',
  });
  if (subCategoryId !== undefined) params.set('sub_category_id', String(subCategoryId));
  if (start !== undefined && end !== undefined) {
    params.set('start', String(start));
    params.set('end', String(end));
  }
  const response = await apiRequest<ProductsResponse>(
    `${apiBaseUrl}/customer/products?${params.toString()}`,
  );

  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch products.');
  }

  return { data: response.data, meta: response.meta };
}

export async function getProducts(categoryId: number, subCategoryId?: number) {
  return (await getProductsPage(categoryId, subCategoryId)).data;
}

export async function getQuickCommerceProductsPage(
  zoneId: number,
  categoryId: number,
  subCategoryId?: number,
  start?: number,
  end?: number,
) {
  const params = new URLSearchParams({
    zone_id: String(zoneId),
    vendor_type: 'zone_based',
    category_id: String(categoryId),
  });
  if (subCategoryId !== undefined) params.set('sub_category_id', String(subCategoryId));
  params.set('shop_type', 'quick_delivery');
  params.set('status', 'active');
  if (start !== undefined && end !== undefined) {
    params.set('start', String(start));
    params.set('end', String(end));
  }
  const response = await apiRequest<ProductsResponse>(
    `${apiBaseUrl}/customer/products?${params.toString()}`,
  );

  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch quick delivery products.');
  }

  return { data: response.data, meta: response.meta };
}

export async function getQuickCommerceProducts(zoneId: number, categoryId: number, subCategoryId: number) {
  return (await getQuickCommerceProductsPage(zoneId, categoryId, subCategoryId)).data;
}
