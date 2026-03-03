/**
 * MazeScene — The core 3D game view.
 * Renders a cube maze with mazes on all six faces.
 * Ball movement is driven by accelerometer/tilt and transitions between faces.
 */

import React, { useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

import { buildWallMesh, buildFloor, buildZone, buildBall, buildPlatform } from './MazeBuilder';
import { BallState, createBallState, updateBall, checkWin } from '../lib/physics';
import {
  BALL_RADIUS,
  CELL_SIZE,
  CAMERA_MIN_PHI,
  CAMERA_MAX_PHI,
  CAMERA_ORBIT_SPEED,
  CAMERA_MIN_ZOOM,
  CAMERA_MAX_ZOOM,
} from '../lib/constants';
import { colors } from '../constants/colors';
import { TiltData } from '../hooks/useTiltData';
import { CubeMazeData } from '../lib/mazeGenerator';
import { FaceId, getFaceFrame, localToWorld, localVelocityToWorld, vectorToFaceId } from '../lib/cubeFaces';

interface MazeSceneProps {
  maze: CubeMazeData;
  tiltRef: React.MutableRefObject<TiltData>;
  onWin: () => void;
  paused?: boolean;
  onFirstMove?: () => void;
  onProgress?: (visitedFaces: number, currentFace: FaceId) => void;
}

function getTouchDistance(evt: GestureResponderEvent): number {
  const touches = evt.nativeEvent.touches;
  if (touches.length < 2) return 0;
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(evt: GestureResponderEvent): { x: number; y: number } | null {
  const touches = evt.nativeEvent.touches;
  if (touches.length < 2) return null;
  return {
    x: (touches[0].pageX + touches[1].pageX) / 2,
    y: (touches[0].pageY + touches[1].pageY) / 2,
  };
}

const SINGLE_FINGER_ORBIT_MULTIPLIER = 1.65;
const ORBIT_INERTIA_DECAY = 0.9;
const ORBIT_INERTIA_EPSILON = 0.00005;

export default function MazeScene({
  maze,
  tiltRef,
  onWin,
  paused,
  onFirstMove,
  onProgress,
}: MazeSceneProps) {
  const ballStateRef = useRef<BallState | null>(null);
  const hasMovedRef = useRef(false);
  const winCalledRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const progressRef = useRef<{ visited: number; face: FaceId | null }>({ visited: 0, face: null });

  // Camera orbit state
  const thetaRef = useRef(Math.PI * 0.75);
  const phiRef = useRef(1.0);
  const lastDxRef = useRef(0);
  const lastDyRef = useRef(0);
  const isTouchActiveRef = useRef(false);
  const orbitInertiaRef = useRef({ theta: 0, phi: 0 });

  // Pinch zoom state
  const zoomRef = useRef(1.0);
  const lastPinchDistRef = useRef(0);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);

  const applyOrbitDelta = useCallback((deltaTheta: number, deltaPhi: number) => {
    thetaRef.current += deltaTheta;
    phiRef.current = Math.max(
      CAMERA_MIN_PHI,
      Math.min(CAMERA_MAX_PHI, phiRef.current + deltaPhi)
    );
  }, []);

  const handlePanEnd = useCallback(
    (_evt: GestureResponderEvent, _gestureState: PanResponderGestureState) => {
    isTouchActiveRef.current = false;
    lastDxRef.current = 0;
    lastDyRef.current = 0;
    lastPinchDistRef.current = 0;
    lastPinchCenterRef.current = null;
    },
    []
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isTouchActiveRef.current = true;
        lastDxRef.current = 0;
        lastDyRef.current = 0;
        orbitInertiaRef.current.theta = 0;
        orbitInertiaRef.current.phi = 0;
        if (evt.nativeEvent.touches.length >= 2) {
          lastPinchDistRef.current = getTouchDistance(evt);
          lastPinchCenterRef.current = getTouchCenter(evt);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.numberActiveTouches >= 2) {
          const dist = getTouchDistance(evt);
          const center = getTouchCenter(evt);

          if (lastPinchDistRef.current > 0 && dist > 0) {
            const scale = lastPinchDistRef.current / dist;
            zoomRef.current = Math.max(
              CAMERA_MIN_ZOOM,
              Math.min(CAMERA_MAX_ZOOM, zoomRef.current * scale)
            );
          }

          // Two-finger drag also orbits the camera for easier full-cube navigation.
          if (center && lastPinchCenterRef.current) {
            const ddx = center.x - lastPinchCenterRef.current.x;
            const ddy = center.y - lastPinchCenterRef.current.y;

            applyOrbitDelta(-ddx * CAMERA_ORBIT_SPEED, ddy * CAMERA_ORBIT_SPEED);
          }

          lastPinchDistRef.current = dist;
          lastPinchCenterRef.current = center;
          orbitInertiaRef.current.theta = 0;
          orbitInertiaRef.current.phi = 0;
        } else {
          const ddx = gestureState.dx - lastDxRef.current;
          const ddy = gestureState.dy - lastDyRef.current;
          lastDxRef.current = gestureState.dx;
          lastDyRef.current = gestureState.dy;
          const deltaTheta = -ddx * CAMERA_ORBIT_SPEED * SINGLE_FINGER_ORBIT_MULTIPLIER;
          const deltaPhi = ddy * CAMERA_ORBIT_SPEED * SINGLE_FINGER_ORBIT_MULTIPLIER;

          applyOrbitDelta(deltaTheta, deltaPhi);
          orbitInertiaRef.current.theta = deltaTheta;
          orbitInertiaRef.current.phi = deltaPhi;
          lastPinchDistRef.current = 0;
          lastPinchCenterRef.current = null;
        }
      },
      onPanResponderRelease: handlePanEnd,
      onPanResponderTerminate: handlePanEnd,
    })
  ).current;

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(colors.sceneBg);

      const scene = new THREE.Scene();

      const cubeSide = maze.size * CELL_SIZE;
      const maxDim = cubeSide;
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, maxDim * 8);

      const orbitTarget = new THREE.Vector3(0, 0, 0);
      const baseOrbitRadius = maxDim * 2.1;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
      keyLight.position.set(-cubeSide * 0.9, cubeSide * 1.2, -cubeSide * 0.6);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
      fillLight.position.set(cubeSide * 0.8, -cubeSide * 1.1, cubeSide * 0.9);
      scene.add(fillLight);

      const platform = buildPlatform(maze.size);
      scene.add(platform);

      const floors = buildFloor(maze);
      scene.add(floors);

      const walls = buildWallMesh(maze);
      scene.add(walls);

      const startZone = buildZone(maze.start.face, maze.start.x, maze.start.y, maze.size, colors.startZone);
      scene.add(startZone);

      const endZone = buildZone(maze.end.face, maze.end.x, maze.end.y, maze.size, colors.endZone);
      scene.add(endZone);

      const ballRadius = BALL_RADIUS * CELL_SIZE;
      const ballMesh = buildBall(ballRadius);
      scene.add(ballMesh);

      const ball = createBallState(maze.start.face, maze.start.x, maze.start.y, BALL_RADIUS);
      ballStateRef.current = ball;

      const startFrame = getFaceFrame(ball.face);
      const startPos = localToWorld(ball.face, ball.x, ball.y, maze.size, CELL_SIZE)
        .add(startFrame.n.clone().multiplyScalar(ballRadius));
      ballMesh.position.copy(startPos);

      progressRef.current = { visited: ball.visitedCount, face: ball.face };
      onProgress?.(ball.visitedCount, ball.face);

      let lastTime = Date.now();
      hasMovedRef.current = false;
      winCalledRef.current = false;

      const animate = () => {
        animFrameRef.current = requestAnimationFrame(animate);

        if (!isTouchActiveRef.current) {
          const inertia = orbitInertiaRef.current;
          if (
            Math.abs(inertia.theta) > ORBIT_INERTIA_EPSILON ||
            Math.abs(inertia.phi) > ORBIT_INERTIA_EPSILON
          ) {
            applyOrbitDelta(inertia.theta, inertia.phi);
            inertia.theta *= ORBIT_INERTIA_DECAY;
            inertia.phi *= ORBIT_INERTIA_DECAY;
          } else {
            inertia.theta = 0;
            inertia.phi = 0;
          }
        }

        const theta = thetaRef.current;
        const phi = phiRef.current;
        const r = baseOrbitRadius * zoomRef.current;
        camera.position.set(
          orbitTarget.x + r * Math.sin(phi) * Math.cos(theta),
          orbitTarget.y + r * Math.cos(phi),
          orbitTarget.z + r * Math.sin(phi) * Math.sin(theta)
        );
        const viewDir = camera.position.clone().sub(orbitTarget).normalize();
        const dominantFace = vectorToFaceId(viewDir);
        if (dominantFace) {
          const upTarget = getFaceFrame(dominantFace).v.clone().normalize();
          camera.up.lerp(upTarget, 0.2).normalize();
        }
        camera.lookAt(orbitTarget);

        if (paused) {
          renderer.render(scene, camera);
          gl.endFrameEXP();
          return;
        }

        const now = Date.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        const { pitch, roll } = tiltRef.current;

        if (!hasMovedRef.current && (Math.abs(pitch) > 0.05 || Math.abs(roll) > 0.05)) {
          hasMovedRef.current = true;
          onFirstMove?.();
        }

        updateBall(ball, pitch, roll, maze, dt);

        const frame = getFaceFrame(ball.face);
        const worldPos = localToWorld(ball.face, ball.x, ball.y, maze.size, CELL_SIZE)
          .add(frame.n.clone().multiplyScalar(ballRadius));
        ballMesh.position.copy(worldPos);

        const velWorld = localVelocityToWorld(ball.face, ball.vx, ball.vy);
        const speed = velWorld.length();
        if (speed > 0.001) {
          const spinAxis = frame.n.clone().cross(velWorld).normalize();
          const spinAngle = (speed * dt) / Math.max(BALL_RADIUS, 0.001);
          ballMesh.rotateOnWorldAxis(spinAxis, spinAngle);
        }

        if (
          ball.visitedCount !== progressRef.current.visited ||
          ball.face !== progressRef.current.face
        ) {
          progressRef.current = { visited: ball.visitedCount, face: ball.face };
          onProgress?.(ball.visitedCount, ball.face);
        }

        if (!winCalledRef.current && checkWin(ball, maze)) {
          winCalledRef.current = true;
          onWin();
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      animate();
    },
    [maze, tiltRef, onWin, paused, onFirstMove, onProgress, applyOrbitDelta]
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
        msaaSamples={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glView: {
    flex: 1,
  },
});
