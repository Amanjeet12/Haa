import { apiBaseUrl } from '../config/environment';
import { apiRequest } from './client';

export type CollectionAddress = {
  lat: number;
  lng: number;
  city: string;
  name: string;
  type: string;
  phone: string;
  address: string;
};

export type CreateBookingBody = {
  booking_date: string;
  collection_address: CollectionAddress;
  items: Array<{
    lab_test_id: number;
    slot_id: number;
    family_member_id: number;
  }>;
};

export type BookingPaymentData = {
  booking_order: {
    booking_order_id: number;
    booking_no: string;
    total_final_amount: number;
    razorpay_order_id: string;
  };
  razorpay_order: {
    amount: number;
    currency: string;
    id: string;
  };
  key_id: string;
};

type CreateBookingResponse = {
  success: number | string;
  msg: string;
  data: BookingPaymentData;
};

export async function createBooking(token: string, body: CreateBookingBody) {
  const response = await apiRequest<CreateBookingResponse>(
    `${apiBaseUrl}/customer/bookings`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      timeoutMs: 30_000,
    },
  );
  if (
    Number(response.success) !== 1 ||
    !response.data?.booking_order ||
    !response.data?.razorpay_order ||
    !response.data?.key_id
  ) {
    throw new Error(response.msg || 'Unable to create booking.');
  }
  return response.data;
}
