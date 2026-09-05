import * as THREE from 'three/webgpu';
import React, { useMemo } from 'react';
import type { CubeColor, FaceId } from '../../../shared/types';
import { facesOfCubie, gridToWorld, type GridPos } from '../lib/cubeGeometry';
import type { CubeSize } from '../../../shared/types';

export const STICKER_COLOR_HEX: Record<CubeColor, string> = {
  white: '#F5F5F0',
  yellow: '#FFD400',
  red: '#FF2D3A',
  orange: '#FF7A1A',
  blue: '#1E6BFF',
  green: '#17C964',
};

// 白いプラスチックボディ+光沢のあるステッカーで「ポップ」な見た目にする
// (黒いボディだと地味に見える、というフィードバックを反映)。
export const BASE_PLASTIC_COLOR = '#F2F2F5';
const STICKER_INSET = 0.86;
const STICKER_OFFSET = 0.006;

interface Props {
  gridPos: GridPos;
  size: CubeSize;
  colors: Partial<Record<FaceId, CubeColor>>;
  onStickerRef?: (face: FaceId, mesh: THREE.Mesh | null) => void;
  groupRef?: (group: THREE.Group | null) => void;
}

const FACE_ROTATIONS: Record<FaceId, [number, number, number]> = {
  U: [-Math.PI / 2, 0, 0],
  D: [Math.PI / 2, 0, 0],
  F: [0, 0, 0],
  B: [0, Math.PI, 0],
  R: [0, Math.PI / 2, 0],
  L: [0, -Math.PI / 2, 0],
};

function facePosition(face: FaceId): [number, number, number] {
  const half = 0.5 + STICKER_OFFSET;
  switch (face) {
    case 'U': return [0, half, 0];
    case 'D': return [0, -half, 0];
    case 'F': return [0, 0, half];
    case 'B': return [0, 0, -half];
    case 'R': return [half, 0, 0];
    case 'L': return [-half, 0, 0];
  }
}

export function CubieMesh({ gridPos, size, colors, onStickerRef, groupRef }: Props) {
  const worldPos = useMemo(() => gridToWorld(gridPos, size), [gridPos, size]);
  const faces = useMemo(() => facesOfCubie(gridPos, size), [gridPos, size]);

  return (
    <group position={worldPos} ref={groupRef} userData={{ gridPos }}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={BASE_PLASTIC_COLOR} roughness={0.55} metalness={0.05} />
      </mesh>
      {faces.map((face) => (
        <mesh
          key={face}
          position={facePosition(face)}
          rotation={FACE_ROTATIONS[face]}
          userData={{ faceId: face, gridPos }}
          ref={(m) => onStickerRef?.(face, m)}
        >
          <planeGeometry args={[STICKER_INSET, STICKER_INSET]} />
          <meshStandardMaterial
            color={colors[face] ? STICKER_COLOR_HEX[colors[face]!] : BASE_PLASTIC_COLOR}
            roughness={0.25}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}
