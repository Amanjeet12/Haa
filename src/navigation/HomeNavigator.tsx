import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { HomeScreen } from '../screens/HomeScreen';
import { LabsScreen } from '../screens/LabsScreen';
import { CitySearchScreen } from '../screens/CitySearchScreen';
import { LabDetailsScreen } from '../screens/LabDetailsScreen';
import { ReviewBookingScreen } from '../screens/ReviewBookingScreen';
import { AddPatientTestsScreen } from '../screens/AddPatientTestsScreen';
import { HomeStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeLanding" component={HomeScreen} />
      <Stack.Screen name="Labs" component={LabsScreen} />
      <Stack.Screen name="CitySearch" component={CitySearchScreen} />
      <Stack.Screen name="LabDetails" component={LabDetailsScreen} />
      <Stack.Screen name="AddPatientTests" component={AddPatientTestsScreen} />
      <Stack.Screen name="ReviewBooking" component={ReviewBookingScreen} />
    </Stack.Navigator>
  );
}
