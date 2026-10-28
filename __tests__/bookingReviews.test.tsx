import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { BookingReviewSheet } from '../src/components/BookingReviewSheet';
import { BookingReviewScreen } from '../src/screens/BookingReviewScreen';
import { AppText } from '../src/components/AppText';
import { apiRequest } from '../src/api/client';
import {
  getLastPendingBookingReview,
  PendingBookingReview,
  pendingBookingReviewForDisplay,
  submitBookingPhleboReview,
} from '../src/api/bookings';

jest.mock('../src/api/client', () => ({ apiRequest: jest.fn() }));
jest.mock('../src/store', () => ({ useAppSelector: () => 'test-token' }));
jest.mock('../src/theme', () => ({
  useAppTheme: () => ({ theme: require('../src/theme/theme').lightTheme }),
}));
jest.mock('../src/components', () => ({
  AppText: require('../src/components/AppText').AppText,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: require('react-native').View,
  SafeAreaView: require('react-native').View,
}));

const booking: PendingBookingReview = {
  booking_order_id: 159,
  booking_no: 'TEST159',
  booking_date: '2026-10-28',
  booking_status: 'completed',
  total_final_amount: '399',
  lab: { lab_id: 11, lab_name: 'Test lab' },
  pending_overall_review: true,
  pending_phlebo_review: true,
  phlebo_id: 4,
};
let tree: TestRenderer.ReactTestRenderer;
const button = (label: string) =>
  tree.root
    .findAll(node => typeof node.props.onPress === 'function')
    .find(node =>
      node.findAllByType(AppText).some(text => text.props.children === label),
    )!;

beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(apiRequest).mockReset().mockResolvedValue({ success: 1 });
});
afterEach(async () => {
  if (tree) await act(() => tree.unmount());
  jest.useRealTimers();
});

test('rating-only popup saves rating and closes three seconds after success', async () => {
  const close = jest.fn();
  await act(() => {
    tree = TestRenderer.create(
      <BookingReviewSheet
        booking={booking}
        token="test-token"
        onClose={close}
        onWriteReview={jest.fn()}
      />,
    );
  });
  expect(tree.root.findAllByType(TextInput)).toHaveLength(0);
  await act(() =>
    tree.root
      .findAll(node => typeof node.props.onPress === 'function')
      .find(node => node.props.accessibilityLabel === 'Booking: 4 stars')!
      .props.onPress(),
  );
  await act(async () => {
    await button('Submit rating').props.onPress();
  });
  expect(apiRequest).toHaveBeenCalledWith(
    expect.stringContaining('/overall_review/159'),
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ rating: 4, review: '' }),
    }),
  );
  expect(button('Write a review')).toBeDefined();
  await act(() => jest.advanceTimersByTime(2999));
  expect(close).not.toHaveBeenCalled();
  await act(() => jest.advanceTimersByTime(1));
  expect(close).toHaveBeenCalledTimes(1);
});

test('write review opens the inner screen with the saved rating and cancels dismissal', async () => {
  const close = jest.fn();
  const write = jest.fn();
  await act(() => {
    tree = TestRenderer.create(
      <BookingReviewSheet
        booking={booking}
        token="test-token"
        onClose={close}
        onWriteReview={write}
      />,
    );
  });
  await act(() =>
    tree.root
      .findAll(node => typeof node.props.onPress === 'function')
      .find(node => node.props.accessibilityLabel === 'Booking: 5 stars')!
      .props.onPress(),
  );
  await act(async () => {
    await button('Submit rating').props.onPress();
  });
  await act(() => button('Write a review').props.onPress());
  expect(write).toHaveBeenCalledWith(
    expect.objectContaining({
      booking_order_id: 159,
      overall_rating: 5,
      pending_overall_review: false,
    }),
    5,
  );
  await act(() => jest.advanceTimersByTime(3000));
  expect(close).not.toHaveBeenCalled();
});

