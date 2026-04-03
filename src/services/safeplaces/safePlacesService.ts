// ============================================================
// Rakshya v3.0 — Safe Places Finder Service
// Finds nearby hospitals, police stations, and fire stations
// using OpenStreetMap Overpass API (no API key required).
// ============================================================

import { getCurrentLocation } from '../location/locationService';
import { SAFE_PLACES_CONFIG } from '../../constants';
import type { SafePlace, SafePlaceType } from '../../types';
import { distanceBetween } from '../location/locationService';
import { Linking } from 'react-native';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

/**
 * OSM amenity tags that correspond to our safe place types.
 */
const OSM_AMENITY_MAP: Record<SafePlaceType, string> = {
  hospital: 'hospital',
  police: 'police',
  fire_station: 'fire_station',
};

/**
 * Search for nearby safe places of a given type using OpenStreetMap Overpass API.
 */
export async function findNearbyPlaces(
  type: SafePlaceType,
  radiusMeters: number = SAFE_PLACES_CONFIG.SEARCH_RADIUS_METERS,
): Promise<SafePlace[]> {
  const location = await getCurrentLocation();
  const amenity = OSM_AMENITY_MAP[type];

  // Overpass QL query: find nodes and ways with the given amenity tag
  // within a radius of the user's current location
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="${amenity}"](around:${radiusMeters},${location.latitude},${location.longitude});
      way["amenity"="${amenity}"](around:${radiusMeters},${location.latitude},${location.longitude});
    );
    out center body ${SAFE_PLACES_CONFIG.MAX_RESULTS};
  `.trim();

  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data: OverpassResponse = await response.json();

  if (!data.elements || !Array.isArray(data.elements)) {
    return [];
  }

  const places: SafePlace[] = data.elements
    .map((element) => {
      // Nodes have lat/lon directly; ways use the "center" field
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      if (lat == null || lon == null) return null;

      const tags = element.tags ?? {};
      const placeLocation = { latitude: lat, longitude: lon };

      return {
        id: String(element.id),
        name: tags.name || formatDefaultName(type),
        type,
        address: formatAddress(tags),
        location: {
          ...placeLocation,
          altitude: null,
          accuracy: null,
          heading: null,
          speed: null,
          timestamp: Date.now(),
        },
        distanceMeters: distanceBetween(location, placeLocation),
        phone: tags.phone || tags['contact:phone'] || undefined,
        isOpen: undefined, // OSM doesn't provide real-time open/closed status
      } satisfies SafePlace;
    })
    .filter((p): p is SafePlace => p !== null);

  places.sort((a, b) => a.distanceMeters - b.distanceMeters);

  return places;
}

/**
 * Find all types of safe places nearby.
 */
export async function findAllSafePlaces(): Promise<SafePlace[]> {
  const results = await Promise.allSettled(
    SAFE_PLACES_CONFIG.PLACE_TYPES.map((type) => findNearbyPlaces(type)),
  );

  const allPlaces: SafePlace[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allPlaces.push(...result.value);
    }
  }

  // Sort by distance across all types
  allPlaces.sort((a, b) => a.distanceMeters - b.distanceMeters);

  return allPlaces;
}

/**
 * Open native maps app with directions to a safe place.
 */
export async function navigateToPlace(place: SafePlace): Promise<void> {
  const { latitude, longitude } = place.location;
  const label = encodeURIComponent(place.name);

  // Try Google Maps first, fall back to Apple Maps
  const googleMapsUrl = `google.navigation:q=${latitude},${longitude}&label=${label}`;
  const appleMapsUrl = `maps:?daddr=${latitude},${longitude}&dirflg=d`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  const canOpenGoogle = await Linking.canOpenURL(googleMapsUrl);
  if (canOpenGoogle) {
    await Linking.openURL(googleMapsUrl);
    return;
  }

  const canOpenApple = await Linking.canOpenURL(appleMapsUrl);
  if (canOpenApple) {
    await Linking.openURL(appleMapsUrl);
    return;
  }

  await Linking.openURL(webUrl);
}

/**
 * Build a readable address from OSM tags.
 */
function formatAddress(tags: Record<string, string>): string {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : (tags.name || 'Unknown location');
}

/**
 * Fallback name when the OSM element has no name tag.
 */
function formatDefaultName(type: SafePlaceType): string {
  switch (type) {
    case 'hospital': return 'Hospital';
    case 'police': return 'Police Station';
    case 'fire_station': return 'Fire Station';
  }
}

// --- OpenStreetMap Overpass API response types ---
interface OverpassResponse {
  elements: OverpassElement[];
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}
