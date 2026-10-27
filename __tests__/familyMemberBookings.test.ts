import { apiRequest } from '../src/api/client';
import {
  getCustomerBookings,
  getFamilyMemberTestBookings,
  reportReadyFamilyBookings,
  type FamilyMemberTestBooking,
} from '../src/api/bookings';

jest.mock('../src/api/client', () => ({ apiRequest: jest.fn() }));

const request = apiRequest as jest.Mock;
const booking: FamilyMemberTestBooking = {
  booking_id: 228,
  booking_order_id: 129,
  family_member_id: 19,
  booking_date: '2026-10-16',
  booking_status: 'completed',
  result_pdf: 'https://example.com/report.pdf',
  test: { test_id: 8, test_name: 'Kidney Function Test', test_code: 'KFT' },
  lab: { lab_id: 12, lab_name: 'Example Lab' },
  order: { booking_order_id: 129, booking_no: 'NXB123' },
};

beforeEach(() => request.mockReset());

test('filters completed customer bookings by family member', async () => {
  request.mockResolvedValue({ success: 1, msg: 'ok', data: [] });
  await getCustomerBookings('token', 'completed', 36);
  expect(request.mock.calls[0][0]).toContain(
    '/customer/bookings?booking_status=completed&family_member_id=36',
  );
});

test('fetches test bookings for the selected family member', async () => {
  request.mockResolvedValue({
    success: 1,
    msg: 'ok',
    data: { family_member: { member_id: 19 }, bookings: [booking] },
  });
  await expect(getFamilyMemberTestBookings('token', 19)).resolves.toEqual([
    booking,
  ]);
  expect(request.mock.calls[0][0]).toContain(
    '/customer/bookings-family-members/19',
  );
  expect(request.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
});

test('keeps only completed test bookings with a report PDF and booking ID', () => {
  expect(
    reportReadyFamilyBookings([
      booking,
      { ...booking, booking_id: 229, result_pdf: null },
      { ...booking, booking_id: 230, booking_status: 'pending' },
      { ...booking, booking_id: 0 },
    ]),
  ).toEqual([booking]);
});
