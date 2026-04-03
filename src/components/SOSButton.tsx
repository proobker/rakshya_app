// ============================================================
// Rakshya v3.0 — SOS Button Component
// Large, prominent emergency button with pulsing animation.
// ============================================================

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, FontSize, Spacing } from '../constants';

interface SOSButtonProps {
  onPress: () => void;
  isActive: boolean;
  countdownSeconds?: number;
  disabled?: boolean;
}

export default function SOSButton({
  onPress,
  isActive,
  countdownSeconds,
  disabled,
}: SOSButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      // Pulsing animation when SOS is active
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Outer pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: isActive ? 0.3 : 0,
          },
        ]}
      />

      {/* Main button */}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          isActive && styles.buttonActive,
          pressed && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
      >
        {countdownSeconds !== undefined && countdownSeconds > 0 ? (
          <Text style={styles.countdownText}>{countdownSeconds}</Text>
        ) : (
          <>
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.subText}>
              {isActive ? 'TAP TO CANCEL' : 'TAP FOR HELP'}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const BUTTON_SIZE = 200;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: BUTTON_SIZE + 40,
    width: BUTTON_SIZE + 40,
  },
  pulseRing: {
    position: 'absolute',
    width: BUTTON_SIZE + 40,
    height: BUTTON_SIZE + 40,
    borderRadius: (BUTTON_SIZE + 40) / 2,
    backgroundColor: Colors.primary,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  buttonActive: {
    backgroundColor: Colors.primaryDark,
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  sosText: {
    fontSize: FontSize.hero,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 4,
  },
  subText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
    opacity: 0.8,
    marginTop: Spacing.xs,
    letterSpacing: 1,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: '900',
    color: Colors.white,
  },
});
