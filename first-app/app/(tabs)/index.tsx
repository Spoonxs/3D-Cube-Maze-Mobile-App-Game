// app/(tabs)/index.tsx — Home Screen
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        <Text style={styles.title}>TILT</Text>
        <Text style={styles.titleAccent}>MAZE</Text>
        <Text style={styles.subtitle}>
          Tilt to navigate the ball through the maze
        </Text>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => router.push('/game' as any)}
        >
          <Text style={styles.playButtonText}>PLAY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/select' as any)}
        >
          <Text style={styles.secondaryButtonText}>Select Maze</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/leaderboard' as any)}
        >
          <Text style={styles.secondaryButtonText}>Leaderboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/settings' as any)}
        >
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 12,
  },
  titleAccent: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 12,
    marginTop: -10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  buttonSection: {
    width: '100%',
    maxWidth: 280,
    gap: 16,
  },
  playButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  playButtonText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
