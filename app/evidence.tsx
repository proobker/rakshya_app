// ============================================================
// Rakshya v3.0 — Evidence Recording Screen
// Full-screen dual camera + audio recording with cloud upload.
// ============================================================

import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, FontSize, Spacing } from '../src/constants';
import { startSession, stopSession } from '../src/services/evidence/evidenceService';
import { useSOSStore } from '../src/stores/useAppStore';

export default function EvidenceScreen() {
  const router = useRouter();
  const currentAlert = useSOSStore((s) => s.currentAlert);
  const setEvidenceSession = useSOSStore((s) => s.setEvidenceSession);

  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const handleStartRecording = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    setIsRecording(true);
    setElapsedSeconds(0);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const session = await startSession(
        currentAlert?.id ?? 'manual-evidence',
        cameraRef.current as any,
        null, // Back camera ref — would need a second CameraView
      );
      setEvidenceSession(session);
    } catch (err) {
      console.error('[Evidence] Start failed:', err);
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const session = await stopSession();
    if (session) {
      setEvidenceSession(session);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission is required to record evidence.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mode="video"
      >
        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingBanner}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Recording {formatTime(elapsedSeconds)}
            </Text>
          </View>
        )}

        {/* Encrypted indicator */}
        <View style={styles.encryptedBadge}>
          <Text style={styles.encryptedText}>🔐 Encrypted Upload</Text>
        </View>
      </CameraView>

      {/* Controls */}
      <View style={styles.controls}>
        {!isRecording ? (
          <Pressable
            style={styles.startBtn}
            onPress={handleStartRecording}
          >
            <View style={styles.startBtnInner} />
          </Pressable>
        ) : (
          <Pressable
            style={styles.stopBtn}
            onPress={handleStopRecording}
          >
            <View style={styles.stopBtnInner} />
          </Pressable>
        )}

        <Pressable
          style={styles.closeBtn}
          onPress={() => {
            if (isRecording) handleStopRecording();
            router.back();
          }}
        >
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 60,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
    marginRight: 8,
  },
  recordingText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  encryptedBadge: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  encryptedText: {
    color: Colors.white,
    fontSize: FontSize.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: '#000',
  },
  startBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.danger,
  },
  stopBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtnInner: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  closeBtn: {
    position: 'absolute',
    right: Spacing.lg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  // Permission screen
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  permissionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  permissionBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
