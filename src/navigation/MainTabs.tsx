import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import FileChartColumn from 'lucide-react-native/icons/file-chart-column';
import Package from 'lucide-react-native/icons/package';
import House from 'lucide-react-native/icons/house';
import ShoppingCart from 'lucide-react-native/icons/shopping-cart';
import UserRound from 'lucide-react-native/icons/user-round';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartScreen } from '../screens/CartScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AppTheme, useAppTheme } from '../theme';
import { MainTabParamList } from '../types/navigation';
import { HomeNavigator } from './HomeNavigator';
import { useAppSelector } from '../store';
import { ReportsScreen } from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconProps = {
  color: string;
  focused: boolean;
  name: keyof MainTabParamList;
  theme: AppTheme;
};

function TabIcon({ color, focused, name, theme }: TabIconProps) {
  const iconColor = focused ? theme.colors.onPrimary : color;
  let icon: React.ReactNode;

  switch (name) {
    case 'Bookings':
      icon = <CalendarDays color={iconColor} size={20} strokeWidth={2} />;
      break;
    case 'Reports':
      icon = <FileChartColumn color={iconColor} size={20} strokeWidth={2} />;
      break;
    case 'Cart':
      return (
        <View
          style={[
            styles.cartButton,
            {
              backgroundColor: focused
                ? theme.colors.primary
                : theme.colors.text,
            },
          ]}
        >
          <ShoppingCart color={theme.colors.surface} size={19} />
        </View>
      );
    case 'Orders':
      icon = <Package color={iconColor} size={19} />;
      break;
    case 'Profile':
      icon = <UserRound color={iconColor} size={20} strokeWidth={2} />;
      break;
    default:
      icon = <House color={iconColor} size={20} strokeWidth={2} />;
  }

  return focused ? (
    <View
      style={[styles.activeIcon, { backgroundColor: theme.colors.primary }]}
    >
      {icon}
    </View>
  ) : (
    icon
  );
}

export function MainTabs() {
  const { theme } = useAppTheme();
  const returnToHealthView = useAppSelector(
    state => state.auth.returnToHealthView,
  );
  const insets = useSafeAreaInsets();
  const tabBarBottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: { width: '25%' },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 9,
          marginTop: 2,
          transform: route.name === 'Cart' ? [{ translateY: 4 }] : undefined,
        },
        tabBarStyle: {
          display:
            route.name === 'Home' &&
            (returnToHealthView ||
              [
                'Blog',
                'Blogs',
                'Labs',
                'HealthView',
                'HealthReportSelection',
                'HealthBookingPicker',
                'HealthCheckIn',
                'HealthTrends',
                'HealthResultDetail',
                'HealthRecommendations',
                'HaaPlus',
                'QuickCommerce',
                'FrequentlyBought',
                'FirstAid',
                'ProductDetails',
                'GlobalStore',
                'CategoryProducts',
                'WomensHealth',
                'Search',
                'ProductSearch',
                'CitySearch',
                'LabDetails',
                'AddPatientTests',
                'ReviewBooking',
                'BookingSuccess',
                'BookingFailed',
                'BookingReview',
              ].includes(getFocusedRouteNameFromRoute(route) ?? ''))
              ? 'none'
              : 'flex',
          // Keep the labels above Android's navigation buttons/gesture area.
          // A fixed height gets covered when edge-to-edge mode is enabled.
          height: 56 + tabBarBottomPadding,
          paddingTop: 6,
          paddingBottom: tabBarBottomPadding,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 14,
          shadowColor: theme.colors.shadow,
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        // React Navigation requires icons to be supplied as a render callback.
        // eslint-disable-next-line react/no-unstable-nested-components
        tabBarIcon: props => (
          <TabIcon {...props} name={route.name} theme={theme} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      {/* <Tab.Screen name="Cart" component={CartScreen} /> */}
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -4 }],
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
