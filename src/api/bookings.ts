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

export type CustomerBooking = {
  booking_order_id: number;
  booking_no: string;
  booking_date: string;
  collection_address: CollectionAddress;
  total_normal_amount: string;
  total_final_amount: string;
  payment_method: string;
  payment_status: string;
  booking_status: string;
  customer_otp: string;
  lab: {
    lab_id: number;
    lab_name: string;
    image?: string;
    address?: { city?: string; state?: string; address_line_1?: string };
  };
  members: Array<{
    member_id: number;
    member: {
      member_id: number;
      name: string;
      gender: string;
      age: number;
      relation: string;
    };
    result_pdf: string | null;
    report_status: string | null;
    tests: Array<{
      lab_test_id: number;
      booking_status: string;
      result_pdf: string | null;
      test: {
        test_id: number;
        test_name: string;
        test_code: string;
        requirements?: { sample_type?: string; fasting_required?: boolean };
      };
      slot: {
        slot_id: number;
        start_time: string;
        end_time: string;
      };
      offer_price: number;
    }>;
    total_tests: number;
    total_offer_price: number;
  }>;
  total_members: number;
  total_tests: number;
};

export type FamilyMemberTestBooking = {
  booking_id: number;
  booking_order_id: number;
  family_member_id: number;
  booking_date: string;
  booking_status: string;
  result_pdf: string | null;
  test: { test_id: number; test_name: string; test_code: string };
  lab: { lab_id: number; lab_name: string };
  order: { booking_order_id: number; booking_no: string };
};

type FamilyMemberBookingsResponse = {
  success: number | string;
  msg: string;
  data: {
    family_member: { member_id: number };
    bookings: FamilyMemberTestBooking[];
  };
};

export async function getFamilyMemberTestBookings(
  token: string,
  memberId: number,
) {
  const response = await apiRequest<FamilyMemberBookingsResponse>(
    `${apiBaseUrl}/customer/bookings-family-members/${memberId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (
    Number(response.success) !== 1 ||
    response.data?.family_member?.member_id !== memberId ||
    !Array.isArray(response.data?.bookings)
  ) {
    throw new Error(response.msg || 'Unable to fetch family member bookings.');
  }
  return response.data.bookings;
}

export function reportReadyFamilyBookings(bookings: FamilyMemberTestBooking[]) {
  return bookings.filter(
    booking =>
      Number.isInteger(booking.booking_id) &&
      booking.booking_id > 0 &&
      booking.booking_status.toLowerCase() === 'completed' &&
      Boolean(booking.result_pdf),
  );
}

type CustomerBookingsResponse = {
  success: number | string;
  msg: string;
  data: CustomerBooking[];
};

export async function getCustomerBookings(
  token: string,
  bookingStatus?: string,
) {
  const query = bookingStatus
    ? `?booking_status=${encodeURIComponent(bookingStatus)}`
    : '';
  const response = await apiRequest<CustomerBookingsResponse>(
    `${apiBaseUrl}/customer/bookings${query}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (Number(response.success) !== 1 || !Array.isArray(response.data)) {
    throw new Error(response.msg || 'Unable to fetch bookings.');
  }
  return response.data;
}

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
