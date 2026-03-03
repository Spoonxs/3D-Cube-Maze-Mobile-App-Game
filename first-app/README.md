# Cube Tilt Maze (Expo + Three.js)

A 3D marble maze where the maze wraps a perfect cube. Each of the six faces has its own maze grid, and the marble starts on the **top** face and must travel across all six sides before finishing on a side face.

## Features

- Matrix-based cube face transforms (`u`, `v`, `normal`) for movement and rendering
- A maze on each of the 6 cube faces
- Edge-to-edge face transitions using rotation matrices
- Start on `top`, end on `right`
- Win requires visiting all 6 faces
- Tilt-driven marble movement with camera orbit + pinch zoom

## Project Structure

- `lib/cubeFaces.ts`: Face matrices, local/world transforms, edge/adjacency helpers
- `lib/mazeGenerator.ts`: Perfect maze generation + `createCubeMaze()`
- `lib/physics.ts`: Cube-surface physics, transitions, win condition
- `components/MazeBuilder.ts`: Cube platform, six-face floors/walls, zones
- `components/MazeScene.tsx`: Three.js scene and render loop
- `app/game.tsx`: Game screen + HUD

## Run

```bash
npm install
npx expo start --clear
```

## Gameplay Notes

- Touch drag: orbit camera
- Pinch: zoom camera
- Tilt device: move marble
- You must route through all six faces before the goal counts as a win

## Dev Checks

```bash
npm run lint
npx tsc --noEmit
```
