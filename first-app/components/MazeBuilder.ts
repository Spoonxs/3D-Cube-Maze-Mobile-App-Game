/**
 * Builds cube-maze geometry for all six faces.
 */

import * as THREE from 'three';
import { colors } from '../constants/colors';
import { WALL_HEIGHT, CELL_SIZE } from '../lib/constants';
import { CubeMazeData } from '../lib/mazeGenerator';
import { FaceId, getFaceFrame, localToWorld } from '../lib/cubeFaces';

const FACE_IDS: FaceId[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];

function makeWallBasis(face: FaceId): { xAxis: THREE.Vector3; yAxis: THREE.Vector3; zAxis: THREE.Vector3 } {
  const frame = getFaceFrame(face);
  return {
    xAxis: frame.u.clone(),
    // Keep a right-handed basis (x × y = z) to avoid flipped winding/culling artifacts.
    yAxis: frame.v.clone(),
    zAxis: frame.n.clone(),
  };
}

function buildFaceTransform(face: FaceId): THREE.Matrix4 {
  const frame = getFaceFrame(face);
  const xAxis = frame.u.clone();
  const yAxis = frame.v.clone();
  const zAxis = frame.n.clone();
  return new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
}

export function buildFloor(maze: CubeMazeData): THREE.Group {
  const group = new THREE.Group();
  const sideLength = maze.size * CELL_SIZE;
  const floorGeo = new THREE.PlaneGeometry(sideLength, sideLength);
  const floorMat = new THREE.MeshStandardMaterial({
    color: colors.floorColor,
    roughness: 0.98,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
  });

  FACE_IDS.forEach((face) => {
    const mesh = new THREE.Mesh(floorGeo, floorMat);
    const frame = getFaceFrame(face);
    const basis = buildFaceTransform(face);
    mesh.quaternion.setFromRotationMatrix(basis);
    mesh.position.copy(frame.n.clone().multiplyScalar(sideLength / 2 + 0.004));
    group.add(mesh);
  });

  return group;
}

export function buildPlatform(size: number): THREE.Mesh {
  const sideLength = size * CELL_SIZE;
  const geo = new THREE.BoxGeometry(sideLength, sideLength, sideLength);
  const mat = new THREE.MeshStandardMaterial({
    color: colors.platformSide,
    roughness: 1,
    metalness: 0,
    flatShading: true,
  });
  return new THREE.Mesh(geo, mat);
}

/**
 * Creates wall cubes as instances to avoid custom triangle assembly artifacts.
 */
export function buildWallMesh(maze: CubeMazeData): THREE.InstancedMesh {
  let wallCount = 0;
  FACE_IDS.forEach((face) => {
    const grid = maze.faces[face];
    for (let y = 0; y < maze.size; y++) {
      for (let x = 0; x < maze.size; x++) {
        if (grid[y][x] === 1) wallCount++;
      }
    }
  });

  const wallGeo = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, WALL_HEIGHT);
  const wallMat = new THREE.MeshStandardMaterial({
    color: colors.wallColor,
    roughness: 0.7,
    metalness: 0,
    flatShading: true,
  });

  const mesh = new THREE.InstancedMesh(wallGeo, wallMat, wallCount);

  const basis = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3(1, 1, 1);

  let instanceId = 0;
  FACE_IDS.forEach((face) => {
    const grid = maze.faces[face];
    const { xAxis, yAxis, zAxis } = makeWallBasis(face);
    basis.makeBasis(xAxis, yAxis, zAxis);
    quat.setFromRotationMatrix(basis);

    for (let y = 0; y < maze.size; y++) {
      for (let x = 0; x < maze.size; x++) {
        if (grid[y][x] !== 1) continue;

        const surfaceCenter = localToWorld(face, x + 0.5, y + 0.5, maze.size, CELL_SIZE);
        const wallCenter = surfaceCenter.clone().add(zAxis.clone().multiplyScalar(WALL_HEIGHT / 2));

        matrix.compose(wallCenter, quat, scale);
        mesh.setMatrixAt(instanceId, matrix);
        instanceId += 1;
      }
    }
  });

  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

export function buildZone(face: FaceId, cellX: number, cellY: number, size: number, color: string): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(CELL_SIZE * 0.7, CELL_SIZE * 0.7);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });

  const zone = new THREE.Mesh(geo, mat);
  const basis = buildFaceTransform(face);
  const frame = getFaceFrame(face);
  zone.quaternion.setFromRotationMatrix(basis);
  zone.position.copy(
    localToWorld(face, cellX + 0.5, cellY + 0.5, size, CELL_SIZE).add(frame.n.clone().multiplyScalar(0.01))
  );
  return zone;
}

export function buildBall(radius: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 16, 16);
  const mat = new THREE.MeshStandardMaterial({
    color: colors.ballColor,
    metalness: 0.2,
    roughness: 0.35,
  });
  return new THREE.Mesh(geo, mat);
}
