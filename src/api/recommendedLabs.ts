import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';
import { LabTestItem } from './labTests';

export type RecommendedLab = {
  lab_id: number;
  lab_name: string;
  phone: string;
  email: string;
  slug: string;
  address?: {
    city?: string;
    state?: string;
    pincode?: string;
    address_line_1?: string;
  };
  image?: string;
  tags?: string[];
  zone?: { zone_id: number; zone_name: string };
  total_test_normal_amount: number;
  total_test_final_amount: number;
  total_test_discount_amount: number;
  tests: LabTestItem[];
};

type RecommendedLabsResponse = {
  success: number | string;
  msg: string;
  data: RecommendedLab[];
};

export async function getRecommendedLabs(
  zoneId: number,
  labId: number,
  testIds: number[],
) {
  const params = new URLSearchParams({
    zone_id: String(zoneId),
    lab_id: String(labId),
  });
  const response = await apiRequest<RecommendedLabsResponse>(
    `${apiBaseUrl}/customer/tests/labs?${params.toString()}`,
    { method: 'POST', body: JSON.stringify({ test_ids: testIds }) },
  );
  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch recommended labs.');
  }
  return response.data;
}
