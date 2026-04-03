# Rakshya

**Rakshya** is a personal safety application for urgent situations: one-tap SOS, optional voice-triggered alerts, live location context, ride monitoring, scheduled check-ins, evidence capture, and encrypted delivery of sensitive payloads to trusted contacts. The product pairs a **native mobile app** with a **public marketing site** hosted on GitHub Pages.

| Artifact | Repository / host |
| -------- | ----------------- |
| Mobile app (Expo / React Native) | This Repo - [proobker/rakshya_app](https://github.com/proobker/rakshya_app) |
| Landing page & APK distribution links | [rakshyaapp/rakshyaapp.github.io](https://github.com/rakshyaapp/rakshyaapp.github.io) (or your fork) |

---

## Features (product)

- **Smart SOS** — Orchestrates profile + latest GPS fix, optionally encrypts per contact, and queues dispatches to Firebase Firestore (`sos_dispatches`).
- **Voice activation** — [@react-native-voice/voice](https://github.com/react-native-voice/voice) listens for a configurable phrase (see `constants.ts`: default phrase and fuzzy threshold). On match, the app triggers the same SOS pipeline as a manual alert.
- **End-to-end encryption** — [TweetNaCl](https://tweetnacl.js.org/) **X25519 / XSalsa20-Poly1305** (`nacl.box`); private keys live in **Expo SecureStore** and are not exported.
- **Live & background location** — [expo-location](https://docs.expo.dev/versions/latest/sdk/location/) with **expo-task-manager** defining `TASK_NAMES.BACKGROUND_LOCATION` for updates while the app is backgrounded (when permitted).
- **Evidence** — [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) / [expo-av](https://docs.expo.dev/versions/latest/sdk/av/) style capture with chunked timing (`EVIDENCE_CHUNK_DURATION_MS`); upload path integrates with **Firebase Storage** via `@react-native-firebase/storage`.
- **Ride monitoring** — `rideService` logs GPS on an interval and evaluates **route deviation** against `RIDE_CONFIG.ROUTE_DEVIATION_THRESHOLD_METERS`.
- **Safe places** — `safePlacesService` surfaces nearby **hospital / police / fire_station** style POIs within a search radius.
- **Check-ins** — `checkinService` supports scheduled check-ins with grace periods and geofence radius (`CHECKIN_CONFIG`).
- **Fake call** — `fakeCallService` + `app/fake-call.tsx` for a decoy incoming-call style escape aid.
- **Contacts & profile** — `contactsService` and Zustand stores manage emergency contacts (including optional `publicKey` for encryption).
- **Legal help** — `app/legal-help.tsx` for in-app legal / resource content.

---

## Mobile application — tech stack

| Layer | Technology |
| ----- | ---------- |
| Framework | **[Expo SDK ~55](https://expo.dev/)** with **[React Native 0.83](https://reactnative.dev/)** and **React 19** |
| Language | **TypeScript** |
| Navigation | **[expo-router](https://docs.expo.dev/router/introduction/)** (file-based routes under `app/`) |
| State | **[Zustand](https://github.com/pmndrs/zustand)** (`src/stores/useAppStore.ts`) |
| Backend | **[Firebase](https://firebase.google.com/)** via **[@react-native-firebase](https://rnfirebase.io/)** — Auth, Firestore, Storage |
| Crypto | **[tweetnacl](https://www.npmjs.com/package/tweetnacl)** + **tweetnacl-util** |
| Maps | **react-native-maps** |
| Animations | **react-native-reanimated**, **react-native-worklets** |
| Voice | **@react-native-voice/voice** (with **`patch-package`** patch under `patches/`) |
| IDs | **uuid** |
| Secure storage | **expo-secure-store** |
| Notifications | **expo-notifications** (custom sound: `assets/ringtone.mp3`) |

Native configuration for Android expects **`google-services.json`** at the path declared in `app.json` (`android.googleServicesFile`). iOS uses the standard **`GoogleService-Info.plist`** workflow described in `src/services/firebase.ts`.

---

## How it works (architecture)

1. **Bootstrap** — `index.js` registers the Expo root and wires **Expo Router** to the `app/` directory. `react-native-get-random-values` is imported first so libraries like TweetNaCl have a secure RNG.

2. **Root layout** (`app/_layout.tsx`) on launch:
   - Ensures **`getOrCreateKeyPair()`** has run so encryption keys exist in SecureStore.
   - Requests **location permissions** via `locationService`.
   - Registers a **background location** task with `expo-task-manager` (module scope).
   - When **voice activation** is enabled and a profile exists, starts **`voiceService`**; the phrase callback loads SOS recipients and calls **`triggerSOS(profile, contacts, 'voice')`**.

3. **Manual SOS** — UI components (e.g. `SOSButton`) ultimately call **`triggerSOS`** with `triggerMethod` such as `'voice'` or implied manual flow. The service:
   - Reads **GPS** via `getCurrentLocation()`.
   - Builds an **`SOSAlert`** object (id, profile snapshot, location, timestamp, recipients).
   - For each contact: if **`contact.publicKey`** is set, **encrypts** the JSON payload with `encryptionService.encrypt`; otherwise sends plaintext (implementation choice — production systems often require keys for all recipients).
   - Writes rows to Firestore **`sos_dispatches`** with channels (`notifyViaSMS`, `notifyViaPush`, etc.).

4. **Cancellation** — `cancelSOS(alertId)` queries dispatches by `alertId` and batch-updates status to **`cancelled`**.

5. **Encryption** — `encryptionService` generates an X25519 keypair, stores **secret** and **public** keys in SecureStore, and uses **`nacl.box`** for encrypt/decrypt and **`encryptBinary`** for media-style blobs.

6. **State** — Multiple Zustand slices isolate **profile, contacts, SOS, check-ins, rides, safe places, fake call, settings** for predictable UI updates.

---

## Repository layout — `rakshya_app`

### Top-level files

| File | Purpose |
| ---- | ------- |
| `package.json` | Scripts: `expo start`, `expo run:android` / `ios`, `web`; **`postinstall`: `patch-package`** for dependency patches. |
| `app.json` | Expo app name **Rakshya**, slug, deep link **scheme `rakshya`**, icons, splash, iOS **Info.plist** usage strings, Android **permissions** (location, camera, mic, foreground services), **`expo-router`**, `expo-secure-store`, `expo-location`, `expo-camera`, `expo-notifications` plugins. |
| `tsconfig.json` | TypeScript compiler options for the project. |
| `metro.config.js` | Metro bundler configuration for React Native. |
| `index.js` | Application entry: Expo Router root registration. |
| `App.tsx` | Legacy / placeholder root component (Expo template-style); **expo-router** is the real UI host. |
| `constants.ts` | Global design tokens (**Colors**, **Spacing**, **FontSize**), **SOS / check-in / ride / safe-places / encryption** tuning constants, **TASK_NAMES**, and a **FIREBASE_CONFIG** placeholder object (native apps rely on `google-services.json` / plist — see `src/services/firebase.ts`). |

### `app/` — screens & navigation (expo-router)

| Path | Role |
| ---- | ---- |
| `_layout.tsx` | Root **Stack** layout: encryption init, permissions, background task registration, voice listener lifecycle. |
| `(tabs)/_layout.tsx` | **Tabs** navigator — primary shell (home, safety, contacts, profile). |
| `(tabs)/index.tsx` | Main / home tab. |
| `(tabs)/safety.tsx` | Safety hub (SOS, monitoring, related controls). |
| `(tabs)/contacts.tsx` | Emergency contacts management. |
| `(tabs)/profile.tsx` | User profile and medical / identity fields for alerts. |
| `evidence.tsx` | Evidence viewing / session flow. |
| `fake-call.tsx` | Fake incoming call experience. |
| `legal-help.tsx` | Legal / help resources screen. |

### `src/components/`

| File | Role |
| ---- | ---- |
| `SOSButton.tsx` | Primary SOS control UI / interaction. |
| `SafetyCard.tsx` | Reusable card for safety-related dashboard items. |

### `src/constants/`

| File | Role |
| ---- | ---- |
| `index.ts` | Shared constants export (may mirror or extend root `constants.ts` patterns). |

### `src/services/`

| Path | Role |
| ---- | ---- |
| `firebase.ts` | Side-effect imports for **@react-native-firebase** modules; `isFirebaseInitialized()` helper; setup documented in comments. |
| `encryption/encryptionService.ts` | Key generation, SecureStore persistence, **`encrypt` / `decrypt` / `encryptBinary`**. |
| `sos/sosService.ts` | **`triggerSOS`**, **`cancelSOS`**, Firestore **`sos_dispatches`** writes. |
| `location/locationService.ts` | Permissions, current position, background updates integration. |
| `voice/voiceService.ts` | Start/stop speech recognition; phrase matching against **`SOS_CONFIG`**. |
| `contacts/contactsService.ts` | Load **SOS recipients** and contact persistence helpers. |
| `evidence/evidenceService.ts` | Recording chunks, local files, upload hooks. |
| `checkin/checkinService.ts` | Scheduled check-in and geofence logic. |
| `ride/rideService.ts` | Active ride logging and deviation detection. |
| `safeplaces/safePlacesService.ts` | Nearby safety POIs. |
| `fakecall/fakeCallService.ts` | Fake call timing and state driving `fake-call` screen. |

### `src/stores/`

| File | Role |
| ---- | ---- |
| `useAppStore.ts` | **Zustand** stores: profile, contacts, SOS, check-ins, rides, safe places, fake call, settings toggles (**voice**, **background location**, **auto evidence**). |

### `src/types/`

| File | Role |
| ---- | ---- |
| `index.ts` | Shared domain types (**UserProfile**, **EmergencyContact**, **SOSAlert**, **EncryptedPayload**, etc.). |

### `assets/`

App icon, adaptive Android icon layers, **splash** image, **favicon**, and **`ringtone.mp3`** for notification plugin configuration.

### `patches/`

| File | Role |
| ---- | ---- |
| `@react-native-voice+voice+3.1.5.patch` | **patch-package** fix for the voice library under your Expo / RN versions. |

### `.idea/`

JetBrains IDE project metadata (optional in open-source checkouts; many teams **gitignore** this).

---

## Local development — mobile app

**Prerequisites:** Node.js (LTS), [Expo CLI workflow](https://docs.expo.dev/get-started/installation/), Xcode (iOS, macOS), Android Studio / SDK (Android). Install **Java** and Android tooling as required by Expo prebuild / dev client.

```bash
git clone https://github.com/proobker/rakshya_app.git
cd rakshya_app
npm install   # runs patch-package via postinstall
```

1. Add **Firebase** Android `google-services.json` (path must match `app.json`).
2. For iOS, add **`GoogleService-Info.plist`** via Xcode after `expo prebuild` or EAS workflow.
3. Enable **Authentication**, **Cloud Firestore**, and **Storage** in the Firebase console; define security rules appropriate for production (the app writes **`sos_dispatches`** and evidence paths per your rules).

```bash
npm run start        # Expo dev server
npm run android      # Native Android run (dev client / prebuild as applicable)
npm run ios          # Native iOS run
```

**Environment / secrets:** Replace placeholder `FIREBASE_CONFIG` in `constants.ts` if you use the JS SDK anywhere; **@react-native-firebase** reads native config files at runtime. Never commit real API keys in public repos — use EAS secrets or local untracked config where appropriate.

---

## Marketing site — this repository (`rakshyaapp.github.io`)

Static **GitHub Pages** landing: no build step required.

| File | Purpose |
| ---- | ------- |
| `index.html` | Semantic sections: hero, story timeline, features, security copy, demo video, download CTAs (APK + iOS placeholder), footer with social links. Uses **Inter** from Google Fonts and `demo.mp4` / `favicon.png`. |
| `styles.css` | Design system (**CSS variables**), layout grids, sticky story section driven by **`--story-progress`**, responsive breakpoints, reduced-motion media query, footer / CTA polish. |
| `script.js` | Smooth in-page anchors, **IntersectionObserver** reveal animations, parallax-style hero phone tilt (**pointer** + **requestAnimationFrame**), scroll-synced story slides, navbar scroll state, footer load transition. |
| `.gitignore` | Ignores `*.apk` (optional — keeps built binaries out of git if present locally). |

---

## Safety & compliance

Rakshya is **not** a substitute for **emergency services** (police / ambulance). Use it as a supplement with clear user expectations and jurisdiction-appropriate disclaimers on store listings and in-app.

---

## License

See [LICENSE](LICENSE) 

---

## Links

- Mobile source: [github.com/proobker/rakshya_app](https://github.com/proobker/rakshya_app)
- Expo: [docs.expo.dev](https://docs.expo.dev/)
- React Native Firebase: [rnfirebase.io](https://rnfirebase.io/)
