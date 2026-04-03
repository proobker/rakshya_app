// ============================================================
// Rakshya v3.0 — Firebase Configuration
// Initialize Firebase services. Replace placeholder values in
// constants/index.ts with your actual Firebase project config.
// ============================================================

// NOTE: @react-native-firebase uses native modules and reads config
// from google-services.json (Android) and GoogleService-Info.plist (iOS).
// The web-style config below is for reference; the actual initialization
// happens automatically via the native config files.
//
// Setup steps:
// 1. Create a Firebase project at https://console.firebase.google.com
// 2. Add Android app → download google-services.json → place in android/app/
// 3. Add iOS app → download GoogleService-Info.plist → place in ios/
// 4. Enable Authentication, Firestore, and Cloud Storage in the Firebase console

import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';
import '@react-native-firebase/storage';

export { firebase };

/**
 * Check if Firebase is initialized.
 */
export function isFirebaseInitialized(): boolean {
  return firebase.apps.length > 0;
}
