// app/settings.tsx — Tilt Source Settings + Live Preview
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTiltData, TiltSource } from '../hooks/useTiltData';
import { seedMazes } from '../scripts/seedMazes';
import { colors } from '../constants/colors';

const SOURCES: { key: TiltSource; label: string; desc: string }[] = [
  { key: 'phone', label: 'Phone Tilt', desc: 'Use phone accelerometer' },
  { key: 'esp32', label: 'ESP32', desc: 'External tilt controller' },
  { key: 'joystick', label: 'Joystick', desc: 'On-screen virtual joystick' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const [source, setSource] = useState<TiltSource>('phone');
  const [deviceId, setDeviceId] = useState('esp32_001');
  const [seedStatus, setSeedStatus] = useState('');

  // Live tilt data for preview
  const tilt = useTiltData(source, deviceId);

  // Map tilt to dot position on the preview circle
  const previewSize = 160;
  const dotSize = 20;
  const maxOffset = (previewSize - dotSize) / 2;
  const dotX = tilt.roll * maxOffset;
  const dotY = tilt.pitch * maxOffset;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>SETTINGS</Text>

      {/* Tilt Source Selector */}
      <Text style={styles.sectionLabel}>Tilt Source</Text>
      <View style={styles.sourceList}>
        {SOURCES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.sourceCard, source === s.key && styles.sourceCardActive]}
            onPress={() => setSource(s.key)}
          >
            <Text style={[styles.sourceLabel, source === s.key && styles.sourceLabelActive]}>
              {s.label}
            </Text>
            <Text style={styles.sourceDesc}>{s.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Device ID input for ESP32 mode */}
      {source === 'esp32' && (
        <View style={styles.deviceIdSection}>
          <Text style={styles.sectionLabel}>Device ID</Text>
          <TextInput
            style={styles.input}
            value={deviceId}
            onChangeText={setDeviceId}
            placeholder="esp32_001"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      )}

      {/* Live Tilt Preview */}
      <Text style={styles.sectionLabel}>Live Tilt Preview</Text>
      <View style={styles.previewContainer}>
        <View style={styles.previewCircle}>
          {/* Cross-hair lines */}
          <View style={styles.crossHairH} />
          <View style={styles.crossHairV} />
          {/* Tilt dot */}
          <View
            style={[
              styles.previewDot,
              {
                transform: [{ translateX: dotX }, { translateY: dotY }],
              },
            ]}
          />
        </View>
        <View style={styles.tiltValues}>
          <Text style={styles.tiltText}>
            Pitch: {tilt.pitch.toFixed(2)}
          </Text>
          <Text style={styles.tiltText}>
            Roll: {tilt.roll.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Dev: Seed Mazes */}
      <TouchableOpacity
        style={styles.seedButton}
        onPress={async () => {
          setSeedStatus('Seeding...');
          try {
            const results = await seedMazes();
            setSeedStatus(results.join('\n'));
          } catch (e: any) {
            setSeedStatus('Error: ' + e.message);
          }
        }}
      >
        <Text style={styles.seedButtonText}>Seed Mazes to Firestore</Text>
      </TouchableOpacity>
      {seedStatus ? <Text style={styles.seedStatus}>{seedStatus}</Text> : null}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 16,
  },
  sourceList: {
    gap: 10,
  },
  sourceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  sourceCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#1e1030',
  },
  sourceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sourceLabelActive: {
    color: colors.primary,
  },
  sourceDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deviceIdSection: {
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  previewContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  previewCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#2a2a4a',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  crossHairH: {
    position: 'absolute',
    width: '80%',
    height: 1,
    backgroundColor: '#2a2a4a',
  },
  crossHairV: {
    position: 'absolute',
    width: 1,
    height: '80%',
    backgroundColor: '#2a2a4a',
  },
  previewDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  tiltValues: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
  },
  tiltText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  backBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  seedButton: {
    backgroundColor: '#1a3a1a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  seedButtonText: {
    color: '#66cc66',
    fontSize: 14,
    fontWeight: '600',
  },
  seedStatus: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
