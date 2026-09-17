import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

type LabTest = {
  test_timing?: string;
  final_price?: number;
  offer_price?: string;
  normal_price?: string;
  test?: {
    test_name?: string;
    tags?: string[];
    category?: { category_name?: string };
  };
};

export type ApiLab = {
  lab_id: number;
  zone_id: number;
  lab_name: string;
  opening_hour?: string;
  slug?: string;
  address?: {
    city?: string;
    state?: string;
    pincode?: string;
    address_line_1?: string;
  };
  image?: string;
  banner?: { mobile?: { url?: string }; desktop?: { url?: string } };
  certifications?: string[];
  tags?: string[];
  avg_rating?: string;
  rating_count?: number;
  minimum_price_test?: LabTest | null;
};

export type LabsPage = {
  data: ApiLab[];
  meta: {
    start: number;
    end: number;
    limit: number;
    total: number;
    hasMore: boolean;
    nextStart: number | null;
    nextEnd: number | null;
  };
};

type LabsResponse = LabsPage & { success: number | string; msg: string };

export async function getLabsByZone(
  zoneId: number,
  start?: number,
  end?: number,
  search?: string,
): Promise<LabsPage> {
  const params: string[] = [];
  if (start !== undefined && end !== undefined) {
    params.push(`start=${start}`, `end=${end}`);
  }
  if (search?.trim()) params.push(`search=${encodeURIComponent(search.trim())}`);
  const query = params.length ? `?${params.join('&')}` : '';
  const response = await apiRequest<LabsResponse>(
    `${apiBaseUrl}/customer/zones/${zoneId}/labs${query}`,
  );
  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch labs.');
  }
  return { data: response.data, meta: response.meta };
}
