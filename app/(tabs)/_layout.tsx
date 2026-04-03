// ============================================================
// Rakshya v3.0 — Tab Layout
// Bottom tab navigator with 4 tabs.
// ============================================================

import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../src/constants';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.secondary,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'SOS',
          headerTitle: 'Rakshya',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="🆘" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          headerTitle: 'Emergency Contacts',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="📞" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="safety"
        options={{
          title: 'Safety',
          headerTitle: 'Safety Tools',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="🛡️" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="👤" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// Using emoji text as tab icons — replace with @expo/vector-icons for production
import { Text, View } from 'react-native';

function TabIcon({ emoji }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}
