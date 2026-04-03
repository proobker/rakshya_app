// ============================================================
// Rakshya v3.0 — Emergency Contacts Service
// CRUD operations for emergency contacts, stored locally with
// AsyncStorage and optionally synced to Firestore.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { EmergencyContact } from '../../types';

const STORAGE_KEY = 'rakshya_emergency_contacts';

/**
 * Load all emergency contacts from local storage.
 */
export async function getContacts(): Promise<EmergencyContact[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) return [];
  return JSON.parse(json) as EmergencyContact[];
}

/**
 * Save a new emergency contact.
 */
export async function addContact(
  contact: Omit<EmergencyContact, 'id'>,
): Promise<EmergencyContact> {
  const contacts = await getContacts();
  const newContact: EmergencyContact = {
    ...contact,
    id: uuidv4(),
  };
  contacts.push(newContact);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  return newContact;
}

/**
 * Update an existing emergency contact.
 */
export async function updateContact(
  id: string,
  updates: Partial<Omit<EmergencyContact, 'id'>>,
): Promise<EmergencyContact | null> {
  const contacts = await getContacts();
  const index = contacts.findIndex((c) => c.id === id);
  if (index === -1) return null;

  contacts[index] = { ...contacts[index], ...updates };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  return contacts[index];
}

/**
 * Delete an emergency contact.
 */
export async function deleteContact(id: string): Promise<boolean> {
  const contacts = await getContacts();
  const filtered = contacts.filter((c) => c.id !== id);
  if (filtered.length === contacts.length) return false;

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Get contacts that should receive SOS alerts.
 */
export async function getSOSRecipients(): Promise<EmergencyContact[]> {
  const contacts = await getContacts();
  return contacts.filter((c) => c.notifyViaSMS || c.notifyViaPush);
}

/**
 * Add a default police contact.
 */
export async function addPoliceContact(
  phone: string = '911',
  name: string = 'Police Emergency',
): Promise<EmergencyContact> {
  return addContact({
    name,
    phone,
    relationship: 'Police',
    isPolice: true,
    notifyViaSMS: true,
    notifyViaPush: false,
  });
}
