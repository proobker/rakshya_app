// ============================================================
// Rakshya v3.0 — Fake Call Generator Service
// Generates a fake incoming call with configurable caller name,
// ringtone, delay, and pre-recorded voice message.
// ============================================================

import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import type { FakeCallConfig } from '../../types';

let callTimeout: ReturnType<typeof setTimeout> | null = null;
let ringtoneSound: Audio.Sound | null = null;
let voiceSound: Audio.Sound | null = null;
let onCallStartCallback: ((config: FakeCallConfig) => void) | null = null;

// Default ringtone (bundled asset path — replace with actual asset)
const DEFAULT_RINGTONE = require('../../../assets/ringtone.mp3');

/**
 * Schedule a fake call with the given configuration.
 */
export function scheduleFakeCall(
  config: FakeCallConfig,
  onCallStart: (config: FakeCallConfig) => void,
): void {
  cancelFakeCall(); // Clear any existing scheduled call

  onCallStartCallback = onCallStart;

  if (config.delaySeconds <= 0) {
    // Trigger immediately
    triggerCall(config);
    return;
  }

  callTimeout = setTimeout(() => {
    triggerCall(config);
  }, config.delaySeconds * 1000);
}

/**
 * Trigger the fake call — plays ringtone and invokes the callback
 * to show the full-screen call UI.
 */
async function triggerCall(config: FakeCallConfig): Promise<void> {
  // Play ringtone
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      config.ringtoneUri
        ? { uri: config.ringtoneUri }
        : DEFAULT_RINGTONE,
      { isLooping: true, volume: 1.0 },
    );
    ringtoneSound = sound;
    await ringtoneSound.playAsync();
  } catch (err) {
    console.error('[FakeCall] Ringtone playback failed:', err);
  }

  // Send a local notification (works when app is backgrounded)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: config.callerName,
      body: 'Incoming call...',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: { type: 'fake_call' },
    },
    trigger: null, // Immediate
  });

  // Invoke the callback to show the fake call screen
  onCallStartCallback?.(config);
}

/**
 * "Answer" the fake call — stop ringtone, play voice message.
 */
export async function answerFakeCall(
  config: FakeCallConfig,
): Promise<void> {
  // Stop ringtone
  await stopRingtone();

  // Play voice message if provided
  if (config.voiceMessageUri) {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: config.voiceMessageUri },
        { volume: 1.0 },
      );
      voiceSound = sound;
      await voiceSound.playAsync();
    } catch (err) {
      console.error('[FakeCall] Voice message playback failed:', err);
    }
  }
}

/**
 * "Decline" or end the fake call.
 */
export async function endFakeCall(): Promise<void> {
  await stopRingtone();
  await stopVoice();
  onCallStartCallback = null;
}

/**
 * Cancel a scheduled fake call.
 */
export function cancelFakeCall(): void {
  if (callTimeout) {
    clearTimeout(callTimeout);
    callTimeout = null;
  }
  onCallStartCallback = null;
}

/**
 * Stop ringtone playback.
 */
async function stopRingtone(): Promise<void> {
  if (ringtoneSound) {
    try {
      await ringtoneSound.stopAsync();
      await ringtoneSound.unloadAsync();
    } catch {
      // Ignore
    }
    ringtoneSound = null;
  }
}

/**
 * Stop voice message playback.
 */
async function stopVoice(): Promise<void> {
  if (voiceSound) {
    try {
      await voiceSound.stopAsync();
      await voiceSound.unloadAsync();
    } catch {
      // Ignore
    }
    voiceSound = null;
  }
}
