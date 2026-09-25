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

export type FamilyMemberInput = {
  name: string;
  relation: string;
  age: number;
  gender: string;
  phone: string | null;
  profilePhoto: string | null;
  isDefault: boolean;
};

type FamilyMemberMutationResponse = {
  success: number | string;
  msg: string;
  data?: FamilyMember;
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

export async function createFamilyMember(
  token: string,
  input: FamilyMemberInput,
) {
  const response = await apiRequest<FamilyMemberMutationResponse>(
    `${apiBaseUrl}/customer/family_members`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    },
  );
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to create family member.');
  }
  return response.data;
}

export async function updateFamilyMember(
  token: string,
  memberId: number,
  input: FamilyMemberInput,
) {
  const response = await apiRequest<FamilyMemberMutationResponse>(
    `${apiBaseUrl}/customer/family_members/${memberId}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    },
  );
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to update family member.');
  }
  return response.data;
}

export async function deleteFamilyMember(token: string, memberId: number) {
  const response = await apiRequest<FamilyMemberMutationResponse>(
    `${apiBaseUrl}/customer/family_members/${memberId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  );
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to delete family member.');
  }
}

type UploadResponse = {
  success?: number | string;
  msg?: string;
  url?: string;
  location?: string;
  fileUrl?: string;
  data?: string | { url?: string; location?: string; fileUrl?: string };
};

export async function uploadProfileImage(
  token: string,
  file: { uri: string; type?: string; fileName?: string },
) {
  const body = new FormData();
  body.append('file', {
    uri: file.uri,
    type: file.type ?? 'image/jpeg',
    name: file.fileName ?? `family-member-${Date.now()}.jpg`,
  } as unknown as Blob);
  const response = await apiRequest<UploadResponse>(`${apiBaseUrl}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
    timeoutMs: 30_000,
  });
  const nested = typeof response.data === 'object' ? response.data : undefined;
  const url =
    (typeof response.data === 'string' ? response.data : undefined) ??
    nested?.url ??
    nested?.location ??
    nested?.fileUrl ??
    response.url ??
    response.location ??
    response.fileUrl;
  if (!url)
    throw new Error(response.msg || 'Image upload did not return a URL.');
  return normalizeProfilePhoto(url);
}

export function normalizeProfilePhoto(value: string | null) {
  if (!value) return null;
  const markdownUrl = value.match(/^\[([^\]]+)]\([^)]+\)$/)?.[1];
  return encodeURI((markdownUrl ?? value).trim());
}
