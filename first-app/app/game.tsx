// app/game.tsx — Main 3D Game Screen
import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import MazeScene from '../components/MazeScene';
import { useTiltRef } from '../hooks/useTiltData';
import { createCubeMaze, CubeMazeData } from '../lib/mazeGenerator';
import { FaceId } from '../lib/cubeFaces';
import { colors } from '../constants/colors';

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ size?: string; seed?: string }>();

  const mazeSize = parseInt(params.size || '15', 10);
  const mazeSeed = params.seed ? parseInt(params.seed, 10) : undefined;

  // Generate maze once
  const maze = useMemo<CubeMazeData>(
    () => createCubeMaze(mazeSize, mazeSeed),
    [mazeSize, mazeSeed]
  );

  // Tilt input — ref-based for render loop performance
  const tiltRef = useTiltRef('phone');

  // Timer state
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);

  // Pause overlay animation
  const pauseAnim = useRef(new Animated.Value(0)).current;
  const [visitedFaces, setVisitedFaces] = useState(1);
  const [currentFace, setCurrentFace] = useState<FaceId>('top');

  useEffect(() => {
    Animated.timing(pauseAnim, {
      toValue: paused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [paused, pauseAnim]);

  const startTimer = useCallback(() => {
    if (timerRef.current) return; // already running
    startTimeRef.current = Date.now();
    elapsedBeforePauseRef.current = 0;
    timerRef.current = setInterval(() => {
      setElapsed(elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current) / 1000);
    }, 67); // ~15fps UI update for timer display
  }, []);

  const onFirstMove = useCallback(() => {
    startTimer();
  }, [startTimer]);

  const onWin = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const finalTime = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current) / 1000;
    router.replace({
      pathname: '/win' as any,
      params: { time: finalTime.toFixed(2), mazeSize: mazeSize.toString() },
    });
  }, [router, mazeSize]);

  const togglePause = useCallback(() => {
    setPaused((prev) => {
      if (!prev) {
        // Pausing — save elapsed so far and stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          elapsedBeforePauseRef.current += (Date.now() - startTimeRef.current) / 1000;
        }
      } else {
        // Resuming — restart timer from now
        if (elapsedBeforePauseRef.current > 0 || startTimeRef.current > 0) {
          startTimeRef.current = Date.now();
          timerRef.current = setInterval(() => {
            setElapsed(elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current) / 1000);
          }, 67);
        }
      }
      return !prev;
    });
  }, []);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = (t % 60).toFixed(1);
    return mins > 0 ? `${mins}:${secs.padStart(4, '0')}` : `${secs}s`;
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <MazeScene
        maze={maze}
        tiltRef={tiltRef}
        onWin={onWin}
        paused={paused}
        onFirstMove={onFirstMove}
        onProgress={(visited, face) => {
          setVisitedFaces(visited);
          setCurrentFace(face);
        }}
      />

      {/* Top HUD bar */}
      <View style={styles.hudBar}>
        <TouchableOpacity style={styles.hudButton} onPress={togglePause}>
          <Text style={styles.hudButtonText}>{paused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>

        <TouchableOpacity
          style={styles.hudButton}
          onPress={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            router.back();
          }}
        >
          <Text style={styles.exitText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Maze status indicator */}
      <View style={styles.mazeSizeTag}>
        <Text style={styles.mazeSizeText}>
          {mazeSize}×{mazeSize}  Faces {visitedFaces}/6  [{currentFace.toUpperCase()}]
        </Text>
      </View>

      {/* Animated paused overlay */}
      <Animated.View
        style={[
          styles.pausedOverlay,
          {
            opacity: pauseAnim,
            pointerEvents: paused ? 'auto' : 'none',
          },
        ]}
      >
        <Text style={styles.pausedTitle}>PAUSED</Text>
        <View style={styles.pauseActions}>
          <TouchableOpacity style={styles.pauseActionBtn} onPress={togglePause}>
            <Text style={styles.pauseActionText}>Resume</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pauseActionBtn, styles.pauseExitBtn]}
            onPress={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              router.back();
            }}
          >
            <Text style={[styles.pauseActionText, styles.pauseExitText]}>Exit</Text>
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
  hudBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudButton: {
    backgroundColor: 'rgba(10, 10, 15, 0.75)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(42, 42, 74, 0.5)',
  },
  hudButtonText: {
    color: colors.text,
    fontSize: 18,
  },
  exitText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  timerContainer: {
    backgroundColor: 'rgba(10, 10, 15, 0.75)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(42, 42, 74, 0.5)',
  },
  timerText: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  mazeSizeTag: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(10, 10, 15, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mazeSizeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pausedTitle: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 10,
    marginBottom: 40,
  },
  pauseActions: {
    gap: 16,
    width: 200,
  },
  pauseActionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pauseActionText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  pauseExitBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pauseExitText: {
    color: colors.primary,
  },
});
