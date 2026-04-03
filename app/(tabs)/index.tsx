// ============================================================
// Rakshya v3.0 — Home / SOS Screen
// Main screen with the SOS button, voice status, and quick actions.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import SOSButton from '../../src/components/SOSButton';
import SafetyCard from '../../src/components/SafetyCard';
import { Colors, FontSize, Spacing, SOS_CONFIG } from '../../src/constants';
import { triggerSOS, cancelSOS } from '../../src/services/sos/sosService';
import { getSOSRecipients } from '../../src/services/contacts/contactsService';
import { startSession as startEvidence } from '../../src/services/evidence/evidenceService';
import { startBackgroundTracking } from '../../src/services/location/locationService';
import {
  useProfileStore,
  useSOSStore,
  useSettingsStore,
} from '../../src/stores/useAppStore';

export default function HomeScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const sosStatus = useSOSStore((s) => s.status);
  const currentAlert = useSOSStore((s) => s.currentAlert);
  const setStatus = useSOSStore((s) => s.setStatus);
  const setCurrentAlert = useSOSStore((s) => s.setCurrentAlert);
  const isVoiceListening = useSOSStore((s) => s.isVoiceListening);
  const autoEvidence = useSettingsStore((s) => s.autoEvidenceOnSOS);

  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleSOSPress = useCallback(async () => {
    // If SOS is active, cancel it
    if (sosStatus !== 'idle') {
      if (currentAlert) {
        await cancelSOS(currentAlert.id);
      }
      setStatus('idle');
      setCurrentAlert(null);
      setCountdown(0);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    // Check prerequisites
    if (!profile) {
      Alert.alert(
        'Profile Required',
        'Please set up your profile before using SOS.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/profile') }],
      );
      return;
    }

    const contacts = await getSOSRecipients();
    if (contacts.length === 0) {
      Alert.alert(
        'No Emergency Contacts',
        'Please add at least one emergency contact.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/contacts') }],
      );
      return;
    }

    // Start countdown
    setStatus('triggered');
    setCountdown(SOS_CONFIG.SOS_COUNTDOWN_SECONDS);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          // Execute SOS
          executeSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [sosStatus, profile, currentAlert, setStatus, setCurrentAlert, router, autoEvidence]);

  const executeSOS = async () => {
    try {
      const contacts = await getSOSRecipients();
      const alert = await triggerSOS(profile!, contacts, 'button');
      setCurrentAlert(alert);
      setStatus('sent');

      // Start background location tracking
      await startBackgroundTracking();

      // Auto-start evidence recording if enabled
      if (autoEvidence) {
        router.push('/evidence');
      }
    } catch (err) {
      console.error('[SOS] Failed:', err);
      setStatus('failed');
      Alert.alert('SOS Failed', 'Please try again or call emergency services directly.');
    }
  };

  const isActive = sosStatus !== 'idle';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Voice status indicator */}
        <View style={styles.statusBar}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isVoiceListening ? Colors.success : Colors.disabled },
            ]}
          />
          <Text style={styles.statusText}>
            {isVoiceListening
              ? 'Voice detection active'
              : 'Voice detection off'}
          </Text>
        </View>

        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <SOSButton
            onPress={handleSOSPress}
            isActive={isActive}
            countdownSeconds={countdown > 0 ? countdown : undefined}
          />
          {isActive && (
            <Text style={styles.activeText}>
              {sosStatus === 'triggered' && 'Sending SOS...'}
              {sosStatus === 'sending' && 'Alerting contacts...'}
              {sosStatus === 'sent' && 'SOS sent! Help is on the way.'}
              {sosStatus === 'failed' && 'SOS failed — tap to retry'}
            </Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <SafetyCard
            icon="📹"
            title="Record Evidence"
            description="Start recording video and audio evidence"
            onPress={() => router.push('/evidence')}
            color={Colors.danger}
          />
          <SafetyCard
            icon="📱"
            title="Fake Call"
            description="Generate a fake incoming call to escape a situation"
            onPress={() => router.push('/fake-call')}
            color={Colors.info}
          />
          <SafetyCard
            icon="⚖️"
            title="Legal Help"
            description="Find legal aid and know your rights"
            onPress={() => router.push('/legal-help')}
            color={Colors.secondary}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  sosContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  activeText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  quickActions: {
    width: '100%',
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
});
