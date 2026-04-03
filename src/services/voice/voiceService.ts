// ============================================================
// Rakshya v3.0 — Voice Command Service
// Continuous speech recognition with fuzzy matching.
// ============================================================

import { PermissionsAndroid, Platform } from 'react-native';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { SOS_CONFIG } from '../../constants';

type VoiceTriggerCallback = () => void;

let isListening = false;
let onTriggerCallback: VoiceTriggerCallback | null = null;
let restartTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Levenshtein distance for fuzzy matching.
 */
function levenshtein(a: string, b: string): number {
  const tmpA = a.toLowerCase();
  const tmpB = b.toLowerCase();
  const matrix: number[][] = [];
  for (let i = 0; i <= tmpB.length; i++) matrix[i] = [i];
  for (let j = 0; j <= tmpA.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= tmpB.length; i++) {
    for (let j = 1; j <= tmpA.length; j++) {
      const cost = tmpB[i - 1] === tmpA[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[tmpB.length][tmpA.length];
}

/**
 * Check if recognized speech matches the trigger phrase using fuzzy matching.
 */
function matchesTrigger(transcript: string): boolean {
  const normalized = transcript.toLowerCase().trim();
  const trigger = SOS_CONFIG.VOICE_TRIGGER_PHRASE.toLowerCase();

  if (normalized.includes(trigger)) return true;

  const triggerWords = trigger.split(' ');
  const spokenWords = normalized.split(/\s+/);

  for (let i = 0; i <= spokenWords.length - triggerWords.length; i++) {
    const window = spokenWords.slice(i, i + triggerWords.length).join(' ');
    const maxLen = Math.max(window.length, trigger.length);
    if (maxLen === 0) continue;
    
    const distance = levenshtein(window, trigger);
    const similarity = 1 - distance / maxLen;

    if (similarity >= SOS_CONFIG.VOICE_FUZZY_THRESHOLD) {
      return true;
    }
  }

  return false;
}

/**
 * Request Microphone Permissions (Android Specific)
 */
async function requestPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'Rakshya needs microphone access for voice triggers.',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    return false;
  }
}

/**
 * Handle speech recognition results.
 */
function onSpeechResults(event: SpeechResultsEvent): void {
  const results = event.value;
  if (!results) return;

  for (const transcript of results) {
    if (transcript && matchesTrigger(transcript)) {
      console.log('[Voice] Trigger phrase detected!');
      onTriggerCallback?.();
      return;
    }
  }
}

/**
 * Handle speech recognition errors — auto-restart.
 */
function onSpeechError(event: SpeechErrorEvent): void {
  console.log('[Voice] Error Code:', event.error?.code);
  if (isListening) {
    if (restartTimeout) clearTimeout(restartTimeout);
    restartTimeout = setTimeout(() => {
      restartListening();
    }, 2000); // Slightly longer delay to allow native side to reset
  }
}

/**
 * Handle speech recognition end.
 */
function onSpeechEnd(): void {
  if (isListening) {
    if (restartTimeout) clearTimeout(restartTimeout);
    restartTimeout = setTimeout(() => {
      restartListening();
    }, 1000);
  }
}

/**
 * Restart the voice recognition session.
 */
async function restartListening(): Promise<void> {
  if (!isListening) return;
  try {
    // Check if Voice module is available before calling start
    if (Voice && typeof Voice.start === 'function') {
        await Voice.start('en-US');
    }
  } catch (err) {
    console.error('[Voice] Restart failed:', err);
  }
}

/**
 * Start continuous voice recognition.
 */
export async function startListening(
  onTrigger: VoiceTriggerCallback,
): Promise<void> {
  if (isListening) return;

  // 1. Ensure permissions are granted
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    console.error('[Voice] Permission denied');
    return;
  }

  // 2. Safety Check: Is the native module loaded?
  if (!Voice) {
    console.error('[Voice] Native module is null. Check linking.');
    return;
  }

  onTriggerCallback = onTrigger;
  isListening = true;

  // 3. Set up listeners
  Voice.onSpeechResults = onSpeechResults;
  Voice.onSpeechError = onSpeechError;
  Voice.onSpeechEnd = onSpeechEnd;

  try {
    await Voice.start('en-US');
    console.log('[Voice] Listening started...');
  } catch (err) {
    console.error('[Voice] Failed to start:', err);
    isListening = false;
  }
}

/**
 * Stop voice recognition.
 */
export async function stopListening(): Promise<void> {
  isListening = false;
  onTriggerCallback = null;

  if (restartTimeout) {
    clearTimeout(restartTimeout);
    restartTimeout = null;
  }

  try {
    // Using individual null assignments to satisfy TS
    Voice.onSpeechResults = () => {};
    Voice.onSpeechError = () => {};
    Voice.onSpeechEnd = () => {};
    
    await Voice.stop();
    await Voice.destroy();
  } catch (err) {
    // Cleanup errors ignored
  }
}

/**
 * Check availability.
 */
export async function isAvailable(): Promise<boolean> {
  try {
    const services = await Voice.isAvailable();
    return !!services;
  } catch {
    return false;
  }
}