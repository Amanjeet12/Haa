import { googleMapsApiKey } from '../config/environment';

const placesApiBaseUrl = 'https://places.googleapis.com/v1';

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
};

type PlaceDetailsResponse = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  addressComponents?: Array<{
    longText?: string;
    types?: string[];
  }>;
};

export type PlaceSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullText: string;
};

export type SelectedPlace = {
  placeId: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  pincode?: string;
};

function requireApiKey() {
  if (!googleMapsApiKey) {
    throw new Error('Google Maps API key is not configured.');
  }

  return googleMapsApiKey;
}

async function parseGoogleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Google Places request failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export function createPlacesSessionToken() {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 14)}`;
}

export async function getPlaceSuggestions(
  input: string,
  sessionToken: string,
  signal?: AbortSignal,
  citiesOnly = false,
): Promise<PlaceSuggestion[]> {
  const response = await fetch(`${placesApiBaseUrl}/places:autocomplete`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': requireApiKey(),
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
    },
    body: JSON.stringify({
      input,
      ...(citiesOnly ? { includedPrimaryTypes: ['(cities)'] } : {}),
      includedRegionCodes: ['in'],
      languageCode: 'en',
      regionCode: 'IN',
      sessionToken,
    }),
  });
  const payload = await parseGoogleResponse<AutocompleteResponse>(response);

  return (payload.suggestions ?? []).flatMap(({ placePrediction }) => {
    const placeId = placePrediction?.placeId;
    const fullText = placePrediction?.text?.text;

    if (!placeId || !fullText) {
      return [];
    }

    return [
      {
        placeId,
        fullText,
        primaryText:
          placePrediction.structuredFormat?.mainText?.text ?? fullText,
        secondaryText:
          placePrediction.structuredFormat?.secondaryText?.text ?? '',
      },
    ];
  });
}

export function getCitySuggestions(
  input: string,
  sessionToken: string,
  signal?: AbortSignal,
) {
  return getPlaceSuggestions(input, sessionToken, signal, true);
}

export async function getPlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<SelectedPlace> {
  const response = await fetch(
    `${placesApiBaseUrl}/places/${encodeURIComponent(
      placeId,
    )}?sessionToken=${encodeURIComponent(sessionToken)}`,
    {
      headers: {
        'X-Goog-Api-Key': requireApiKey(),
        'X-Goog-FieldMask':
          'id,displayName,formattedAddress,location,addressComponents',
      },
    },
  );
  const place = await parseGoogleResponse<PlaceDetailsResponse>(response);
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;

  if (latitude === undefined || longitude === undefined) {
    throw new Error('The selected place does not include map coordinates.');
  }

  return {
    placeId: place.id ?? placeId,
    label:
      place.displayName?.text ?? place.formattedAddress ?? 'Selected place',
    address: place.formattedAddress ?? place.displayName?.text ?? '',
    latitude,
    longitude,
    city: place.addressComponents?.find(component =>
      component.types?.some(type =>
        ['locality', 'postal_town', 'administrative_area_level_3'].includes(
          type,
        ),
      ),
    )?.longText,
    state: place.addressComponents?.find(component =>
      component.types?.includes('administrative_area_level_1'),
    )?.longText,
    pincode: place.addressComponents?.find(component =>
      component.types?.includes('postal_code'),
    )?.longText,
  };
}
