// ============================================================
// Rakshya v3.0 — Safety Feature Card Component
// Reusable card for safety tools on the Safety tab.
// ============================================================

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Spacing } from '../constants';

interface SafetyCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  color?: string;
  badge?: string;
}

export default function SafetyCard({
  icon,
  title,
  description,
  onPress,
  color = Colors.secondary,
  badge,
}: SafetyCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Text style={[styles.icon, { color }]}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
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
  cardPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  badge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
});
