import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type Zone = {
  zone_id: number;
  zone_name: string;
  createdAt: string;
  updatedAt: string;
  is_coordinate_in_zone?: boolean;
  has_active_labs?: boolean;
  has_zone_based_quick_delivery_vendor?: boolean;
};

export function zoneAvailabilityLabel(zone: Zone) {
  if (zone.has_active_labs && zone.has_zone_based_quick_delivery_vendor) {
    return 'Labs and delivery available';
  }
  if (zone.has_active_labs) return 'Labs available';
  if (zone.has_zone_based_quick_delivery_vendor) return 'Delivery available';
  return 'Services coming soon';
}

type ZonesResponse = {
  success: number | string;
  msg: string;
  data: Zone[];
  meta?: {
    start: number;
    end: number;
    limit: number;
    total: number;
    hasMore: boolean;
    nextStart: number | null;
    nextEnd: number | null;
  };
};

export async function getCustomerZones(coordinates?: {
  lat: number;
  lng: number;
}) {
  const query = coordinates
    ? `?lat=${encodeURIComponent(coordinates.lat)}&lng=${encodeURIComponent(
        coordinates.lng,
      )}`
    : '';
  const response = await apiRequest<ZonesResponse>(
    `${apiBaseUrl}/customer/zones${query}`,
  );

  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch service zones.');
  }

  return response.data;
}
