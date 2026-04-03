// ============================================================
// Rakshya v3.0 — Location Service
// Background + foreground GPS tracking using expo-location.
// ============================================================

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { SOS_CONFIG, TASK_NAMES } from '../../constants';
import type { LocationCoords } from '../../types';

let locationSubscription: Location.LocationSubscription | null = null;
let locationCallbacks: Array<(coords: LocationCoords) => void> = [];

/**
 * Request foreground + background location permissions.
 * Returns true if both are granted.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: fgStatus } =
    await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') return false;

  const { status: bgStatus } =
    await Location.requestBackgroundPermissionsAsync();
  return bgStatus === 'granted';
}

/**
 * Get current location once.
 */
export async function getCurrentLocation(): Promise<LocationCoords> {
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    altitude: loc.coords.altitude,
    accuracy: loc.coords.accuracy,
    heading: loc.coords.heading,
    speed: loc.coords.speed,
    timestamp: loc.timestamp,
  };
}

/**
 * Start foreground location tracking with live callbacks.
 */
export async function startForegroundTracking(
  onLocation: (coords: LocationCoords) => void,
): Promise<void> {
  locationCallbacks.push(onLocation);

  if (locationSubscription) return; // Already tracking

  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: SOS_CONFIG.LOCATION_UPDATE_INTERVAL_MS,
      distanceInterval: SOS_CONFIG.LOCATION_DISTANCE_FILTER_METERS,
    },
    (loc) => {
      const coords: LocationCoords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude,
        accuracy: loc.coords.accuracy,
        heading: loc.coords.heading,
        speed: loc.coords.speed,
        timestamp: loc.timestamp,
      };
      locationCallbacks.forEach((cb) => cb(coords));
    },
  );
}

/**
 * Stop foreground tracking.
 */
export function stopForegroundTracking(): void {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
  locationCallbacks = [];
}

/**
 * Start background location tracking (works when app is backgrounded/screen locked).
 * Must be called after permissions are granted.
 */
export async function startBackgroundTracking(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    TASK_NAMES.BACKGROUND_LOCATION,
  );
  if (isRegistered) return;

  await Location.startLocationUpdatesAsync(TASK_NAMES.BACKGROUND_LOCATION, {
    accuracy: Location.Accuracy.High,
    timeInterval: SOS_CONFIG.LOCATION_UPDATE_INTERVAL_MS,
    distanceInterval: SOS_CONFIG.LOCATION_DISTANCE_FILTER_METERS,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Rakshya is active',
      notificationBody: 'Location tracking is enabled for your safety.',
      notificationColor: '#E63946',
    },
  });
}

/**
 * Stop background location tracking.
 */
export async function stopBackgroundTracking(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    TASK_NAMES.BACKGROUND_LOCATION,
  );
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(TASK_NAMES.BACKGROUND_LOCATION);
  }
}

/**
 * Calculate distance between two coordinates in meters (Haversine).
 */
export function distanceBetween(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
