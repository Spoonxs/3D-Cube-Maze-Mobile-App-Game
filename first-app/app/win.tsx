// app/win.tsx — Win/Completion Screen with confetti
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { submitScore } from '../lib/firestore';
import { colors } from '../constants/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CONFETTI_COUNT = 30;
const CONFETTI_COLORS = ['#e94560', '#ffd700', '#00ff88', '#4488ff', '#ff88ff', '#ff8844'];

function ConfettiPiece({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const startX = Math.random() * SCREEN_W;
  const drift = (Math.random() - 0.5) * 120;
  const size = 6 + Math.random() * 8;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const duration = 2500 + Math.random() * 1500;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      ).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [anim, delay, duration]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, SCREEN_H + 20],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, drift, drift * 0.5],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${360 + Math.random() * 360}deg`],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: -20,
        width: size,
        height: size * 1.5,
        backgroundColor: color,
        borderRadius: 2,
        transform: [{ translateY }, { translateX }, { rotate }],
        opacity,
      }}
    />
  );
}

export default function WinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ time: string; mazeSize: string }>();
  const time = parseFloat(params.time || '0');
  const mazeSize = params.mazeSize || '15';
  const mazeId = `maze_${mazeSize}`;

  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Entry animation
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleIn, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, scaleIn]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Enter a name', 'Please enter your name for the leaderboard.');
      return;
    }
    try {
      await submitScore(mazeId, name.trim(), time, 'phone');
      setSubmitted(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit score. Try again.');
    }
  };

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = (t % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`;
  };

  return (
    <View style={styles.container}>
      {/* Confetti layer */}
      <View style={styles.confettiLayer}>
        {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
          <ConfettiPiece key={i} delay={i * 80} />
        ))}
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeIn, transform: [{ scale: scaleIn }] },
        ]}
      >
        <Text style={styles.title}>MAZE COMPLETE!</Text>

        <View style={styles.timeCard}>
          <Text style={styles.timeLabel}>Your Time</Text>
          <Text style={styles.timeValue}>{formatTime(time)}</Text>
          <Text style={styles.mazeSizeLabel}>{mazeSize}×{mazeSize} maze</Text>
        </View>

        {!submitted ? (
          <View style={styles.submitSection}>
            <Text style={styles.label}>Enter your name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
              maxLength={20}
              autoFocus
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit Score</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.submittedBadge}>
            <Text style={styles.submittedText}>Score submitted!</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              router.replace({
                pathname: '/game' as any,
                params: { size: mazeSize },
              })
            }
          >
            <Text style={styles.actionButtonText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.menuButton]}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.actionButtonText}>Menu</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 4,
    marginBottom: 30,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  timeCard: {
    backgroundColor: colors.surface,
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  timeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  mazeSizeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  submitSection: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  submitButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  submittedBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    marginBottom: 30,
  },
  submittedText: {
    fontSize: 16,
    color: '#00ff88',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  menuButton: {
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
