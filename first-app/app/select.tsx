// app/select.tsx — Maze Selection Screen
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../constants/colors';

const MAZES = [
  { name: 'Beginner', size: 11, difficulty: 1, seed: 42 },
  { name: 'Easy', size: 15, difficulty: 2, seed: 123 },
  { name: 'Medium', size: 21, difficulty: 3, seed: 456 },
  { name: 'Hard', size: 25, difficulty: 4, seed: 789 },
  { name: 'Expert', size: 31, difficulty: 5, seed: 1337 },
];

const DIFFICULTY_COLORS = ['#00ff88', '#88ee44', '#ffd700', '#ff8844', '#e94560'];

function DifficultyDots({ level }: { level: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                i < level ? DIFFICULTY_COLORS[level - 1] : '#1a1a2e',
              borderColor:
                i < level ? DIFFICULTY_COLORS[level - 1] : '#2a2a4a',
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function SelectScreen() {
  const router = useRouter();

  const playMaze = (size: number, seed: number) => {
    router.push({
      pathname: '/game' as any,
      params: { size: size.toString(), seed: seed.toString() },
    });
  };

  const playRandom = () => {
    const sizes = [15, 21, 25];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const seed = Math.floor(Math.random() * 100000);
    router.push({
      pathname: '/game' as any,
      params: { size: size.toString(), seed: seed.toString() },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SELECT MAZE</Text>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {MAZES.map((maze) => (
          <TouchableOpacity
            key={maze.name}
            style={styles.mazeCard}
            onPress={() => playMaze(maze.size, maze.seed)}
          >
            <View style={styles.mazeInfo}>
              <Text style={styles.mazeName}>{maze.name}</Text>
              <Text style={styles.mazeSize}>{maze.size}x{maze.size}</Text>
            </View>
            <DifficultyDots level={maze.difficulty} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.randomButton} onPress={playRandom}>
          <Text style={styles.randomButtonText}>Random Maze</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 24,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 20,
  },
  mazeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  mazeInfo: {
    gap: 4,
  },
  mazeName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  mazeSize: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  randomButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  randomButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  backBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
