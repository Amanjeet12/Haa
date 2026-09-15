import Config from 'react-native-config';

export const googleMapsApiKey = Config.GOOGLE_MAPS_API_KEY?.trim() ?? '';
export const apiBaseUrl =
  Config.API_BASE_URL?.trim().replace(/\/$/, '') ||
  'https://api.nexorahealthcare.com/backend/v1';
