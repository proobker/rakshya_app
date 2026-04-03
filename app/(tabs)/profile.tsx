// ============================================================
// Rakshya v3.0 — Profile Screen
// User profile setup and app settings.
// ============================================================

import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';
import { Colors, FontSize, Spacing } from '../../src/constants';
import { getOrCreateKeyPair } from '../../src/services/encryption/encryptionService';
import { useProfileStore, useSettingsStore } from '../../src/stores/useAppStore';

export default function ProfileScreen() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const voiceEnabled = useSettingsStore((s) => s.voiceActivationEnabled);
  const bgLocationEnabled = useSettingsStore((s) => s.backgroundLocationEnabled);
  const autoEvidence = useSettingsStore((s) => s.autoEvidenceOnSOS);
  const toggleVoice = useSettingsStore((s) => s.toggleVoiceActivation);
  const toggleBgLocation = useSettingsStore((s) => s.toggleBackgroundLocation);
  const toggleAutoEvidence = useSettingsStore((s) => s.toggleAutoEvidence);

  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup ?? '');
  const [medicalNotes, setMedicalNotes] = useState(profile?.medicalNotes ?? '');

  const handleSaveProfile = async () => {
    if (!fullName || !phone) {
      Alert.alert('Required', 'Name and phone number are required.');
      return;
    }

    const keyPair = await getOrCreateKeyPair();

    setProfile({
      id: profile?.id ?? uuidv4(),
      fullName,
      phone,
      email: email || undefined,
      bloodGroup: bloodGroup || undefined,
      medicalNotes: medicalNotes || undefined,
      publicKey: keyPair.publicKey,
      createdAt: profile?.createdAt ?? Date.now(),
    });

    Alert.alert('Saved', 'Your profile has been updated.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Form */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Text style={styles.hint}>
          This info is sent to emergency contacts during SOS alerts.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          placeholderTextColor={Colors.textMuted}
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Email (optional)"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Blood Group (e.g. O+)"
          placeholderTextColor={Colors.textMuted}
          value={bloodGroup}
          onChangeText={setBloodGroup}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Medical Notes (allergies, conditions...)"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          value={medicalNotes}
          onChangeText={setMedicalNotes}
        />

        <Pressable style={styles.saveBtn} onPress={handleSaveProfile}>
          <Text style={styles.saveBtnText}>Save Profile</Text>
        </Pressable>

        {/* Settings */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Safety Settings
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Voice Activation</Text>
            <Text style={styles.settingDesc}>
              Listen for secret phrase to trigger SOS
            </Text>
          </View>
          <Switch
            value={voiceEnabled}
            onValueChange={toggleVoice}
            trackColor={{ false: Colors.disabled, true: Colors.primary + '60' }}
            thumbColor={voiceEnabled ? Colors.primary : Colors.textMuted}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Background Location</Text>
            <Text style={styles.settingDesc}>
              Track location when app is in background
            </Text>
          </View>
          <Switch
            value={bgLocationEnabled}
            onValueChange={toggleBgLocation}
            trackColor={{ false: Colors.disabled, true: Colors.primary + '60' }}
            thumbColor={bgLocationEnabled ? Colors.primary : Colors.textMuted}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Auto Evidence on SOS</Text>
            <Text style={styles.settingDesc}>
              Automatically start recording when SOS is triggered
            </Text>
          </View>
          <Switch
            value={autoEvidence}
            onValueChange={toggleAutoEvidence}
            trackColor={{ false: Colors.disabled, true: Colors.primary + '60' }}
            thumbColor={autoEvidence ? Colors.primary : Colors.textMuted}
          />
        </View>

        {/* Encryption info */}
        <View style={styles.encryptionInfo}>
          <Text style={styles.encryptionTitle}>🔐 End-to-End Encrypted</Text>
          <Text style={styles.encryptionText}>
            All your data is encrypted with X25519 + XSalsa20-Poly1305.
            Your private key never leaves this device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  settingInfo: { flex: 1, marginRight: Spacing.md },
  settingTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  encryptionInfo: {
    backgroundColor: Colors.secondary + '10',
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  encryptionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.secondary,
  },
  encryptionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
});
