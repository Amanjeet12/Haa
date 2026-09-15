import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';
import { LabsPage } from './labs';

export type LabTestType = 'individual_test' | 'health_package';

export type LabTestItem = {
  lab_test_id: number;
  lab_id: number;
  test_id: number;
  normal_price: string;
  offer_price: string;
  test_timing: string;
  isActive: boolean;
  test: {
    test_id: number;
    category_id: number;
    test_type: LabTestType;
    test_name: string;
    test_code: string;
    description: string;
    requirements?: {
      sample_type?: string;
      fasting_duration?: number | null;
      fasting_required?: boolean;
    };
    included_tests?: string[];
    images?: string[];
    tags?: string[];
    category?: {
      category_id: number;
      category_name: string;
      category_type: LabTestType;
      image?: string;
    };
  };
};

type LabTestsResponse = {
  success: number | string;
  msg: string;
  data: LabTestItem[];
  meta: LabsPage['meta'];
};

export async function getLabTests(
  labId: number,
  testType: LabTestType,
  start?: number,
  end?: number,
) {
  const params = new URLSearchParams({ test_type: testType });
  if (start !== undefined) params.set('start', String(start));
  if (end !== undefined) params.set('end', String(end));
  const response = await apiRequest<LabTestsResponse>(
    `${apiBaseUrl}/customer/labs/${labId}/tests?${params.toString()}`,
  );
  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch lab tests.');
  }
  return response;
}
