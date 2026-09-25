import { Product } from '../api/products';
import { images } from '../assets/images';
import { HomeStackParamList } from '../types/navigation';

export function toProductDetails(
  product: Product,
  source: 'global' | 'ecommerce' = 'global',
): HomeStackParamList['ProductDetails']['product'] {
  const price = Number(
    product.final_price ?? product.offer_price ?? product.price,
  );
  const listPrice = Number(product.price);

  return {
    id: String(product.product_id),
    name: product.product_name,
    detail: product.unit,
    price,
    oldPrice: listPrice > price ? listPrice : undefined,
    discount:
      product.discount_percentage > 0
        ? `${Math.round(product.discount_percentage)}% OFF`
        : undefined,
    seller:
      product.attributes?.brand ||
      product.vendor?.business_name ||
      'HAA HEALTH',
    vendorName: product.vendor?.business_name,
    image: product.images[0]?.url ?? images.careImage,
    description: product.description ?? product.short_description ?? undefined,
    source,
    apiProduct: true,
    estimatedDelivery: product.attributes?.estimated_delivery,
    sku: product.sku,
    unit: product.unit,
    weight: product.weight,
    weightUnit: product.weight_unit,
    attributes: product.attributes,
    isInStock: product.is_in_stock,
  };
}
