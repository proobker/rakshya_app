// ============================================================
// Rakshya v3.0 — Emergency Contacts Screen
// Manage emergency contacts who receive SOS alerts.
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing } from '../../src/constants';
import {
  getContacts,
  addContact,
  deleteContact,
} from '../../src/services/contacts/contactsService';
import { useContactsStore } from '../../src/stores/useAppStore';
import type { EmergencyContact } from '../../src/types';

export default function ContactsScreen() {
  const contacts = useContactsStore((s) => s.contacts);
  const setContacts = useContactsStore((s) => s.setContacts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const loaded = await getContacts();
    setContacts(loaded);
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Required', 'Name and phone number are required.');
      return;
    }

    await addContact({
      name: newContact.name,
      phone: newContact.phone,
      relationship: newContact.relationship || 'Other',
      notifyViaSMS: true,
      notifyViaPush: true,
    });

    setNewContact({ name: '', phone: '', relationship: '' });
    setShowAddModal(false);
    await loadContacts();
  };

  const handleDeleteContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Remove Contact',
      `Remove ${contact.name} from emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteContact(contact.id);
            await loadContacts();
          },
        },
      ],
    );
  };

  const renderContact = useCallback(
    ({ item }: { item: EmergencyContact }) => (
      <View style={styles.contactCard}>
        <View style={styles.contactAvatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
          <Text style={styles.contactRelation}>{item.relationship}</Text>
        </View>
        <View style={styles.contactActions}>
          {item.isPolice && (
            <View style={styles.policeBadge}>
              <Text style={styles.policeBadgeText}>Police</Text>
            </View>
          )}
          <Pressable
            onPress={() => handleDeleteContact(item)}
            style={styles.deleteBtn}
          >
            <Text style={styles.deleteBtnText}>✕</Text>
          </Pressable>
        </View>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📞</Text>
            <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
            <Text style={styles.emptyText}>
              Add people who should be notified when you trigger SOS.
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <Pressable
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add Contact</Text>
      </Pressable>

      {/* Add Contact Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.textMuted}
              value={newContact.name}
              onChangeText={(text) =>
                setNewContact((prev) => ({ ...prev, name: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={newContact.phone}
              onChangeText={(text) =>
                setNewContact((prev) => ({ ...prev, phone: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Relationship (e.g. Mother, Friend)"
              placeholderTextColor={Colors.textMuted}
              value={newContact.relationship}
              onChangeText={(text) =>
                setNewContact((prev) => ({ ...prev, relationship: text }))
              }
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleAddContact}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  contactInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  contactPhone: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactRelation: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  contactActions: {
    alignItems: 'flex-end',
  },
  policeBadge: {
    backgroundColor: Colors.info,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  policeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  addButtonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: Spacing.sm,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
});
