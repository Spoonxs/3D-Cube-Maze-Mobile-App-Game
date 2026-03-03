/**
 * Seed preset mazes into Firestore.
 * Run once: npx ts-node scripts/seedMazes.ts
 *
 * Or import and call from the app for dev convenience.
 */

import { doc, setDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { generateMaze } from '../lib/mazeGenerator';

const PRESET_MAZES = [
  { id: 'maze_11', name: 'Beginner', difficulty: 1, size: 11, seed: 42 },
  { id: 'maze_15', name: 'Easy', difficulty: 2, size: 15, seed: 123 },
  { id: 'maze_21', name: 'Medium', difficulty: 3, size: 21, seed: 456 },
  { id: 'maze_25', name: 'Hard', difficulty: 4, size: 25, seed: 789 },
  { id: 'maze_31', name: 'Expert', difficulty: 5, size: 31, seed: 1337 },
];

export async function seedMazes() {
  const results: string[] = [];

  for (const m of PRESET_MAZES) {
    const grid = generateMaze(m.size, m.size, m.seed);
    const actualWidth = grid[0].length;
    const actualHeight = grid.length;

    await setDoc(doc(firestore, 'mazes', m.id), {
      name: m.name,
      difficulty: m.difficulty,
      width: actualWidth,
      height: actualHeight,
      grid,
      start: { x: 1, y: 1 },
      end: { x: actualWidth - 2, y: actualHeight - 2 },
      seed: m.seed,
    });

    results.push(`Seeded ${m.id} (${m.name} ${actualWidth}x${actualHeight})`);
  }

  return results;
}

// Allow running as a script
if (typeof require !== 'undefined' && require.main === module) {
  seedMazes()
    .then((r) => r.forEach((msg) => console.log(msg)))
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
