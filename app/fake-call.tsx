// ============================================================
// Rakshya v3.0 — Fake Call Screen
// Full-screen fake incoming call UI with answer/decline.
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing } from '../src/constants';
import {
  scheduleFakeCall,
  answerFakeCall,
  endFakeCall,
} from '../src/services/fakecall/fakeCallService';
import { useFakeCallStore } from '../src/stores/useAppStore';

type CallState = 'setup' | 'ringing' | 'answered';

export default function FakeCallScreen() {
  const router = useRouter();
  const config = useFakeCallStore((s) => s.config);
  const setConfig = useFakeCallStore((s) => s.setConfig);
  const [callState, setCallState] = useState<CallState>('setup');
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      endFakeCall();
    };
  }, []);

  const handleScheduleCall = () => {
    scheduleFakeCall(config, () => {
      setCallState('ringing');
    });
  };

  const handleAnswer = async () => {
    setCallState('answered');
    await answerFakeCall(config);

    // Start call timer
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const handleDecline = async () => {
    await endFakeCall();
    router.back();
  };

  const handleEndCall = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await endFakeCall();
    router.back();
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Setup screen
  if (callState === 'setup') {
    return (
      <View style={styles.setupContainer}>
        <Text style={styles.setupTitle}>Fake Call Setup</Text>
        <Text style={styles.setupDesc}>
          Configure and schedule a fake incoming call.
        </Text>

        <View style={styles.setupField}>
          <Text style={styles.fieldLabel}>Caller Name</Text>
          <Pressable
            style={styles.nameOption}
            onPress={() => setConfig({ callerName: 'Mom' })}
          >
            <Text style={[
              styles.nameOptionText,
              config.callerName === 'Mom' && styles.nameOptionActive,
            ]}>Mom</Text>
          </Pressable>
          <Pressable
            style={styles.nameOption}
            onPress={() => setConfig({ callerName: 'Boss' })}
          >
            <Text style={[
              styles.nameOptionText,
              config.callerName === 'Boss' && styles.nameOptionActive,
            ]}>Boss</Text>
          </Pressable>
          <Pressable
            style={styles.nameOption}
            onPress={() => setConfig({ callerName: 'Friend' })}
          >
            <Text style={[
              styles.nameOptionText,
              config.callerName === 'Friend' && styles.nameOptionActive,
            ]}>Friend</Text>
          </Pressable>
        </View>

        <View style={styles.setupField}>
          <Text style={styles.fieldLabel}>Delay</Text>
          <View style={styles.delayOptions}>
            {[0, 10, 30, 60].map((sec) => (
              <Pressable
                key={sec}
                style={[
                  styles.delayBtn,
                  config.delaySeconds === sec && styles.delayBtnActive,
                ]}
                onPress={() => setConfig({ delaySeconds: sec })}
              >
                <Text style={[
                  styles.delayBtnText,
                  config.delaySeconds === sec && styles.delayBtnTextActive,
                ]}>
                  {sec === 0 ? 'Now' : `${sec}s`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.triggerBtn} onPress={handleScheduleCall}>
          <Text style={styles.triggerBtnText}>Schedule Call</Text>
        </Pressable>

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  // Ringing / Answered screen (mimics native call UI)
  return (
    <View style={styles.callContainer}>
      {/* Caller Info */}
      <View style={styles.callerSection}>
        <View style={styles.callerAvatar}>
          <Text style={styles.callerAvatarText}>
            {config.callerName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.callerName}>{config.callerName}</Text>
        <Text style={styles.callStatus}>
          {callState === 'ringing' ? 'Incoming Call...' : formatDuration(callDuration)}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.callActions}>
        {callState === 'ringing' ? (
          <>
            <Pressable style={styles.declineBtn} onPress={handleDecline}>
              <Text style={styles.actionIcon}>✕</Text>
              <Text style={styles.actionLabel}>Decline</Text>
            </Pressable>
            <Pressable style={styles.answerBtn} onPress={handleAnswer}>
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionLabel}>Answer</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.endCallBtn} onPress={handleEndCall}>
            <Text style={styles.actionIcon}>✕</Text>
            <Text style={styles.actionLabel}>End Call</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Setup screen
  setupContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    paddingTop: 80,
  },
  setupTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  setupDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  setupField: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nameOption: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  nameOptionText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  nameOptionActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  delayOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  delayBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  delayBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  delayBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  delayBtnTextActive: {
    color: Colors.white,
  },
  triggerBtn: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  triggerBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  backBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  backBtnText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },

  // Call screen
  callContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  callerSection: {
    alignItems: 'center',
  },
  callerAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  callerAvatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.white,
  },
  callerName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  callStatus: {
    fontSize: FontSize.md,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    paddingHorizontal: Spacing.xl,
  },
  declineBtn: {
    alignItems: 'center',
  },
  answerBtn: {
    alignItems: 'center',
  },
  endCallBtn: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.danger,
    textAlign: 'center',
    lineHeight: 64,
    fontSize: 24,
    color: Colors.white,
    overflow: 'hidden',
  },
  actionLabel: {
    color: Colors.white,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
});
