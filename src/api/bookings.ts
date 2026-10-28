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

export type PendingBookingReview = {
  booking_order_id: number;
  booking_no: string;
  booking_date: string;
  booking_status: string;
  total_final_amount: string;
  collection_address?: { address?: string; city?: string };
  lab: { lab_id: number; lab_name: string; image?: string | null };
  pending_overall_review: boolean;
  pending_phlebo_review?: boolean;
  phlebo_id?: number | null;
  overall_rating?: number | null;
  overall_review?: string | null;
  phlebo_rating?: number | null;
  phlebo_review?: string | null;
};

// Keep successful submissions for this session so an older pending response
// cannot prompt the customer again while navigating back to Home.
const submittedReviews = new Map<string, Set<'overall' | 'phlebo'>>();

function rememberSubmittedReview(
  token: string,
  bookingId: number,
  kind: 'overall' | 'phlebo',
) {
  const key = `${token}:${bookingId}`;
  const submitted =
    submittedReviews.get(key) ?? new Set<'overall' | 'phlebo'>();
  submitted.add(kind);
  submittedReviews.set(key, submitted);
}

export function pendingBookingReviewForDisplay(
  token: string,
  booking: PendingBookingReview | null,
): PendingBookingReview | null {
  if (!booking || booking.booking_status !== 'completed') return null;
  const submitted = submittedReviews.get(
    `${token}:${booking.booking_order_id}`,
  );
  const overallPending =
    booking.pending_overall_review === true && !submitted?.has('overall');
  const phleboPending =
    booking.pending_phlebo_review === true && !submitted?.has('phlebo');
  if (!overallPending && !phleboPending) return null;
  return {
    ...booking,
    pending_overall_review: overallPending,
    pending_phlebo_review: phleboPending,
  };
}

export async function getLastPendingBookingReview(token: string) {
  const response = await apiRequest<{
    success: number | string;
    msg?: string;
    data: PendingBookingReview | null;
  }>(`${apiBaseUrl}/customer/test_booking_orders/last_pending_review`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to load pending review.');
  }
  return pendingBookingReviewForDisplay(token, response.data);
}

export async function submitBookingOverallReview(
  token: string,
  bookingOrderId: number,
  rating: number,
  review: string,
) {
  const response = await apiRequest<{ success: number | string; msg?: string }>(
    `${apiBaseUrl}/customer/test_booking_orders/overall_review/${bookingOrderId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rating, review }),
    },
  );
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to submit review.');
  }
  rememberSubmittedReview(token, bookingOrderId, 'overall');
  return response;
}

export async function submitBookingPhleboReview(
  token: string,
  bookingOrderId: number,
  rating: number,
  review: string,
) {
  const response = await apiRequest<{ success: number | string; msg?: string }>(
    `${apiBaseUrl}/customer/test_booking_orders/phlebo_review/${bookingOrderId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rating, review }),
    },
  );
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to submit phlebotomist review.');
  }
  rememberSubmittedReview(token, bookingOrderId, 'phlebo');
  return response;
}

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
  cancellation_request_status?: string | null;
  cancellation_requested_at?: string | null;
  cancellation_reason?: string | null;
  cancellation_charge_amount?: string | number | null;
  refund_amount?: string | number | null;
  refund_status?: string | null;
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
      booking_id: number;
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

export function canRequestBookingCancellation(booking: CustomerBooking) {
  if (
    booking.booking_status.toLowerCase() !== 'accepted' ||
    Boolean(bookingCancellationStatus(booking))
  ) {
    return false;
  }

  const slotEnd = booking.members[0]?.tests[0]?.slot?.end_time;
  const dateTime = new Date(`${booking.booking_date}T${slotEnd ?? '23:59:59'}`);
  return !Number.isNaN(dateTime.getTime()) && dateTime.getTime() > Date.now();
}

export const canRescheduleBooking = canRequestBookingCancellation;

export function bookingCancellationStatus(booking: CustomerBooking) {
  const status = booking.cancellation_request_status?.trim().toLowerCase();
  if (status && status !== 'none' && status !== 'null') return status;
  return booking.cancellation_requested_at ? 'requested' : null;
}

export function isPastBooking(booking: CustomerBooking) {
  return (
    ['completed', 'cancelled', 'canceled', 'rejected'].includes(
      booking.booking_status.toLowerCase(),
    ) || bookingCancellationStatus(booking) === 'approved'
  );
}

export function cancellationStatusLabel(status?: string | null) {
  switch (status?.toLowerCase()) {
    case 'requested':
      return 'Cancellation requested';
    case 'approved':
      return 'Cancellation approved';
    case 'rejected':
      return 'Cancellation rejected';
    default:
      return null;
  }
}

type CancellationRequestResponse = {
  success: number | string;
  msg: string;
  data?: {
    booking_order_id: number;
    cancellation_request_status: string;
    cancellation_charge_amount: number;
    refund_amount: number;
    refund_status: string;
  };
};

export async function requestBookingCancellation(
  token: string,
  bookingOrderId: number,
  reason: string,
) {
  const response = await apiRequest<CancellationRequestResponse>(
    `${apiBaseUrl}/customer/test-booking-orders/${bookingOrderId}/cancellation-request`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    },
  );
  if (Number(response.success) !== 1 || !response.data) {
    throw new Error(response.msg || 'Unable to submit cancellation request.');
  }
  return response;
}

export async function rescheduleBooking(
  token: string,
  booking: CustomerBooking,
  bookingDate: string,
  slotId: number,
) {
  const items = booking.members.flatMap(member =>
    member.tests.map(test => ({
      booking_id: test.booking_id,
      slot_id: slotId,
    })),
  );
  if (
    !items.length ||
    items.some(
      item => !Number.isInteger(item.booking_id) || item.booking_id <= 0,
    )
  ) {
    throw new Error(
      'Booking items are missing. Refresh the booking and try again.',
    );
  }
  const response = await apiRequest<{ success: number | string; msg?: string }>(
    `${apiBaseUrl}/customer/test-booking-orders/${booking.booking_order_id}/reschedule`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ booking_date: bookingDate, items }),
    },
  );
  if (Number(response.success) !== 1) {
    throw new Error(response.msg || 'Unable to reschedule booking.');
  }
  return response;
}

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
  familyMemberId?: number,
) {
  const params = [
    ...(bookingStatus
      ? [`booking_status=${encodeURIComponent(bookingStatus)}`]
      : []),
    ...(familyMemberId !== undefined
      ? [`family_member_id=${encodeURIComponent(familyMemberId)}`]
      : []),
  ];
  const query = params.length ? `?${params.join('&')}` : '';
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
