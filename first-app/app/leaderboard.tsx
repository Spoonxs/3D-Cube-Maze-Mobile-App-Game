// app/leaderboard.tsx — Leaderboard Screen
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getLeaderboard } from '../lib/firestore';
import { colors } from '../constants/colors';

const MAZE_IDS = [
  { id: 'maze_11', label: '11x11' },
  { id: 'maze_15', label: '15x15' },
  { id: 'maze_21', label: '21x21' },
  { id: 'maze_25', label: '25x25' },
  { id: 'maze_31', label: '31x31' },
];

interface ScoreEntry {
  id: string;
  name?: string;
  time?: number;
  date?: string;
  deviceType?: string;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const [selectedMaze, setSelectedMaze] = useState(MAZE_IDS[1].id);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getLeaderboard(selectedMaze, 20)
      .then((data) => {
        if (!cancelled) {
          setScores(data as ScoreEntry[]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMaze]);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = (t % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LEADERBOARD</Text>

      {/* Maze selector tabs */}
      <View style={styles.tabs}>
        {MAZE_IDS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.tab, selectedMaze === m.id && styles.tabActive]}
            onPress={() => setSelectedMaze(m.id)}
          >
            <Text
              style={[
                styles.tabText,
                selectedMaze === m.id && styles.tabTextActive,
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scores list */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : scores.length === 0 ? (
        <Text style={styles.emptyText}>No scores yet. Be the first!</Text>
      ) : (
        <FlatList
          data={scores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
            const isTop3 = index < 3;
            return (
              <View
                style={[
                  styles.scoreRow,
                  isTop3 && { borderColor: medalColors[index] },
                ]}
              >
                <Text
                  style={[
                    styles.rank,
                    isTop3 && { color: medalColors[index] },
                  ]}
                >
                  #{index + 1}
                </Text>
                <Text style={styles.playerName}>{item.name || 'Anonymous'}</Text>
                <Text style={styles.scoreTime}>
                  {formatTime(item.time ?? 0)}
                </Text>
              </View>
            );
          }}
        />
      )}

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
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.text,
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  listContent: {
    gap: 8,
    paddingBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  rank: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
    width: 40,
  },
  playerName: {
    color: colors.text,
    fontSize: 16,
    flex: 1,
  },
  scoreTime: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
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
