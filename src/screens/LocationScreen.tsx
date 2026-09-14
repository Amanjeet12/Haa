import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LocateFixed from 'lucide-react-native/icons/locate-fixed';
import MapPin from 'lucide-react-native/icons/map-pin';
import Search from 'lucide-react-native/icons/search';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { AppButton, AppText, AuthScaffold, HaaLogo } from '../components';
import { getCurrentLocation } from '../services/location';
import {
  createPlacesSessionToken,
  getPlaceDetails,
  getPlaceSuggestions,
  PlaceSuggestion,
  SelectedPlace,
} from '../services/places';
import { useAppTheme } from '../theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Location'>;

const initialRegion = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 24,
  longitudeDelta: 24,
};

const selectedRegionDelta = {
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

export function LocationScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const mapRef = useRef<MapView>(null);
  const sessionTokenRef = useRef(createPlacesSessionToken());
  const suppressAutocompleteRef = useRef(false);
  const [query, setQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null,
  );
  const [showsUserLocation, setShowsUserLocation] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchText = query.trim();

    if (suppressAutocompleteRef.current) {
      suppressAutocompleteRef.current = false;
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (!isSearchFocused || searchText.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setIsSearching(true);

      try {
        const nextSuggestions = await getPlaceSuggestions(
          searchText,
          sessionTokenRef.current,
          controller.signal,
        );
        setSuggestions(nextSuggestions.slice(0, 5));
        setError('');
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setError('Location search is unavailable. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [isSearchFocused, query]);

  const showPlaceOnMap = (place: SelectedPlace) => {
    setSelectedPlace(place);
    mapRef.current?.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        ...selectedRegionDelta,
      },
      500,
    );
  };

  const continueWithSearch = () => {
    if (selectedPlace) {
      navigation.navigate('Login');
    } else {
      if (query.trim()) {
        setError('Select a location from the suggestions first.');
      }
      inputRef.current?.focus();
    }
  };

  const updateQuery = (value: string) => {
    suppressAutocompleteRef.current = false;
    setQuery(value);
    setSelectedPlace(null);
    setError('');
  };

  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    suppressAutocompleteRef.current = true;
    inputRef.current?.blur();
    Keyboard.dismiss();
    setIsSearchFocused(false);
    setSuggestions([]);
    setIsSearching(true);
    setQuery(suggestion.fullText);
    setError('');

    try {
      const place = await getPlaceDetails(
        suggestion.placeId,
        sessionTokenRef.current,
      );
      showPlaceOnMap(place);
      sessionTokenRef.current = createPlacesSessionToken();
    } catch {
      setError('We could not load that location. Please choose another one.');
    } finally {
      setIsSearching(false);
    }
  };

  const useCurrentLocation = async () => {
    setError('');
    setIsLocating(true);

    try {
      const position = await getCurrentLocation();
      const place: SelectedPlace = {
        placeId: 'current-location',
        label: 'Current location',
        address: 'Your current device location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      Keyboard.dismiss();
      suppressAutocompleteRef.current = true;
      inputRef.current?.blur();
      setIsSearchFocused(false);
      setSuggestions([]);
      setQuery(place.label);
      setShowsUserLocation(true);
      showPlaceOnMap(place);
    } catch {
      setError('We could not access your location. Enter it manually instead.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <AuthScaffold contentContainerStyle={styles.content}>
      <HaaLogo />

      <View style={styles.headingBlock}>
        <AppText
          variant="caption"
          weight="800"
          color={theme.colors.primary}
          style={styles.eyebrow}
        >
          — YOUR LOCATION SHAPES YOUR CARE
        </AppText>
        <AppText variant="title" weight="800" style={styles.title}>
          Where should we{' '}
          <AppText variant="title" weight="800" color={theme.colors.primary}>
            serve you?
          </AppText>
        </AppText>
        <AppText variant="caption" color={theme.colors.textMuted}>
          Labs and nearby delivery depend on your zone. The Global Store is
          available across India.
        </AppText>
      </View>

      <View style={styles.searchArea}>
        <View
          style={[
            styles.search,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <Search color={theme.colors.textMuted} size={19} />
          <TextInput
            ref={inputRef}
            accessibilityLabel="Search location"
            autoCorrect={false}
            onBlur={() => setIsSearchFocused(false)}
            onChangeText={updateQuery}
            onFocus={() => setIsSearchFocused(true)}
            onSubmitEditing={continueWithSearch}
            placeholder="Search area, landmark or PIN code"
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="go"
            style={[
              styles.searchInput,
              {
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily.regular,
              },
            ]}
            value={query}
          />
          {isSearching ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : null}
        </View>

        {isSearchFocused && suggestions.length ? (
          <View
            style={[
              styles.suggestions,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            {suggestions.map((suggestion, index) => (
              <Pressable
                accessibilityRole="button"
                key={suggestion.placeId}
                onPress={() => selectSuggestion(suggestion)}
                style={({ pressed }) => [
                  styles.suggestion,
                  index < suggestions.length - 1 && {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                  pressed && { backgroundColor: theme.colors.surfaceMuted },
                ]}
              >
                <View
                  style={[
                    styles.suggestionIcon,
                    { backgroundColor: theme.colors.primarySoft },
                  ]}
                >
                  <MapPin color={theme.colors.primary} size={16} />
                </View>
                <View style={styles.suggestionCopy}>
                  <AppText weight="600" style={styles.suggestionTitle}>
                    {suggestion.primaryText}
                  </AppText>
                  {suggestion.secondaryText ? (
                    <AppText
                      variant="caption"
                      color={theme.colors.textMuted}
                      numberOfLines={1}
                      style={styles.suggestionSubtitle}
                    >
                      {suggestion.secondaryText}
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.map,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}
      >
        <MapView
          ref={mapRef}
          initialRegion={initialRegion}
          loadingEnabled
          mapType="standard"
          pitchEnabled={false}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          rotateEnabled={false}
          showsCompass={false}
          showsMyLocationButton={false}
          showsUserLocation={showsUserLocation}
          style={StyleSheet.absoluteFill}
        >
          {selectedPlace ? (
            <Marker
              coordinate={{
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
              }}
              description={selectedPlace.address}
              pinColor={theme.colors.primary}
              title={selectedPlace.label}
            />
          ) : null}
        </MapView>
      </View>

      {error ? (
        <AppText
          accessibilityRole="alert"
          variant="caption"
          color={theme.colors.danger}
          style={styles.error}
        >
          {error}
        </AppText>
      ) : null}

      <View style={styles.spacer} />

      <View style={styles.actions}>
        <AppButton
          fullWidth
          icon={<LocateFixed color={theme.colors.onPrimary} size={17} />}
          label="Use current location"
          loading={isLocating}
          onPress={useCurrentLocation}
        />
        <AppButton
          fullWidth
          label={
            selectedPlace
              ? 'Continue with this location'
              : 'Enter location manually'
          }
          onPress={continueWithSearch}
          variant="secondary"
        />
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 10,
  },
  headingBlock: {
    marginTop: 22,
    gap: 6,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 29,
    lineHeight: 31,
    letterSpacing: -1.2,
  },
  searchArea: {
    zIndex: 10,
    marginTop: 24,
  },
  search: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 15,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  suggestions: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  suggestion: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  suggestionCopy: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  map: {
    height: 190,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
    marginTop: 16,
  },
  error: {
    marginTop: 10,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 28,
  },
  actions: {
    gap: 10,
  },
});
