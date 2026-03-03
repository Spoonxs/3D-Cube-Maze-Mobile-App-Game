// app/(tabs)/esp32.tsx — ESP32 LED/Sensor Controller
import { onValue, ref, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { rtdb } from '../../lib/firebase';
import { colors } from '../../constants/colors';

export default function ESP32Screen() {
  const [ledOn, setLedOn] = useState(false);
  const [sensorValue, setSensorValue] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ledRef = ref(rtdb, '/device/led');
    const unsubscribeLed = onValue(ledRef, (snapshot) => {
      const value = snapshot.val();
      setLedOn(value === true || value === 1);
      setConnected(true);
    }, (error) => {
      console.error('LED error:', error);
      Alert.alert('Error', 'Failed to connect');
    });

    const sensorRef = ref(rtdb, '/device/sensor');
    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const value = snapshot.val();
      if (value !== null) setSensorValue(value);
    });

    return () => {
      unsubscribeLed();
      unsubscribeSensor();
    };
  }, []);

  const toggleLed = async () => {
    try {
      const ledRef = ref(rtdb, '/device/led');
      await set(ledRef, !ledOn);
    } catch {
      Alert.alert('Error', 'Failed to toggle LED');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ESP32 Controller</Text>

      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: connected ? '#22c55e' : '#ef4444' }]} />
        <Text style={styles.statusText}>{connected ? 'Connected' : 'Connecting...'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>LED Control</Text>
        <TouchableOpacity
          style={[styles.ledButton, { backgroundColor: ledOn ? colors.accent : '#374151' }]}
          onPress={toggleLed}
        >
          <Text style={styles.ledText}>{ledOn ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sensor Reading</Text>
        <Text style={styles.sensorValue}>{sensorValue !== null ? sensorValue : '---'}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((sensorValue || 0) / 4095) * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: colors.text,
  },
  ledButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  sensorValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#2a2a4a',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});
