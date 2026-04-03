// ============================================================
// Rakshya v3.0 — Zustand App Store
// Centralized state management for the entire app.
// ============================================================

import { create } from 'zustand';
import type {
  CheckIn,
  EmergencyContact,
  EvidenceSession,
  FakeCallConfig,
  RideLog,
  SafePlace,
  SOSAlert,
  SOSStatus,
  UserProfile,
} from '../types';

// --- Auth / Profile Store ---
interface ProfileState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  setProfile: (profile: UserProfile) => void;
  clearProfile: () => void;
  setOnboarded: (value: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isOnboarded: false,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null }),
  setOnboarded: (value) => set({ isOnboarded: value }),
}));

// --- Emergency Contacts Store ---
interface ContactsState {
  contacts: EmergencyContact[];
  setContacts: (contacts: EmergencyContact[]) => void;
  addContact: (contact: EmergencyContact) => void;
  updateContact: (id: string, updates: Partial<EmergencyContact>) => void;
  removeContact: (id: string) => void;
}

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: [],
  setContacts: (contacts) => set({ contacts }),
  addContact: (contact) =>
    set((state) => ({ contacts: [...state.contacts, contact] })),
  updateContact: (id, updates) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    })),
  removeContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    })),
}));

// --- SOS Store ---
interface SOSState {
  status: SOSStatus;
  currentAlert: SOSAlert | null;
  evidenceSession: EvidenceSession | null;
  isVoiceListening: boolean;
  setStatus: (status: SOSStatus) => void;
  setCurrentAlert: (alert: SOSAlert | null) => void;
  setEvidenceSession: (session: EvidenceSession | null) => void;
  setVoiceListening: (listening: boolean) => void;
  /**
   * ATOMIC FIX: Trigger SOS and set alert data simultaneously.
   * Prevents the evidence service from trying to record with a null ID.
   */
  triggerSOS: (alert: SOSAlert) => void;
  reset: () => void;
}

export const useSOSStore = create<SOSState>((set) => ({
  status: 'idle',
  currentAlert: null,
  evidenceSession: null,
  isVoiceListening: false,
  setStatus: (status) => set({ status }),
  setCurrentAlert: (alert) => set({ currentAlert: alert }),
  setEvidenceSession: (session) => set({ evidenceSession: session }),
  setVoiceListening: (listening) => set({ isVoiceListening: listening }),
  
  triggerSOS: (alert) => set({ 
    currentAlert: alert, 
    status: 'triggered' 
  }),

  reset: () =>
    set({
      status: 'idle',
      currentAlert: null,
      evidenceSession: null,
    }),
}));

// --- Check-In Store ---
interface CheckInState {
  activeCheckIns: CheckIn[];
  setCheckIns: (checkIns: CheckIn[]) => void;
  addCheckIn: (checkIn: CheckIn) => void;
  updateCheckIn: (id: string, updates: Partial<CheckIn>) => void;
  removeCheckIn: (id: string) => void;
}

export const useCheckInStore = create<CheckInState>((set) => ({
  activeCheckIns: [],
  setCheckIns: (checkIns) => set({ activeCheckIns: checkIns }),
  addCheckIn: (checkIn) =>
    set((state) => ({ activeCheckIns: [...state.activeCheckIns, checkIn] })),
  updateCheckIn: (id, updates) =>
    set((state) => ({
      activeCheckIns: state.activeCheckIns.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    })),
  removeCheckIn: (id) =>
    set((state) => ({
      activeCheckIns: state.activeCheckIns.filter((c) => c.id !== id),
    })),
}));

// --- Ride Store ---
interface RideState {
  activeRide: RideLog | null;
  rideHistory: RideLog[];
  setActiveRide: (ride: RideLog | null) => void;
  addToHistory: (ride: RideLog) => void;
}

export const useRideStore = create<RideState>((set) => ({
  activeRide: null,
  rideHistory: [],
  setActiveRide: (ride) => set({ activeRide: ride }),
  addToHistory: (ride) =>
    set((state) => ({ rideHistory: [ride, ...state.rideHistory] })),
}));

// --- Safe Places Store ---
interface SafePlacesState {
  places: SafePlace[];
  isLoading: boolean;
  setPlaces: (places: SafePlace[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useSafePlacesStore = create<SafePlacesState>((set) => ({
  places: [],
  isLoading: false,
  setPlaces: (places) => set({ places }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

// --- Fake Call Store ---
interface FakeCallState {
  config: FakeCallConfig;
  isCallActive: boolean;
  setConfig: (config: Partial<FakeCallConfig>) => void;
  setCallActive: (active: boolean) => void;
}

export const useFakeCallStore = create<FakeCallState>((set) => ({
  config: {
    callerName: 'Mom',
    delaySeconds: 30,
  },
  isCallActive: false,
  setConfig: (config) =>
    set((state) => ({ config: { ...state.config, ...config } })),
  setCallActive: (active) => set({ isCallActive: active }),
}));

// --- Settings Store ---
interface SettingsState {
  voiceActivationEnabled: boolean;
  backgroundLocationEnabled: boolean;
  autoEvidenceOnSOS: boolean;
  toggleVoiceActivation: () => void;
  toggleBackgroundLocation: () => void;
  toggleAutoEvidence: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  voiceActivationEnabled: true,
  backgroundLocationEnabled: true,
  autoEvidenceOnSOS: true,
  toggleVoiceActivation: () =>
    set((state) => ({
      voiceActivationEnabled: !state.voiceActivationEnabled,
    })),
  toggleBackgroundLocation: () =>
    set((state) => ({
      backgroundLocationEnabled: !state.backgroundLocationEnabled,
    })),
  toggleAutoEvidence: () =>
    set((state) => ({
      autoEvidenceOnSOS: !state.autoEvidenceOnSOS,
    })),
}));