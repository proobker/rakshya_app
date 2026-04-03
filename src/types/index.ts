// ============================================================
// Rakshya v3.0 — Core Type Definitions
// ============================================================

// --- User & Profile ---
export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  medicalNotes?: string;
  avatarUri?: string;
  publicKey: string; // Base64-encoded X25519 public key
  createdAt: number;
}

// --- Emergency Contacts ---
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  publicKey?: string; // For E2E encryption — exchanged during setup
  isPolice?: boolean;
  notifyViaSMS: boolean;
  notifyViaPush: boolean;
}

// --- Location ---
export interface LocationCoords {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

// --- SOS ---
export type SOSStatus = 'idle' | 'triggered' | 'sending' | 'sent' | 'failed';

export interface SOSAlert {
  id: string;
  userId: string;
  profile: Pick<UserProfile, 'fullName' | 'phone' | 'bloodGroup' | 'medicalNotes'>;
  location: LocationCoords;
  timestamp: number;
  triggerMethod: 'button' | 'voice' | 'checkin_timeout';
  status: SOSStatus;
  recipientIds: string[];
}

// --- Evidence ---
export type EvidenceType = 'video_front' | 'video_back' | 'audio';

export interface EvidenceChunk {
  id: string;
  sosAlertId: string;
  type: EvidenceType;
  chunkIndex: number;
  encryptedUri: string; // Cloud storage URI
  location: LocationCoords;
  timestamp: number;
  durationMs: number;
}

export interface EvidenceSession {
  id: string;
  sosAlertId: string;
  startedAt: number;
  endedAt?: number;
  chunks: EvidenceChunk[];
  isRecording: boolean;
}

// --- Check-In ---
export type CheckInStatus = 'active' | 'arrived' | 'missed' | 'cancelled';

export interface CheckIn {
  id: string;
  destination: string;
  destinationCoords?: LocationCoords;
  expectedArrivalTime: number; // Unix timestamp
  graceMinutes: number;
  status: CheckInStatus;
  contactIds: string[];
  createdAt: number;
}

// --- Ride Verification ---
export type RideStatus = 'active' | 'completed' | 'alerted';

export interface RideLog {
  id: string;
  vehiclePlate: string;
  vehicleColor?: string;
  vehicleModel?: string;
  driverName?: string;
  rideService?: string; // e.g. "Uber", "Lyft"
  startLocation: LocationCoords;
  endLocation?: LocationCoords;
  route: LocationCoords[];
  expectedRoute?: LocationCoords[];
  status: RideStatus;
  sharedWithContactIds: string[];
  startedAt: number;
  endedAt?: number;
}

// --- Safe Places ---
export type SafePlaceType = 'hospital' | 'police' | 'fire_station';

export interface SafePlace {
  id: string;
  name: string;
  type: SafePlaceType;
  address: string;
  location: LocationCoords;
  distanceMeters: number;
  phone?: string;
  isOpen?: boolean;
}

// --- Fake Call ---
export interface FakeCallConfig {
  callerName: string;
  callerPhoto?: string;
  ringtoneUri?: string;
  delaySeconds: number;
  voiceMessageUri?: string;
}

// --- Encryption ---
export interface KeyPair {
  publicKey: string; // Base64
  secretKey: string; // Base64 — stored in SecureStore
}

export interface EncryptedPayload {
  nonce: string; // Base64
  ciphertext: string; // Base64
  senderPublicKey: string; // Base64
}

// --- Navigation ---
export type RootTabParamList = {
  index: undefined;
  contacts: undefined;
  safety: undefined;
  profile: undefined;
};
