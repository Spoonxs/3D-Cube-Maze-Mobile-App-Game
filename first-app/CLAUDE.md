# CLAUDE.md — Cube Tilt Maze App

## Quick Start
```bash
npx expo start --tunnel --clear
npm run lint
npx tsc --noEmit
```

## Current Game Design (Updated)

The game is now a **full cube maze**:

- The cube is a perfect square prism: side length = `maze.size * CELL_SIZE`
- Each of the six faces has its own perfect maze grid
- Start is on `top`
- End is on `right` (a side face)
- Winning requires the marble to have visited all 6 faces

Route backbone used for required traversal:

`top -> front -> bottom -> left -> back -> right`

## Architecture

### Core Modules

- `lib/cubeFaces.ts`
  - Face IDs and matrix frames (`u`, `v`, `n`)
  - Local<->world coordinate transforms
  - Edge direction and adjacency helpers
- `lib/mazeGenerator.ts`
  - Recursive-backtracker perfect maze generation
  - `createCubeMaze(size, seed)` for six-face maze data
- `lib/physics.ts`
  - Ball movement on active face
  - Edge transitions using matrix rotation
  - Collision checks per face
  - Win check with visited-face requirement
- `components/MazeBuilder.ts`
  - Cube platform mesh
  - Six face floor meshes
  - Merged wall mesh across all faces
  - Start/end zone meshes by face
- `components/MazeScene.tsx`
  - Three.js scene setup and render loop
  - Ball placement from face-local coords
  - HUD progress callback integration
- `app/game.tsx`
  - Game lifecycle, timer, pause/resume
  - Face-progress HUD (`Faces X/6`, current face)

## Rules and Constraints

- Keep movement/state updates in refs for render-loop performance
- Keep frame timing clamped (`MAX_DT`) to avoid post-resume jumps
- Do not return to single-face maze assumptions (`maze.grid`, planar-only coordinates)
- Any new pathing logic must preserve six-face traversal and matrix-based transitions
- Maintain odd maze dimensions for recursive-backtracker correctness

## Control Model

- **Touch**: camera orbit + zoom
- **Tilt**: gravity direction for marble acceleration
- Camera and tilt are separate input channels

## Verification

Minimum check before shipping behavior changes:

```bash
npm run lint
npx tsc --noEmit
```

If lint reports warnings in files not touched by your change, note them but do not block unrelated work.
