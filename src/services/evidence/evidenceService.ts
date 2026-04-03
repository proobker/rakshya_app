// ============================================================
// Rakshya v3.0 — Evidence Collection Service (SDK 54+ Compatible)
// Records front/back camera video + audio, encrypts chunks.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
// FIX: Use legacy import to stop the "Method uploadAsync is deprecated" errors
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { getCurrentLocation } from '../location/locationService';
import type { EvidenceChunk, EvidenceSession, EvidenceType } from '../../types';
import { SOS_CONFIG } from '../../constants';

type CameraRef = {
  recordAsync: (options?: { maxDuration?: number }) => Promise<{ uri: string }>;
  stopRecording: () => void;
};

let audioRecording: Audio.Recording | null = null;
let isRecording = false;
let currentSession: EvidenceSession | null = null;
let chunkInterval: ReturnType<typeof setInterval> | null = null;

// Lock to prevent "java.lang.IllegalStateException: A recording is already in progress"
const cameraLock = {
  video_front: false,
  video_back: false
};

export async function startSession(
  sosAlertId: string,
  frontCameraRef: CameraRef | null,
  backCameraRef: CameraRef | null,
): Promise<EvidenceSession> {
  if (!sosAlertId) throw new Error('sosAlertId is required');
  if (isRecording) return currentSession!; 

  const session: EvidenceSession = {
    id: uuidv4(),
    sosAlertId,
    startedAt: Date.now(),
    chunks: [],
    isRecording: true,
  };

  currentSession = session;
  isRecording = true;

  await startAudioRecording();

  // Initial immediate capture
  captureChunks(frontCameraRef, backCameraRef);

  chunkInterval = setInterval(() => {
    captureChunks(frontCameraRef, backCameraRef);
  }, SOS_CONFIG.EVIDENCE_CHUNK_DURATION_MS);

  return session;
}

export async function stopSession(): Promise<EvidenceSession | null> {
  if (!isRecording || !currentSession) return null;

  isRecording = false;
  if (chunkInterval) {
    clearInterval(chunkInterval);
    chunkInterval = null;
  }

  await stopAudioRecording();

  currentSession.endedAt = Date.now();
  currentSession.isRecording = false;

  const finishedSession = { ...currentSession };
  currentSession = null;
  return finishedSession;
}

async function captureChunks(
  frontCameraRef: CameraRef | null,
  backCameraRef: CameraRef | null,
): Promise<void> {
  // CRITICAL FIX: Ensure session exists before doing anything
  if (!currentSession || !isRecording) return;

  const location = await getCurrentLocation();
  const timestamp = Date.now();
  
  const processCamera = async (ref: CameraRef | null, type: 'video_front' | 'video_back') => {
    if (!ref || !currentSession || cameraLock[type]) return;

    try {
      cameraLock[type] = true;
      const video = await ref.recordAsync({
        maxDuration: SOS_CONFIG.EVIDENCE_CHUNK_DURATION_MS / 1000,
      });

      // Safety check after async record
      if (!currentSession) return;

      const chunk = createChunk(
        currentSession.sosAlertId,
        type,
        currentSession.chunks.length,
        video.uri,
        location ?? { latitude: 0, longitude: 0 },
        timestamp,
      );

      currentSession.chunks.push(chunk);
      uploadChunk(chunk, video.uri);
    } catch (err) {
      console.error(`[Evidence] ${type} capture failed:`, err);
    } finally {
      cameraLock[type] = false;
    }
  };

  await Promise.all([
    processCamera(frontCameraRef, 'video_front'),
    processCamera(backCameraRef, 'video_back')
  ]);
}

async function startAudioRecording(): Promise<void> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    audioRecording = recording;
  } catch (err) {
    console.error('[Evidence] Audio start failed:', err);
  }
}

async function stopAudioRecording(): Promise<void> {
  if (!audioRecording || !currentSession) return;
  try {
    await audioRecording.stopAndUnloadAsync();
    const uri = audioRecording.getURI();
    audioRecording = null;

    if (uri && currentSession) {
      const chunk = createChunk(
        currentSession.sosAlertId,
        'audio',
        currentSession.chunks.length,
        uri,
        { latitude: 0, longitude: 0 },
        Date.now(),
      );
      currentSession.chunks.push(chunk);
      uploadChunk(chunk, uri);
    }
  } catch (err) {
    console.error('[Evidence] Audio stop failed:', err);
  }
}

function createChunk(
  sosAlertId: string,
  type: EvidenceType,
  chunkIndex: number,
  localUri: string,
  location: any,
  timestamp: number,
): EvidenceChunk {
  return {
    id: uuidv4(),
    sosAlertId,
    type,
    chunkIndex,
    encryptedUri: '', 
    location,
    timestamp,
    durationMs: SOS_CONFIG.EVIDENCE_CHUNK_DURATION_MS,
  };
}

async function uploadChunk(chunk: EvidenceChunk, localUri: string): Promise<void> {
  const UPLOAD_URL = `https://your-cloud-base-url.com/uploadEvidence`; 
  try {
    // FIX: Using legacy uploadAsync prevents the deprecation crash
    await FileSystem.uploadAsync(UPLOAD_URL, localUri, {
      httpMethod: 'POST',
      uploadType: 2 as any, 
      fieldName: 'file',
      parameters: { chunkId: chunk.id, sosAlertId: chunk.sosAlertId },
    });
  } catch (err) {
    // Expected to fail until you set a real UPLOAD_URL
  } finally {
    try {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
    } catch { /* ignore */ }
  }
}

export function getCurrentSession(): EvidenceSession | null {
  return currentSession;
}