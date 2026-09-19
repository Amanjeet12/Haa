import { apiRequest } from './client';
import { apiBaseUrl } from '../config/environment';

export type VersionControlResponse = {
  success: boolean;
  requiredAndroidVersion: string;
};

export function getVersionControl() {
  return apiRequest<VersionControlResponse>(`${apiBaseUrl}/version_control`);
}
