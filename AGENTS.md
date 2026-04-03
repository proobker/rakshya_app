# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Rakshya v3.0 is a personal safety mobile app built with React Native (Expo SDK 55) and TypeScript. It features SOS alerting, evidence collection, voice-activated triggers, fake call generation, scheduled check-ins, ride verification, and nearby safe-place discovery — all protected by end-to-end encryption.

## Build & Run Commands

```bash
# Start the Expo dev server
cmd /c "npm start"

# Run on Android
cmd /c "npm run android"

# Run on iOS (macOS only)
cmd /c "npm run ios"

# Run on web
cmd /c "npm run web"
```

Note: PowerShell execution policy may block npm/npx scripts directly. Use `cmd /c` prefix or `node -e "..."` workaround. Install new dependencies with `--legacy-peer-deps` to avoid React version peer conflicts.

## Architecture

### Entry Point
- `index.ts` → `expo-router/entry` (file-based routing via Expo Router)
- `app/_layout.tsx` — Root layout: initializes encryption keys, location permissions, and voice recognition on mount. Registers the background location task at module scope.

### Navigation (Expo Router file-based)
- `app/(tabs)/` — Bottom tab navigator with 4 tabs:
  - `index.tsx` — Home/SOS screen (SOS button, voice status, quick actions)
  - `contacts.tsx` — Emergency contacts CRUD
  - `safety.tsx` — Safety tools hub (check-in, ride verification, safe places)
  - `profile.tsx` — User profile form and settings toggles
- `app/evidence.tsx` — Full-screen modal for dual camera + audio evidence recording
- `app/fake-call.tsx` — Full-screen modal mimicking a native incoming call
- `app/legal-help.tsx` — Modal with legal aid directory and emergency rights

### Service Layer (`src/services/`)
Each service is a standalone module with no cross-service Zustand dependencies — they operate on data passed as arguments and return results. The UI layer (screens) connects services to stores.

- **`encryption/encryptionService.ts`** — TweetNaCl X25519 key generation, `encrypt()`, `decrypt()`, `encryptBinary()`. Private key stored via `expo-secure-store`.
- **`location/locationService.ts`** — `expo-location` foreground + background GPS tracking, Haversine distance calculation. Background tracking uses `expo-task-manager` with task name `rakshya-background-location`.
- **`sos/sosService.ts`** — Orchestrates SOS pipeline: collects GPS → builds alert payload → encrypts per-recipient → dispatches via Cloud Function HTTP POST.
- **`voice/voiceService.ts`** — Continuous `@react-native-voice/voice` recognition with auto-restart. Uses Levenshtein fuzzy matching against the trigger phrase "dogs went swimming" (threshold 0.75).
- **`evidence/evidenceService.ts`** — Chunk-based recording (5s segments) from camera refs + `expo-av` audio. Uploads chunks to cloud storage via `expo-file-system` `uploadAsync`.
- **`contacts/contactsService.ts`** — AsyncStorage-backed CRUD for emergency contacts.
- **`checkin/checkinService.ts`** — Scheduled check-in with 30s polling monitor, geofence auto-arrival detection, and `expo-notifications` reminders.
- **`ride/rideService.ts`** — Logs vehicle details, tracks GPS route via foreground location, detects route deviations from expected path.
- **`safeplaces/safePlacesService.ts`** — OpenStreetMap Overpass API (no API key required) for hospitals/police/fire stations with `Linking` navigation.
- **`fakecall/fakeCallService.ts`** — Timer-based fake call with `expo-av` ringtone playback and `expo-notifications` for background triggering.
- **`firebase.ts`** — Firebase initialization via `@react-native-firebase`. Requires native config files (`google-services.json` / `GoogleService-Info.plist`).

### State Management (`src/stores/useAppStore.ts`)
Seven Zustand stores, all in a single file:
- `useProfileStore` — user profile + onboarding state
- `useContactsStore` — emergency contacts list
- `useSOSStore` — SOS status, current alert, evidence session, voice listening state
- `useCheckInStore` — active check-ins
- `useRideStore` — active ride + ride history
- `useSafePlacesStore` — nearby safe places + loading state
- `useFakeCallStore` — fake call config + active state
- `useSettingsStore` — toggle flags for voice activation, background location, auto-evidence

### Types (`src/types/index.ts`)
All shared TypeScript interfaces and type aliases are centralized here. Key types: `UserProfile`, `EmergencyContact`, `SOSAlert`, `EvidenceSession`, `CheckIn`, `RideLog`, `SafePlace`, `FakeCallConfig`, `EncryptedPayload`.

### Constants (`src/constants/index.ts`)
App-wide constants: color palette, spacing, font sizes, SOS config (trigger phrase, chunk duration, countdown), check-in/ride/safe-places config, encryption SecureStore keys, Firebase/Google API placeholders, background task names.

## Placeholder Values to Replace
Search for `{{` to find all placeholder values that need real credentials:
- `{{FIREBASE_API_KEY}}` and related Firebase config in `src/constants/index.ts`
- `{{CLOUD_FUNCTION_BASE_URL}}` in `src/services/sos/sosService.ts` and `src/services/evidence/evidenceService.ts`

## Key Patterns
- Services are pure functions/modules — no React hooks or store access inside services
- Screens connect services to Zustand stores in event handlers
- All sensitive data is encrypted client-side before leaving the device (NaCl box)
- Background tasks are registered at module scope in `app/_layout.tsx` (required by expo-task-manager)
- `assets/ringtone.mp3` is a placeholder — replace with a real ringtone file
