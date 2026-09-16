import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type LabSlot = {
  slot_id: number;
  lab_id: number;
  start_time: string;
  end_time: string;
  max_bookings_per_slot: number;
  isActive: boolean;
  booking_date: string;
  booked_count: number;
  available_booking_count: number;
  is_available: boolean;
  lab: {
    lab_id: number;
    lab_name: string;
    slug: string;
    phone: string;
    email: string;
    isActive: boolean;
  };
};

type LabSlotsResponse = {
  success: number | string;
  msg: string;
  data: LabSlot[];
};

/** This customer route is public and intentionally sends no auth header. */
export async function getLabSlots(labId: number, bookingDate: string) {
  const params = new URLSearchParams({
    lab_id: String(labId),
    booking_date: bookingDate,
  });
  const response = await apiRequest<LabSlotsResponse>(
    `${apiBaseUrl}/customer/lab_slots?${params.toString()}`,
  );
  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch lab slots.');
  }
  return response.data;
}
