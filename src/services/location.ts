import Geolocation, {
  GeolocationResponse,
} from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

Geolocation.setRNConfiguration({
  skipPermissionRequests: true,
  authorizationLevel: 'whenInUse',
  enableBackgroundLocationUpdates: false,
});

async function requestLocationPermission() {
  if (Platform.OS === 'ios') {
    return new Promise<boolean>(resolve => {
      Geolocation.requestAuthorization(
        () => resolve(true),
        () => resolve(false),
      );
    });
  }

  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Allow location access',
        message:
          'Haa Health uses your location to find care and delivery options near you.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  return false;
}

export async function getCurrentLocation(): Promise<GeolocationResponse> {
  const hasPermission = await requestLocationPermission();

  if (!hasPermission) {
    throw new Error('Location permission was not granted.');
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 10_000,
    });
  });
}
