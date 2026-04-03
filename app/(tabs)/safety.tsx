// ============================================================
// Rakshya v3.0 — Safety Tools Screen
// Hub for check-in, ride verification, safe places, and more.
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import SafetyCard from '../../src/components/SafetyCard';
import { Colors, FontSize, Spacing } from '../../src/constants';
import { createCheckIn, getActiveCheckIns, confirmArrival } from '../../src/services/checkin/checkinService';
import { startRide, endRide, getActiveRide } from '../../src/services/ride/rideService';
import { findAllSafePlaces, navigateToPlace } from '../../src/services/safeplaces/safePlacesService';
import { useCheckInStore, useRideStore, useSafePlacesStore } from '../../src/stores/useAppStore';
import type { SafePlace } from '../../src/types';

export default function SafetyScreen() {
  const router = useRouter();
  const activeCheckIns = useCheckInStore((s) => s.activeCheckIns);
  const setCheckIns = useCheckInStore((s) => s.setCheckIns);
  const addCheckInStore = useCheckInStore((s) => s.addCheckIn);
  const activeRide = useRideStore((s) => s.activeRide);
  const setActiveRide = useRideStore((s) => s.setActiveRide);
  const safePlaces = useSafePlacesStore((s) => s.places);
  const setPlaces = useSafePlacesStore((s) => s.setPlaces);
  const isLoadingPlaces = useSafePlacesStore((s) => s.isLoading);
  const setLoadingPlaces = useSafePlacesStore((s) => s.setLoading);

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showRideModal, setShowRideModal] = useState(false);
  const [showPlacesModal, setShowPlacesModal] = useState(false);

  // Check-in form state
  const [checkInDest, setCheckInDest] = useState('');
  const [checkInMinutes, setCheckInMinutes] = useState('30');

  // Ride form state
  const [ridePlate, setRidePlate] = useState('');
  const [rideColor, setRideColor] = useState('');
  const [rideModel, setRideModel] = useState('');

  useEffect(() => {
    loadActiveCheckIns();
    loadActiveRide();
  }, []);

  const loadActiveCheckIns = async () => {
    const active = await getActiveCheckIns();
    setCheckIns(active);
  };

  const loadActiveRide = async () => {
    const ride = await getActiveRide();
    setActiveRide(ride);
  };

  // --- Check-In ---
  const handleCreateCheckIn = async () => {
    if (!checkInDest) {
      Alert.alert('Required', 'Please enter a destination.');
      return;
    }
    const minutes = parseInt(checkInMinutes, 10) || 30;
    const checkIn = await createCheckIn({
      destination: checkInDest,
      expectedArrivalTime: Date.now() + minutes * 60 * 1000,
      contactIds: [],
    });
    addCheckInStore(checkIn);
    setShowCheckInModal(false);
    setCheckInDest('');
    setCheckInMinutes('30');
  };

  const handleConfirmArrival = async (id: string) => {
    await confirmArrival(id);
    await loadActiveCheckIns();
  };

  // --- Ride ---
  const handleStartRide = async () => {
    if (!ridePlate) {
      Alert.alert('Required', 'Please enter the vehicle plate number.');
      return;
    }
    const ride = await startRide({
      vehiclePlate: ridePlate,
      vehicleColor: rideColor || undefined,
      vehicleModel: rideModel || undefined,
      sharedWithContactIds: [],
    });
    setActiveRide(ride);
    setShowRideModal(false);
    setRidePlate('');
    setRideColor('');
    setRideModel('');
  };

  const handleEndRide = async () => {
    if (activeRide) {
      await endRide(activeRide.id);
      setActiveRide(null);
    }
  };

  // --- Safe Places ---
  const handleFindPlaces = async () => {
    setShowPlacesModal(true);
    setLoadingPlaces(true);
    try {
      const places = await findAllSafePlaces();
      setPlaces(places);
    } catch (err) {
      Alert.alert('Error', 'Could not find nearby safe places. Check your internet connection.');
    } finally {
      setLoadingPlaces(false);
    }
  };

  const getPlaceEmoji = (type: SafePlace['type']) => {
    switch (type) {
      case 'hospital': return '🏥';
      case 'police': return '🚔';
      case 'fire_station': return '🚒';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Active Check-Ins */}
        {activeCheckIns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Check-Ins</Text>
            {activeCheckIns.map((ci) => (
              <View key={ci.id} style={styles.activeCard}>
                <Text style={styles.activeCardTitle}>{ci.destination}</Text>
                <Text style={styles.activeCardSub}>
                  Due: {new Date(ci.expectedArrivalTime).toLocaleTimeString()}
                </Text>
                <Pressable
                  style={styles.confirmBtn}
                  onPress={() => handleConfirmArrival(ci.id)}
                >
                  <Text style={styles.confirmBtnText}>I've Arrived</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Active Ride */}
        {activeRide && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Ride</Text>
            <View style={styles.activeCard}>
              <Text style={styles.activeCardTitle}>
                {activeRide.vehicleModel ?? 'Vehicle'} — {activeRide.vehiclePlate}
              </Text>
              <Text style={styles.activeCardSub}>
                Started: {new Date(activeRide.startedAt).toLocaleTimeString()}
              </Text>
              <Pressable style={styles.endRideBtn} onPress={handleEndRide}>
                <Text style={styles.confirmBtnText}>End Ride</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Feature Cards */}
        <Text style={styles.sectionTitle}>Safety Tools</Text>

        <SafetyCard
          icon="📍"
          title="Check-In"
          description="Set a destination and time — auto-SOS if you don't arrive"
          onPress={() => setShowCheckInModal(true)}
          color={Colors.success}
          badge={activeCheckIns.length > 0 ? `${activeCheckIns.length}` : undefined}
        />
        <SafetyCard
          icon="🚗"
          title="Ride Verification"
          description="Log vehicle details and track your route in real-time"
          onPress={() => activeRide ? handleEndRide() : setShowRideModal(true)}
          color={Colors.accent}
          badge={activeRide ? 'Active' : undefined}
        />
        <SafetyCard
          icon="🏥"
          title="Nearby Safe Places"
          description="Find hospitals, police stations, and fire stations"
          onPress={handleFindPlaces}
          color={Colors.info}
        />
        <SafetyCard
          icon="📱"
          title="Fake Call"
          description="Generate a fake incoming call to leave safely"
          onPress={() => router.push('/fake-call')}
          color={Colors.secondaryLight}
        />
        <SafetyCard
          icon="⚖️"
          title="Legal Help"
          description="Legal aid resources and emergency rights guide"
          onPress={() => router.push('/legal-help')}
          color={Colors.secondary}
        />
      </ScrollView>

      {/* Check-In Modal */}
      <Modal visible={showCheckInModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Check-In</Text>
            <TextInput
              style={styles.input}
              placeholder="Destination (e.g. Mom's house)"
              placeholderTextColor={Colors.textMuted}
              value={checkInDest}
              onChangeText={setCheckInDest}
            />
            <TextInput
              style={styles.input}
              placeholder="Expected arrival in minutes"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={checkInMinutes}
              onChangeText={setCheckInMinutes}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowCheckInModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleCreateCheckIn}>
                <Text style={styles.saveBtnText}>Start</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ride Modal */}
      <Modal visible={showRideModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log a Ride</Text>
            <TextInput
              style={styles.input}
              placeholder="Vehicle Plate Number"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              value={ridePlate}
              onChangeText={setRidePlate}
            />
            <TextInput
              style={styles.input}
              placeholder="Vehicle Color (optional)"
              placeholderTextColor={Colors.textMuted}
              value={rideColor}
              onChangeText={setRideColor}
            />
            <TextInput
              style={styles.input}
              placeholder="Vehicle Model (optional)"
              placeholderTextColor={Colors.textMuted}
              value={rideModel}
              onChangeText={setRideModel}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowRideModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleStartRide}>
                <Text style={styles.saveBtnText}>Start Ride</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Safe Places Modal */}
      <Modal visible={showPlacesModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <Text style={styles.modalTitle}>Nearby Safe Places</Text>
            {isLoadingPlaces ? (
              <Text style={styles.loadingText}>Searching nearby...</Text>
            ) : safePlaces.length === 0 ? (
              <Text style={styles.loadingText}>No safe places found nearby.</Text>
            ) : (
              <ScrollView>
                {safePlaces.map((place) => (
                  <Pressable
                    key={place.id}
                    style={styles.placeCard}
                    onPress={() => navigateToPlace(place)}
                  >
                    <Text style={styles.placeEmoji}>{getPlaceEmoji(place.type)}</Text>
                    <View style={styles.placeInfo}>
                      <Text style={styles.placeName}>{place.name}</Text>
                      <Text style={styles.placeAddr}>{place.address}</Text>
                      <Text style={styles.placeDist}>
                        {(place.distanceMeters / 1000).toFixed(1)} km away
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <Pressable style={styles.closeBtn} onPress={() => setShowPlacesModal(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  activeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  activeCardTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  activeCardSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  confirmBtn: {
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  endRideBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  confirmBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.white },
  // Modal shared styles
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', marginRight: Spacing.sm, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', marginLeft: Spacing.sm, borderRadius: 10, backgroundColor: Colors.primary },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  loadingText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.lg },
  placeCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  placeEmoji: { fontSize: 28, marginRight: Spacing.md },
  placeInfo: { flex: 1 },
  placeName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  placeAddr: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  placeDist: { fontSize: FontSize.xs, color: Colors.info, marginTop: 2, fontWeight: '600' },
  closeBtn: { marginTop: Spacing.md, paddingVertical: 14, alignItems: 'center', borderRadius: 10, backgroundColor: Colors.secondary },
  closeBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
