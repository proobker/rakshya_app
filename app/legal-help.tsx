// ============================================================
// Rakshya v3.0 — Legal Help Screen
// Legal aid directory and emergency rights information.
// ============================================================

import React from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, FontSize, Spacing } from '../src/constants';

interface LegalResource {
  name: string;
  description: string;
  phone?: string;
  url?: string;
  icon: string;
}

const LEGAL_RESOURCES: LegalResource[] = [
  {
    name: 'National Domestic Violence Hotline',
    description: '24/7 confidential support for domestic violence survivors',
    phone: '1-800-799-7233',
    url: 'https://www.thehotline.org',
    icon: '📞',
  },
  {
    name: 'RAINN Sexual Assault Hotline',
    description: 'Free, confidential 24/7 support',
    phone: '1-800-656-4673',
    url: 'https://www.rainn.org',
    icon: '🆘',
  },
  {
    name: 'National Human Trafficking Hotline',
    description: 'Report tips, get help, and connect with services',
    phone: '1-888-373-7888',
    url: 'https://humantraffickinghotline.org',
    icon: '🔗',
  },
  {
    name: 'Legal Aid Near You',
    description: 'Find free legal aid in your area',
    url: 'https://www.lawhelp.org',
    icon: '⚖️',
  },
  {
    name: 'Crisis Text Line',
    description: 'Text HOME to 741741 for free crisis support',
    phone: '741741',
    icon: '💬',
  },
];

const EMERGENCY_RIGHTS = [
  'You have the right to call 911 at any time.',
  'You have the right to leave a dangerous situation.',
  'You have the right to seek a protective/restraining order.',
  'You have the right to press criminal charges.',
  'You have the right to free legal aid if you cannot afford an attorney.',
  'You have the right to medical care, regardless of ability to pay.',
  'You have the right to not answer questions without a lawyer present.',
  'Evidence (photos, recordings, messages) can be critical — save everything safely.',
];

export default function LegalHelpScreen() {
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Emergency Rights */}
      <Text style={styles.sectionTitle}>Know Your Rights</Text>
      <View style={styles.rightsCard}>
        {EMERGENCY_RIGHTS.map((right, index) => (
          <View key={index} style={styles.rightRow}>
            <Text style={styles.rightBullet}>•</Text>
            <Text style={styles.rightText}>{right}</Text>
          </View>
        ))}
      </View>

      {/* Resources */}
      <Text style={styles.sectionTitle}>Helplines & Resources</Text>
      {LEGAL_RESOURCES.map((resource, index) => (
        <View key={index} style={styles.resourceCard}>
          <Text style={styles.resourceIcon}>{resource.icon}</Text>
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceName}>{resource.name}</Text>
            <Text style={styles.resourceDesc}>{resource.description}</Text>
            <View style={styles.resourceActions}>
              {resource.phone && (
                <Pressable
                  style={styles.callBtn}
                  onPress={() => handleCall(resource.phone!)}
                >
                  <Text style={styles.callBtnText}>
                    Call {resource.phone}
                  </Text>
                </Pressable>
              )}
              {resource.url && (
                <Pressable
                  style={styles.webBtn}
                  onPress={() => handleOpenUrl(resource.url!)}
                >
                  <Text style={styles.webBtnText}>Visit Website</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      ))}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          This information is for general guidance only and does not constitute
          legal advice. Laws vary by jurisdiction. Contact a licensed attorney
          for advice specific to your situation.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  rightsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  rightRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  rightBullet: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    marginRight: Spacing.sm,
    fontWeight: '700',
  },
  rightText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  resourceCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resourceIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  resourceDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  resourceActions: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  callBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  callBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  webBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  webBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  disclaimer: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disclaimerText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
