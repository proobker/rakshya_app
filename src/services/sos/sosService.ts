// ============================================================
// Rakshya v3.0 — SOS Service
// Orchestrates the full SOS pipeline: collect data → encrypt → dispatch.
// ============================================================

import firestore, { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  FirebaseFirestoreTypes // Use this for internal types
} from '@react-native-firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentLocation } from '../location/locationService';
import { encrypt } from '../encryption/encryptionService';
import type { EmergencyContact, SOSAlert, UserProfile } from '../../types';

const db = getFirestore();

/**
 * Build and dispatch an SOS alert.
 */
export async function triggerSOS(
  profile: UserProfile,
  contacts: EmergencyContact[],
  triggerMethod: SOSAlert['triggerMethod'],
): Promise<SOSAlert> {
  const location = await getCurrentLocation();

  // FIX: Using undefined instead of null to match your UserProfile type definition
  const alert: SOSAlert = {
    id: uuidv4(),
    userId: profile.id,
    profile: {
      fullName: profile.fullName ?? 'Unknown User',
      phone: profile.phone ?? 'No Phone Provided',
      bloodGroup: profile.bloodGroup ?? undefined,
      medicalNotes: profile.medicalNotes ?? undefined,
    },
    location: location ?? null,
    timestamp: Date.now(),
    triggerMethod,
    status: 'triggered',
    recipientIds: contacts.map((c) => c.id),
  };

  alert.status = 'sending';

  const dispatchPromises = contacts.map(async (contact) => {
    try {
      const payloadData = {
        alertId: alert.id,
        profile: alert.profile,
        location: alert.location,
        timestamp: alert.timestamp,
        triggerMethod: alert.triggerMethod,
      };

      const payloadString = JSON.stringify(payloadData);
      let encryptedPayload: string | object = payloadString;

      if (contact.publicKey) {
        encryptedPayload = await encrypt(payloadString, contact.publicKey);
      }

      await dispatchAlert(contact, encryptedPayload, alert.id);
      
    } catch (err: any) {
      console.error(`[SOS] Failed to dispatch to ${contact.name}:`, err.message);
    }
  });

  await Promise.allSettled(dispatchPromises);
  
  alert.status = 'sent';
  return alert;
}

/**
 * Saves a dispatch record to Firestore. 
 */
async function dispatchAlert(
  contact: EmergencyContact,
  payload: string | object,
  alertId: string, 
): Promise<void> {
  try {
    const dispatchData = {
      alertId: alertId, 
      contactPhone: contact.phone ?? null,
      contactEmail: contact.email ?? null,
      notifyViaSMS: contact.notifyViaSMS ?? false,
      notifyViaPush: contact.notifyViaPush ?? false,
      encryptedPayload: payload ?? "",
      createdAt: serverTimestamp(),
      status: 'pending'
    };

    await addDoc(collection(db, 'sos_dispatches'), dispatchData);
    
    console.log(`✅ SOS successfully queued for ${contact.name}`);
  } catch (error: any) {
    console.error("[SOS] Firebase Dispatch Error:", error.message);
    throw new Error(`Firestore Dispatch failed: ${error.message}`);
  }
}

/**
 * Cancel an active SOS alert.
 */
export async function cancelSOS(alertId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'sos_dispatches'), 
      where('alertId', '==', alertId)
    );
    
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('[SOS] No active dispatches found to cancel.');
      return;
    }

    const batch = writeBatch(db);
    
    // FIX: Using FirebaseFirestoreTypes.QueryDocumentSnapshot for proper mapping
    snapshot.docs.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
      batch.update(doc.ref, { 
        status: 'cancelled',
        cancelledAt: serverTimestamp() 
      });
    });

    await batch.commit();
    console.log(`🚫 SOS Alert ${alertId} has been cancelled.`);
  } catch (error: any) {
    console.error("[SOS] Failed to cancel:", error.message);
    throw new Error(`Cancellation failed: ${error.message}`);
  }
}