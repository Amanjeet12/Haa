import Geolocation, {
  GeolocationResponse,
} from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

Geolocation.setRNConfiguration({
  skipPermissionRequests: true,
  authorizationLevel: 'whenInUse',
  enableBackgroundLocationUpdates: false,
  locationProvider: 'playServices',
});

type LocationPermission = 'fine' | 'coarse' | null;

async function requestLocationPermission(): Promise<LocationPermission> {
  if (Platform.OS === 'ios') {
    return new Promise<LocationPermission>(resolve => {
      Geolocation.requestAuthorization(
        () => resolve('fine'),
        () => resolve(null),
      );
    });
  }

  if (Platform.OS === 'android') {
    const finePermission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
    const coarsePermission =
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
    const [hasFine, hasCoarse] = await Promise.all([
      PermissionsAndroid.check(finePermission),
      PermissionsAndroid.check(coarsePermission),
    ]);

    if (hasFine) return 'fine';
    if (hasCoarse) return 'coarse';

    const results = await PermissionsAndroid.requestMultiple([
      finePermission,
      coarsePermission,
    ]);

    if (results[finePermission] === PermissionsAndroid.RESULTS.GRANTED) {
      return 'fine';
    }
    if (results[coarsePermission] === PermissionsAndroid.RESULTS.GRANTED) {
      return 'coarse';
    }
  }

  return null;
}

function readCurrentPosition(
  enableHighAccuracy: boolean,
  timeout: number,
  maximumAge: number,
) {
  return new Promise<GeolocationResponse>((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  });
}

export async function getCurrentLocation(): Promise<GeolocationResponse> {
  const permission = await requestLocationPermission();

  if (!permission) {
    throw new Error('Location permission was not granted.');
  }

  if (permission === 'fine') {
    try {
      return await readCurrentPosition(true, 15_000, 60_000);
    } catch {
      // GPS fixes can be slow or unavailable on older phones and indoors.
      // Fall back to the network provider and allow a recent cached fix.
    }
  }

  return readCurrentPosition(false, 20_000, 10 * 60_000);
}
