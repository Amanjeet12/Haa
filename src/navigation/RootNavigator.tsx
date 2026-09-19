import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { LocationScreen } from '../screens/LocationScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PinScreen } from '../screens/PinScreen';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { restoreSession } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { MainTabs } from './MainTabs';
import { BookingDetailsScreen } from '../screens/BookingDetailsScreen';
import { AppearancePreferencesScreen } from '../screens/AppearancePreferencesScreen';
import { FamilyMemberFormScreen } from '../screens/FamilyMemberFormScreen';
import { AddressesScreen } from '../screens/AddressesScreen';
import { AddressFormScreen } from '../screens/AddressFormScreen';
import { SupportCreateScreen } from '../screens/SupportCreateScreen';
import { SupportScreen } from '../screens/SupportScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { SupportDetailScreen } from '../screens/SupportDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const { loggedOut, session, status } = useAppSelector(state => state.auth);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  const navigationTheme = useMemo(() => {
    const baseTheme = theme.isDark ? NavigationDarkTheme : NavigationLightTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
    };
  }, [theme]);

  if (status === 'checking') {
    return (
      <View
        style={[styles.loading, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const initialRouteName = session
    ? 'Home'
    : loggedOut
    ? 'Login'
    : 'Onboarding';

  if (__DEV__) {
    console.log('[Auth navigation]', {
      initialRouteName,
      isAuthenticated: Boolean(session),
      status,
    });
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        key={session ? 'authenticated' : loggedOut ? 'logged-out' : 'guest'}
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontFamily: theme.typography.fontFamily.bold,
          },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {session ? (
          <>
            <Stack.Screen
              name="Home"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BookingDetails"
              component={BookingDetailsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="FamilyMemberForm"
              component={FamilyMemberFormScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Addresses"
              component={AddressesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddressForm"
              component={AddressFormScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SupportRequests"
              component={SupportScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SupportCreate"
              component={SupportCreateScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SupportDetail"
              component={SupportDetailScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Group
              screenOptions={{
                headerShown: false,
                animation: 'fade_from_bottom',
                contentStyle: { backgroundColor: theme.colors.gradientEnd },
              }}
            >
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="Location" component={LocationScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Pin" component={PinScreen} />
            </Stack.Group>
            <Stack.Screen
              name="Home"
              component={MainTabs}
              options={{ headerShown: false }}
            />
          </>
        )}
        <Stack.Screen
          name="Support"
          component={HelpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AppearancePreferences"
          component={AppearancePreferencesScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
