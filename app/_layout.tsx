// ============================================================
// Rakshya v3.0 — Root Layout
// Initializes encryption keys, background tasks, and voice listener.
// ============================================================
import 'react-native-get-random-values'; 
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';
import { TASK_NAMES } from '../src/constants';
import { getOrCreateKeyPair } from '../src/services/encryption/encryptionService';
import {
  requestPermissions as requestLocationPermissions,
} from '../src/services/location/locationService';
import { startListening, stopListening } from '../src/services/voice/voiceService';
import { triggerSOS } from '../src/services/sos/sosService';
import { getSOSRecipients } from '../src/services/contacts/contactsService';
import {
  useProfileStore,
  useSOSStore,
  useSettingsStore,
} from '../src/stores/useAppStore';


// Register background location task at module scope (required by expo-task-manager)
TaskManager.defineTask(TASK_NAMES.BACKGROUND_LOCATION, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocation] Error:', error);
    return;
  }
  if (data) {
    // Location updates received in background — these are persisted
    // by the SOS system when an alert is active
    const { locations } = data as { locations: Array<{ coords: object; timestamp: number }> };
    console.log('[BackgroundLocation] Received:', locations?.length, 'updates');
  }
});

export default function RootLayout() {
  const profile = useProfileStore((s) => s.profile);
  const setVoiceListening = useSOSStore((s) => s.setVoiceListening);
  const voiceActivationEnabled = useSettingsStore((s) => s.voiceActivationEnabled);

  // Initialize app on mount
  useEffect(() => {
    async function init() {
      // Generate/load encryption keys
      await getOrCreateKeyPair();

      // Request location permissions
      await requestLocationPermissions();
    }

    init().catch(console.error);
  }, []);

  // Start/stop voice recognition based on settings
  useEffect(() => {
    if (voiceActivationEnabled && profile) {
      const handleVoiceTrigger = async () => {
        const contacts = await getSOSRecipients();
        if (profile && contacts.length > 0) {
          await triggerSOS(profile, contacts, 'voice');
        }
      };

      startListening(handleVoiceTrigger)
        .then(() => setVoiceListening(true))
        .catch(console.error);

      return () => {
        stopListening()
          .then(() => setVoiceListening(false))
          .catch(console.error);
      };
    }
  }, [voiceActivationEnabled, profile, setVoiceListening]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F8F9FA' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="evidence"
          options={{
            presentation: 'fullScreenModal',
            headerShown: true,
            headerTitle: 'Evidence Recording',
          }}
        />
        <Stack.Screen
          name="fake-call"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="legal-help"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Legal Help',
          }}
        />
      </Stack>
    </>
  );
}
