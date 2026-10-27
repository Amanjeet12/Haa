import {
  canRequestBookingCancellation,
  bookingCancellationStatus,
  cancellationStatusLabel,
  isPastBooking,
  requestBookingCancellation,
  rescheduleBooking,
} from '../src/api/bookings';
import type { CustomerBooking } from '../src/api/bookings';
import { apiRequest } from '../src/api/client';

jest.mock('../src/api/client', () => ({ apiRequest: jest.fn() }));

const booking = (date: string, status = 'accepted') =>
  ({
    booking_date: date,
    booking_status: status,
    members: [],
  } as unknown as CustomerBooking);

test('only future active bookings can request cancellation', () => {
  expect(canRequestBookingCancellation(booking('2099-01-01'))).toBe(true);
  expect(canRequestBookingCancellation(booking('2020-01-01'))).toBe(false);
  expect(
    canRequestBookingCancellation(booking('2099-01-01', 'confirmed')),
  ).toBe(false);
  expect(
    canRequestBookingCancellation(booking('2099-01-01', 'completed')),
  ).toBe(false);
  expect(
    canRequestBookingCancellation({
      ...booking('2099-01-01'),
      cancellation_request_status: 'requested',
    }),
  ).toBe(false);
  expect(
    canRequestBookingCancellation({
      ...booking('2099-01-01'),
      cancellation_request_status: 'approved',
    }),
  ).toBe(false);
  expect(
    isPastBooking({
      ...booking('2099-01-01', 'accepted'),
      cancellation_request_status: 'approved',
    }),
  ).toBe(true);
  expect(cancellationStatusLabel('requested')).toBe('Cancellation requested');
  expect(cancellationStatusLabel('approved')).toBe('Cancellation approved');
  expect(
    bookingCancellationStatus({
      ...booking('2099-01-01', 'accepted'),
      cancellation_request_status: 'requested',
    }),
  ).toBe('requested');
  expect(
    bookingCancellationStatus({
      ...booking('2099-01-01', 'accepted'),
      cancellation_requested_at: '2026-10-26T08:35:23.000Z',
    }),
  ).toBe('requested');
  expect(
    bookingCancellationStatus({
      ...booking('2099-01-01', 'completed'),
      cancellation_request_status: 'none',
    }),
  ).toBeNull();
  expect(
    canRequestBookingCancellation({
      ...booking('2099-01-01', 'accepted'),
      cancellation_request_status: 'none',
    }),
  ).toBe(true);
});

test('reschedules every booking item to the selected lab slot', async () => {
  jest
    .mocked(apiRequest)
    .mockResolvedValueOnce({ success: 1, msg: 'Rescheduled' });
  const currentBooking = {
    ...booking('2099-01-01'),
    booking_order_id: 139,
    members: [{ tests: [{ booking_id: 240 }, { booking_id: 241 }] }],
  } as CustomerBooking;

  await rescheduleBooking('session-token', currentBooking, '2099-01-02', 4);

  expect(apiRequest).toHaveBeenCalledWith(
    expect.stringContaining('/customer/test-booking-orders/139/reschedule'),
    {
      method: 'POST',
      headers: { Authorization: 'Bearer session-token' },
      body: JSON.stringify({
        booking_date: '2099-01-02',
        items: [
          { booking_id: 240, slot_id: 4 },
          { booking_id: 241, slot_id: 4 },
        ],
      }),
    },
  );
});

test('submits the selected reason to the booking cancellation endpoint', async () => {
  jest.mocked(apiRequest).mockResolvedValueOnce({
    success: 1,
    msg: 'Booking cancellation request submitted successfully',
    data: { booking_order_id: 138 },
  });

  await requestBookingCancellation(
    'session-token',
    138,
    'Unable to attend the scheduled collection.',
  );

  expect(apiRequest).toHaveBeenCalledWith(
    expect.stringContaining('/test-booking-orders/138/cancellation-request'),
    {
      method: 'POST',
      headers: { Authorization: 'Bearer session-token' },
      body: JSON.stringify({
        reason: 'Unable to attend the scheduled collection.',
      }),
    },
  );
});
