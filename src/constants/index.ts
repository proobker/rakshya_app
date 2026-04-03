// ============================================================
// Rakshya v3.0 — App Constants
// ============================================================

export const APP_NAME = 'Rakshya';

// --- Colors (Safety-oriented palette) ---
export const Colors = {
  // Primary
  primary: '#E63946', // Emergency red
  primaryDark: '#B71C1C',
  primaryLight: '#FF6B6B',

  // Secondary
  secondary: '#1D3557', // Trust blue
  secondaryLight: '#457B9D',

  // Accent
  accent: '#F4A261', // Warning orange
  accentLight: '#FFD166',

  // Status
  success: '#2A9D8F',
  warning: '#F4A261',
  danger: '#E63946',
  info: '#457B9D',

  // Neutrals
  white: '#FFFFFF',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  disabled: '#D1D5DB',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  sosOverlay: 'rgba(230, 57, 70, 0.9)',
} as const;

// --- Spacing ---
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// --- Font Sizes ---
export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  hero: 48,
} as const;

// --- SOS Config ---
export const SOS_CONFIG = {
  VOICE_TRIGGER_PHRASE: 'dogs went swimming',
  VOICE_FUZZY_THRESHOLD: 0.75, // Levenshtein similarity threshold
  EVIDENCE_CHUNK_DURATION_MS: 5000, // 5-second recording chunks
  LOCATION_UPDATE_INTERVAL_MS: 3000,
  LOCATION_DISTANCE_FILTER_METERS: 5,
  SOS_COUNTDOWN_SECONDS: 3, // Brief countdown before SOS dispatch
} as const;

// --- Check-In Config ---
export const CHECKIN_CONFIG = {
  DEFAULT_GRACE_MINUTES: 15,
  REMINDER_BEFORE_MINUTES: 5,
  MAX_GRACE_MINUTES: 60,
  GEOFENCE_RADIUS_METERS: 200,
} as const;

// --- Ride Config ---
export const RIDE_CONFIG = {
  ROUTE_DEVIATION_THRESHOLD_METERS: 500,
  GPS_LOG_INTERVAL_MS: 10000,
} as const;

// --- Safe Places Config ---
export const SAFE_PLACES_CONFIG = {
  SEARCH_RADIUS_METERS: 5000,
  MAX_RESULTS: 20,
  PLACE_TYPES: ['hospital', 'police', 'fire_station'] as const,
} as const;

// --- Encryption Config ---
export const ENCRYPTION_CONFIG = {
  SECURE_STORE_PRIVATE_KEY: 'rakshya_private_key',
  SECURE_STORE_PUBLIC_KEY: 'rakshya_public_key',
} as const;

// --- Firebase Config (placeholder — replace with real values) ---
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAcJHw7eyC7XSHBjB0vGkQTXcJECY7qJME',
  authDomain: 'rakshya-c5a24.firebaseapp.com',
  projectId: 'rakshya-c5a24',
  storageBucket: 'rakshya-c5a24.firebasestorage.app',
  messagingSenderId: '332793532725',
  appId: '1:332793532725:android:c3f7826c78b2cb60bf7c7c',
} as const;

// Google Places API key removed — using OpenStreetMap Overpass API instead (no key needed)

// --- Background Task Names ---
export const TASK_NAMES = {
  BACKGROUND_LOCATION: 'rakshya-background-location',
  VOICE_RECOGNITION: 'rakshya-voice-recognition',
  EVIDENCE_UPLOAD: 'rakshya-evidence-upload',
  CHECKIN_MONITOR: 'rakshya-checkin-monitor',
} as const;
