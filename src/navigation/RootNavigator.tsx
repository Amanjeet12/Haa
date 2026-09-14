import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Settings from 'lucide-react-native/icons/settings';
import React, { useMemo } from 'react';
import { Pressable } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { LocationScreen } from '../screens/LocationScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PinScreen } from '../screens/PinScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { theme } = useAppTheme();

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

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Onboarding"
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
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'Haa Health',
            // React Navigation requires headerRight to be a render callback.
            // eslint-disable-next-line react/no-unstable-nested-components
            headerRight: () => (
              <Pressable
                accessibilityLabel="Open settings"
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => navigation.navigate('Settings')}
              >
                <Settings color={theme.colors.text} size={22} />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
