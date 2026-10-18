import { ApiLab } from '../../api/labs';
import { Lab } from './types';

export function toLab(item: ApiLab): Lab {
  const minimumTest = item.minimum_price_test;
  const specialties = Array.from(
    new Set(
      [
        minimumTest?.test?.category?.category_name,
        ...(minimumTest?.test?.tags ?? []),
      ].filter((value): value is string => Boolean(value)),
    ),
  ).slice(0, 3);
  const price =
    minimumTest?.final_price ??
    Number(minimumTest?.offer_price ?? minimumTest?.normal_price ?? 0);
  return {
    id: String(item.lab_id),
    name: item.lab_name,
    rating: Number(item.avg_rating ?? 0),
    reviews: item.rating_count ?? 0,
    price,
    reportTime: minimumTest?.test_timing ?? 'Contact lab',
    certifications: item.certifications ?? [],
    specialties: specialties.length ? specialties : ['Diagnostics'],
    verified: item.tags?.includes('top_rated'),
    partner: item.tags?.includes('premium_partner'),
    accent: '#DCE8E4',
    image: item.image,
    banner: item.banner?.mobile?.url ?? item.banner?.desktop?.url,
    address: item.address?.address_line_1 ?? item.address?.city,
  };
}
