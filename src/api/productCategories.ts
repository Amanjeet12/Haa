import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type ProductCategoryImage = {
  alt: string;
  url: string;
};

export type ProductSubCategory = {
  sub_category_id: number;
  category_id: number;
  sub_category_name: string;
  slug: string;
  description: string | null;
  image: ProductCategoryImage | null;
  display_order: number;
  isActive: boolean;
};

export type ProductCategory = {
  category_id: number;
  category_name: string;
  slug: string;
  description: string | null;
  image: ProductCategoryImage | null;
  display_order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sub_categories: ProductSubCategory[];
  product_count: number;
};

type ProductCategoriesResponse = {
  success: number | string;
  msg: string;
  data: ProductCategory[];
};

export async function getProductCategories(
  vendorType: 'global' | 'zone_based' = 'global',
) {
  const response = await apiRequest<ProductCategoriesResponse>(
    `${apiBaseUrl}/customer/product-categories?start=0&end=19&include_sub_categories=true&include_product_count=true&vendor_type=${vendorType}`,
  );

  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch product categories.');
  }

  return response.data;
}
