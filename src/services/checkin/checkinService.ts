// ============================================================
// Rakshya v3.0 — Check-In Service
// Scheduled safe-arrival check-ins with auto-SOS on missed deadline.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { v4 as uuidv4 } from 'uuid';
import { CHECKIN_CONFIG } from '../../constants';
import { getCurrentLocation, distanceBetween } from '../location/locationService';
import type { CheckIn, LocationCoords } from '../../types';

const STORAGE_KEY = 'rakshya_checkins';

let monitorInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Create a new check-in.
 */
export async function createCheckIn(params: {
  destination: string;
  destinationCoords?: LocationCoords;
  expectedArrivalTime: number;
  graceMinutes?: number;
  contactIds: string[];
}): Promise<CheckIn> {
  const checkIn: CheckIn = {
    id: uuidv4(),
    destination: params.destination,
    destinationCoords: params.destinationCoords,
    expectedArrivalTime: params.expectedArrivalTime,
    graceMinutes: params.graceMinutes ?? CHECKIN_CONFIG.DEFAULT_GRACE_MINUTES,
    status: 'active',
    contactIds: params.contactIds,
    createdAt: Date.now(),
  };

  const checkIns = await getCheckIns();
  checkIns.push(checkIn);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));

  // Schedule reminder notification
  await scheduleReminder(checkIn);

  return checkIn;
}

/**
 * Confirm safe arrival (user manually confirms).
 */
export async function confirmArrival(checkInId: string): Promise<void> {
  const checkIns = await getCheckIns();
  const index = checkIns.findIndex((c) => c.id === checkInId);
  if (index === -1) return;

  checkIns[index].status = 'arrived';
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));
}

/**
 * Cancel a check-in.
 */
export async function cancelCheckIn(checkInId: string): Promise<void> {
  const checkIns = await getCheckIns();
  const index = checkIns.findIndex((c) => c.id === checkInId);
  if (index === -1) return;

  checkIns[index].status = 'cancelled';
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));
}

/**
 * Get all check-ins.
 */
export async function getCheckIns(): Promise<CheckIn[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  return JSON.parse(json) as CheckIn[];
}

/**
 * Get active check-ins.
 */
export async function getActiveCheckIns(): Promise<CheckIn[]> {
  const checkIns = await getCheckIns();
  return checkIns.filter((c) => c.status === 'active');
}

/**
 * Start monitoring active check-ins.
 * Checks every 30 seconds whether:
 * - User has arrived at destination (geofence)
 * - Deadline has passed (triggers SOS)
 */
export function startMonitoring(
  onMissedCheckIn: (checkIn: CheckIn) => void,
): void {
  if (monitorInterval) return;

  monitorInterval = setInterval(async () => {
    const active = await getActiveCheckIns();
    const now = Date.now();

    for (const checkIn of active) {
      const deadlineMs =
        checkIn.expectedArrivalTime + checkIn.graceMinutes * 60 * 1000;

      // Check if deadline passed
      if (now > deadlineMs) {
        checkIn.status = 'missed';
        onMissedCheckIn(checkIn);

        // Persist the status change
        const all = await getCheckIns();
        const idx = all.findIndex((c) => c.id === checkIn.id);
        if (idx !== -1) {
          all[idx].status = 'missed';
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        }
        continue;
      }

      // Auto-detect arrival via geofence
      if (checkIn.destinationCoords) {
        try {
          const current = await getCurrentLocation();
          const distance = distanceBetween(current, checkIn.destinationCoords);

          if (distance <= CHECKIN_CONFIG.GEOFENCE_RADIUS_METERS) {
            await confirmArrival(checkIn.id);
          }
        } catch {
          // Location unavailable — skip this cycle
        }
      }
    }
  }, 30_000);
}

/**
 * Stop monitoring check-ins.
 */
export function stopMonitoring(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

/**
 * Schedule a local notification reminder before the deadline.
 */
async function scheduleReminder(checkIn: CheckIn): Promise<void> {
  const reminderTime =
    checkIn.expectedArrivalTime -
    CHECKIN_CONFIG.REMINDER_BEFORE_MINUTES * 60 * 1000;

  const secondsUntilReminder = Math.max(
    0,
    (reminderTime - Date.now()) / 1000,
  );

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rakshya Check-In Reminder',
      body: `Have you arrived at ${checkIn.destination}? Confirm your arrival or your emergency contacts will be notified.`,
      data: { checkInId: checkIn.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(secondsUntilReminder)),
    },
  });
}
