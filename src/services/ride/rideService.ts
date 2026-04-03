// ============================================================
// Rakshya v3.0 — Ride Verification Service
// Logs vehicle details, tracks GPS route, detects deviations,
// and shares encrypted ride data with emergency contacts.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  getCurrentLocation,
  startForegroundTracking,
  stopForegroundTracking,
  distanceBetween,
} from '../location/locationService';
import { RIDE_CONFIG } from '../../constants';
import type { LocationCoords, RideLog } from '../../types';

const STORAGE_KEY = 'rakshya_ride_logs';

let activeRideId: string | null = null;
let deviationCallback: ((ride: RideLog) => void) | null = null;

/**
 * Start logging a new ride.
 */
export async function startRide(params: {
  vehiclePlate: string;
  vehicleColor?: string;
  vehicleModel?: string;
  driverName?: string;
  rideService?: string;
  sharedWithContactIds: string[];
  onDeviation?: (ride: RideLog) => void;
}): Promise<RideLog> {
  const startLocation = await getCurrentLocation();

  const ride: RideLog = {
    id: uuidv4(),
    vehiclePlate: params.vehiclePlate,
    vehicleColor: params.vehicleColor,
    vehicleModel: params.vehicleModel,
    driverName: params.driverName,
    rideService: params.rideService,
    startLocation,
    route: [startLocation],
    status: 'active',
    sharedWithContactIds: params.sharedWithContactIds,
    startedAt: Date.now(),
  };

  const rides = await getRideLogs();
  rides.push(ride);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rides));

  activeRideId = ride.id;
  deviationCallback = params.onDeviation ?? null;

  // Start continuous GPS tracking
  await startForegroundTracking(async (coords) => {
    await appendRoutePoint(ride.id, coords);
  });

  return ride;
}

/**
 * End the active ride.
 */
export async function endRide(rideId: string): Promise<RideLog | null> {
  const rides = await getRideLogs();
  const index = rides.findIndex((r) => r.id === rideId);
  if (index === -1) return null;

  const endLocation = await getCurrentLocation();
  rides[index].endLocation = endLocation;
  rides[index].status = 'completed';
  rides[index].endedAt = Date.now();

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rides));

  if (activeRideId === rideId) {
    activeRideId = null;
    deviationCallback = null;
    stopForegroundTracking();
  }

  return rides[index];
}

/**
 * Append a GPS point to the ride route.
 */
async function appendRoutePoint(
  rideId: string,
  coords: LocationCoords,
): Promise<void> {
  const rides = await getRideLogs();
  const index = rides.findIndex((r) => r.id === rideId);
  if (index === -1) return;

  rides[index].route.push(coords);

  // Check for route deviation if an expected route exists
  if (rides[index].expectedRoute && rides[index].expectedRoute!.length > 0) {
    const deviation = checkDeviation(coords, rides[index].expectedRoute!);
    if (deviation > RIDE_CONFIG.ROUTE_DEVIATION_THRESHOLD_METERS) {
      rides[index].status = 'alerted';
      deviationCallback?.(rides[index]);
    }
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rides));
}

/**
 * Check how far the current position is from the expected route.
 * Returns the minimum distance in meters to any point on the expected route.
 */
function checkDeviation(
  current: LocationCoords,
  expectedRoute: LocationCoords[],
): number {
  let minDistance = Infinity;
  for (const point of expectedRoute) {
    const dist = distanceBetween(current, point);
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
}

/**
 * Get all ride logs.
 */
export async function getRideLogs(): Promise<RideLog[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  return JSON.parse(json) as RideLog[];
}

/**
 * Get the active ride (if any).
 */
export async function getActiveRide(): Promise<RideLog | null> {
  if (!activeRideId) return null;
  const rides = await getRideLogs();
  return rides.find((r) => r.id === activeRideId) ?? null;
}

/**
 * Share ride details with emergency contacts.
 * Builds a shareable summary with vehicle info and live tracking link.
 */
export function buildRideSummary(ride: RideLog): string {
  const lines = [
    `🚗 Ride Tracking — Rakshya Safety`,
    `Vehicle: ${ride.vehicleModel ?? 'Unknown'} (${ride.vehicleColor ?? 'Unknown'})`,
    `Plate: ${ride.vehiclePlate}`,
    ride.driverName ? `Driver: ${ride.driverName}` : null,
    ride.rideService ? `Service: ${ride.rideService}` : null,
    `Started: ${new Date(ride.startedAt).toLocaleString()}`,
    `From: ${ride.startLocation.latitude.toFixed(6)}, ${ride.startLocation.longitude.toFixed(6)}`,
  ];

  return lines.filter(Boolean).join('\n');
}
