import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type FamilyMember = {
  member_id: number;
  customer_id: number;
  name: string;
  relation: string;
  age: number;
  gender: string;
  phone: string | null;
  profilePhoto: string | null;
  isDefault: boolean;
  isActive: boolean;
};

type FamilyMembersResponse = {
  success: number | string;
  msg: string;
  data: FamilyMember[];
  meta: { total: number; hasMore: boolean };
};

export async function getFamilyMembers(token: string) {
  const response = await apiRequest<FamilyMembersResponse>(
    `${apiBaseUrl}/customer/family_members`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch family members.');
  }
  return response.data
    .filter(member => member.isActive)
    .map(member => ({
      ...member,
      profilePhoto: normalizeProfilePhoto(member.profilePhoto),
    }));
}

export function normalizeProfilePhoto(value: string | null) {
  if (!value) return null;
  const markdownUrl = value.match(/^\[([^\]]+)]\([^)]+\)$/)?.[1];
  return encodeURI((markdownUrl ?? value).trim());
}
