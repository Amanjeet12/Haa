import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';

import { HomeScreen } from '../screens/HomeScreen';
import { LabsScreen } from '../screens/LabsScreen';
import { CitySearchScreen } from '../screens/CitySearchScreen';
import { LabDetailsScreen } from '../screens/LabDetailsScreen';
import { ReviewBookingScreen } from '../screens/ReviewBookingScreen';
import { AddPatientTestsScreen } from '../screens/AddPatientTestsScreen';
import {
  BookingFailedScreen,
  BookingSuccessScreen,
} from '../screens/BookingResultScreen';
import { HomeStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../store';
import { clearBookingLoginReturn } from '../store/authSlice';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeNavigator() {
  const dispatch = useAppDispatch();
  const returnToReviewBooking = useAppSelector(
    state => state.auth.returnToReviewBooking,
  );

  useEffect(() => {
    if (returnToReviewBooking) dispatch(clearBookingLoginReturn());
  }, [dispatch, returnToReviewBooking]);

  return (
    <Stack.Navigator
      initialRouteName={returnToReviewBooking ? 'ReviewBooking' : 'HomeLanding'}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="HomeLanding" component={HomeScreen} />
      <Stack.Screen name="Labs" component={LabsScreen} />
      <Stack.Screen name="CitySearch" component={CitySearchScreen} />
      <Stack.Screen name="LabDetails" component={LabDetailsScreen} />
      <Stack.Screen name="AddPatientTests" component={AddPatientTestsScreen} />
      <Stack.Screen name="ReviewBooking" component={ReviewBookingScreen} />
      <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
      <Stack.Screen name="BookingFailed" component={BookingFailedScreen} />
    </Stack.Navigator>
  );
}