test('one submit saves both reviews and retry sends only the failed review', async () => {
  const goBack = jest.fn();
  const props = {
    navigation: { goBack },
    route: {
      params: {
        booking: {
          ...booking,
          pending_overall_review: false,
          overall_rating: 4,
        },
        rating: 4,
      },
    },
  } as unknown as React.ComponentProps<typeof BookingReviewScreen>;
  await act(() => {
    tree = TestRenderer.create(<BookingReviewScreen {...props} />);
  });
  await act(() => {
    tree.root
      .findAllByType(TextInput)
      .find(node => node.props.accessibilityLabel === 'Booking review')!
      .props.onChangeText('Good booking');
    tree.root
      .findAllByType(TextInput)
      .find(node => node.props.accessibilityLabel === 'Phlebotomist review')!
      .props.onChangeText('Careful collection');
    tree.root
      .findAll(node => typeof node.props.onPress === 'function')
      .find(node => node.props.accessibilityLabel === 'Phlebotomist: 5 stars')!
      .props.onPress();
  });
  jest
    .mocked(apiRequest)
    .mockResolvedValueOnce({ success: 1 })
    .mockRejectedValueOnce(new Error('Try again'));
  await act(async () => {
    await button('Submit feedback').props.onPress();
  });
  expect(apiRequest).toHaveBeenCalledWith(
    expect.stringContaining('/overall_review/159'),
    expect.objectContaining({
      body: JSON.stringify({ rating: 4, review: 'Good booking' }),
    }),
  );
  expect(apiRequest).toHaveBeenCalledWith(
    expect.stringContaining('/phlebo_review/159'),
    expect.objectContaining({
      body: JSON.stringify({ rating: 5, review: 'Careful collection' }),
    }),
  );
  expect(goBack).not.toHaveBeenCalled();
  await act(async () => {
    await button('Submit feedback').props.onPress();
  });
  expect(apiRequest).toHaveBeenCalledTimes(3);
  expect(jest.mocked(apiRequest).mock.calls[2][0]).toContain(
    '/phlebo_review/159',
  );
  expect(goBack).toHaveBeenCalledTimes(1);
});

test('pending phlebotomist review remains available after overall rating was saved', async () => {
  jest.mocked(apiRequest).mockResolvedValue({
    success: 1,
    data: { ...booking, pending_overall_review: false },
  });
  expect(await getLastPendingBookingReview('pending-phlebo-token')).toEqual(
    expect.objectContaining({ booking_order_id: 159 }),
  );
});

test('completed pending flags hide the popup', () => {
  expect(
    pendingBookingReviewForDisplay('completed-token', {
      ...booking,
      pending_overall_review: false,
      pending_phlebo_review: false,
    }),
  ).toBeNull();
});

test('successful phlebotomist review hides a stale pending response for that account', async () => {
  const pending = { ...booking, pending_overall_review: false };
  await submitBookingPhleboReview(
    'finished-phlebo-token',
    booking.booking_order_id,
    5,
    'Good service',
  );
  expect(
    pendingBookingReviewForDisplay('finished-phlebo-token', pending),
  ).toBeNull();
  jest.mocked(apiRequest).mockResolvedValue({ success: 1, data: pending });
  expect(await getLastPendingBookingReview('finished-phlebo-token')).toBeNull();
  expect(
    pendingBookingReviewForDisplay('different-account-token', pending),
  ).not.toBeNull();
});

test('failed phlebotomist submission keeps the pending review visible', async () => {
  jest
    .mocked(apiRequest)
    .mockResolvedValue({ success: 0, msg: 'Please retry' });
  await expect(
    submitBookingPhleboReview(
      'failed-phlebo-token',
      booking.booking_order_id,
      4,
      '',
    ),
  ).rejects.toThrow('Please retry');
  expect(
    pendingBookingReviewForDisplay('failed-phlebo-token', {
      ...booking,
      pending_overall_review: false,
    }),
  ).not.toBeNull();
});
