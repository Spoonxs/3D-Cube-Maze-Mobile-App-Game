Original prompt: adjust the code to make the maze be a cube using matrices it should a perfect square cube and a maze on each of the six sides. It should have a start point that starts on the top and ends on one of the sides making the marble travel between all 6 sides making it to the end. Please adjust this code to make it work and look at the md files and update instructions

## Progress Log
- Initialized workspace review and identified current maze implementation is a single top-face maze only.
- Confirmed key files for update: `lib/mazeGenerator.ts`, `lib/physics.ts`, `components/MazeBuilder.ts`, `components/MazeScene.tsx`, `app/game.tsx`, and markdown docs.
- Added `lib/cubeFaces.ts` with matrix-based frame definitions for all six cube faces, local/world transforms, edge direction helpers, and face adjacency mapping.
- Extended `lib/mazeGenerator.ts` with `createCubeMaze()` that builds six perfect mazes, opens paired edge gates along a fixed 6-face route, and sets start on `top` / end on `right`.
- Replaced planar physics in `lib/physics.ts` with cube-surface physics including matrix-rotated edge transitions, per-face collision checks, and win requirement that all 6 faces are visited.
- Rebuilt `components/MazeBuilder.ts` for six-face rendering: cube platform, all-face floors, merged wall geometry, and face-aware start/end zones.
- Reworked `components/MazeScene.tsx` and `app/game.tsx` to use cube maze data, face-aware ball positioning, and HUD progress (`Faces visited/current face`).
- Verification run: `npm run lint` (pass with one pre-existing warning in `app/win.tsx`) and `npx tsc --noEmit` (pass).
- Updated `README.md` and `CLAUDE.md` instructions to describe six-face cube architecture, matrix-based transforms, and all-face traversal win condition.
- Final verification run after orientation/gate fixes: `npm run lint` (same pre-existing warning only) and `npx tsc --noEmit` (pass).
- Fixed broken wall rendering artifacts (stacked triangles/gaps) in `components/MazeBuilder.ts` by converting wall template box geometry to **non-indexed** before manual vertex baking.
- Post-fix verification: `npm run lint` (same pre-existing warning only) and `npx tsc --noEmit` (pass).
- Seam/artifact polish: corrected wall transform basis to a right-handed frame in `components/MazeBuilder.ts` to prevent flipped winding/backface culling artifacts on cube faces.
- Verification after polish: `npm run lint` (same pre-existing warning only) and `npx tsc --noEmit` (pass).
- Replaced custom baked wall triangle assembly with `THREE.InstancedMesh` box walls in `components/MazeBuilder.ts`, using true rectangular box geometry per wall cell.
- Added tiny wall span overlap (`CELL_SIZE + 0.01`) to reduce visible cracks between adjacent wall blocks.
- Verification after instanced-wall rewrite: `npm run lint` (same pre-existing warning only) and `npx tsc --noEmit` (pass).
- Wall visibility pass:
  - Updated scene palette for stronger contrast (`constants/colors.ts`): brighter walls, darker floor/platform/background.
  - Enabled `flatShading` on wall/floor/platform materials in `components/MazeBuilder.ts` to emphasize hard rectangular edges.
  - Removed wall overlap and returned wall boxes to exact `CELL_SIZE` spans to avoid seam shimmer.
- Camera control pass for full-cube orbit:
  - Expanded orbit phi bounds in `lib/constants.ts` to near `[0, π]` so camera can inspect all 6 faces, including underside.
  - Expanded zoom range and adjusted scene lighting in `components/MazeScene.tsx` for readability across all viewpoints.
- Verification after visibility + camera updates: `npm run lint` (same pre-existing warning only) and `npx tsc --noEmit` (pass).
- Gravity/control fix across side faces:
  - Updated `lib/physics.ts` so tilt-control axes are stored in `BallState` (`controlXWorld`, `controlYWorld`) and rotated during face transitions.
  - Replaced fixed-plane gravity mapping with control-axis projection, so pitch/roll continue to produce acceleration on all cube faces, not just top.
- Verification after gravity patch: `npm run lint` (same pre-existing warning only) and `npx tsc --noEmit` (pass).
- Tilt-direction consistency update:
  - Simplified `lib/physics.ts` gravity mapping to be face-local every frame (`gravityWorld = face.u * roll + face.v * -pitch`).
  - Removed transition-rotated persistent control axes from `BallState`; controls now consistently map to current-face left/right/up/down.
- Verification after face-local tilt mapping: `npm run lint` (same pre-existing warning only) and `npx tsc --noEmit` (pass).
- Camera control/orientation update for full-side navigation:
  - Updated `components/MazeScene.tsx` two-finger gesture to support combined pinch-zoom + orbit drag (centroid-based), so all cube sides are easier to reach.
  - Added dominant-face-based camera up-vector alignment while orbiting to keep side views in a stable/correct orientation.
- Verification after camera gesture/orientation changes: `npm run lint` (same pre-existing warning only) and `npx tsc --noEmit` (pass).

## TODO
- Manual gameplay pass in Expo client to tune transition feel and gravity scaling on each face.
- Control tuning pass for mobile input:
  - Flipped phone tilt up/down axis in `hooks/useTiltData.ts` (both `useTiltData` and `useTiltRef`) by inverting accelerometer `data.y` mapping.
  - Improved one-finger camera pan in `components/MazeScene.tsx` with higher drag sensitivity and release inertia to allow full-side flick navigation more easily.
  - Added pan-end reset handling for both release and responder terminate paths.
- Verification after mobile-control updates:
  - `npx tsc --noEmit` (pass).
  - `npm run lint` (pass with one pre-existing warning in `app/win.tsx` about unused `error`).
