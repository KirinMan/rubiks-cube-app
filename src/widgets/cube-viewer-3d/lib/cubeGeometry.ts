// ルービックキューブの3D座標・回転に関する純粋な数学ロジック。
// レンダラー(three.js/@react-three/fiber)に依存しない部分だけを切り出している。
// 各面の回転角の符号は、実際にcube-logicのapplyMoveを実行して色の移動先を
// 機械的に照合し確定した値(前回セッションで実測検証済み)。
import type { CubeSize, FaceId } from '../../../shared/types';

export interface GridPos {
  x: number;
  y: number;
  z: number;
}

export const CUBIE_SIZE = 1;
export const CUBIE_GAP = 0.06;
export const CELL_SPACING = CUBIE_SIZE + CUBIE_GAP;

export interface AxisSpec {
  axis: 'x' | 'y' | 'z';
  sign: 1 | -1;
}

const TURN_ANGLE_SIGN: Record<FaceId, 1 | -1> = {
  U: 1,
  D: -1,
  F: -1,
  B: 1,
  L: 1,
  R: -1,
};

export function axisForFace(face: FaceId): AxisSpec {
  switch (face) {
    case 'U': return { axis: 'y', sign: 1 };
    case 'D': return { axis: 'y', sign: -1 };
    case 'F': return { axis: 'z', sign: 1 };
    case 'B': return { axis: 'z', sign: -1 };
    case 'R': return { axis: 'x', sign: 1 };
    case 'L': return { axis: 'x', sign: -1 };
  }
}

export function faceForAxisLayer(axis: 'x' | 'y' | 'z', layerIndex: number, n: CubeSize): FaceId {
  const isMax = layerIndex === n - 1;
  switch (axis) {
    case 'x': return isMax ? 'R' : 'L';
    case 'y': return isMax ? 'U' : 'D';
    case 'z': return isMax ? 'F' : 'B';
  }
}

/** 面と「ワールド正の軸まわりの回転角の符号」から、Move.directionを求める。 */
export function directionForAngleSign(face: FaceId, angleSign: 1 | -1): 1 | -1 {
  const dirSign = angleSign * TURN_ANGLE_SIGN[face];
  return dirSign === 1 ? 1 : -1;
}

export function angleSignForDirection(face: FaceId, direction: 1 | -1): 1 | -1 {
  const sign = TURN_ANGLE_SIGN[face] * direction;
  return sign === 1 ? 1 : -1;
}

export function isVisible(pos: GridPos, n: CubeSize): boolean {
  const last = n - 1;
  return (
    pos.x === 0 || pos.x === last ||
    pos.y === 0 || pos.y === last ||
    pos.z === 0 || pos.z === last
  );
}

export function facesOfCubie(pos: GridPos, n: CubeSize): FaceId[] {
  const last = n - 1;
  const faces: FaceId[] = [];
  if (pos.y === last) faces.push('U');
  if (pos.y === 0) faces.push('D');
  if (pos.z === last) faces.push('F');
  if (pos.z === 0) faces.push('B');
  if (pos.x === last) faces.push('R');
  if (pos.x === 0) faces.push('L');
  return faces;
}

export function gridToWorld(pos: GridPos, n: CubeSize): [number, number, number] {
  const c = (n - 1) / 2;
  return [
    (pos.x - c) * CELL_SPACING,
    (pos.y - c) * CELL_SPACING,
    (pos.z - c) * CELL_SPACING,
  ];
}

function rotateOnce(c: GridPos, axis: 'x' | 'y' | 'z', sign: 1 | -1): GridPos {
  const { x, y, z } = c;
  switch (axis) {
    case 'y': return sign === -1 ? { x: -z, y, z: x } : { x: z, y, z: -x };
    case 'x': return sign === -1 ? { x, y: z, z: -y } : { x, y: -z, z: y };
    case 'z': return sign === -1 ? { x: y, y: -x, z } : { x: -y, y: x, z };
  }
}

/** グリッド座標(整数)を、ワールドの正の軸まわりに90°刻みで回転させる。 */
export function rotateGridPosition(
  pos: GridPos,
  axis: 'x' | 'y' | 'z',
  angleSign: 1 | -1,
  times: 1 | 2,
  n: CubeSize,
): GridPos {
  const c = (n - 1) / 2;
  let centered: GridPos = { x: pos.x - c, y: pos.y - c, z: pos.z - c };
  for (let i = 0; i < times; i++) {
    centered = rotateOnce(centered, axis, angleSign);
  }
  return {
    x: Math.round(centered.x + c),
    y: Math.round(centered.y + c),
    z: Math.round(centered.z + c),
  };
}

export function buildGridPositions(n: CubeSize): GridPos[] {
  const positions: GridPos[] = [];
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        const pos: GridPos = { x, y, z };
        if (isVisible(pos, n)) positions.push(pos);
      }
    }
  }
  return positions;
}

// 各面のrow/col規約は、実際にcube-logicのapplyMoveを解いた状態(単発の各面
// クロックワイズ回転)からどのセルが変化するかを実測して確定したもの。
//   U[row][col] = grid(x=col,        y=n-1, z=row)
//   D[row][col] = grid(x=col,        y=0,   z=n-1-row)
//   F[row][col] = grid(x=col,        y=n-1-row, z=n-1)
//   B[row][col] = grid(x=n-1-col,    y=n-1-row, z=0)
//   L[row][col] = grid(x=0,          y=n-1-row, z=col)
//   R[row][col] = grid(x=n-1,        y=n-1-row, z=n-1-col)
export function stickerCellForFace(
  face: FaceId,
  pos: GridPos,
  n: CubeSize,
): { row: number; col: number } {
  const last = n - 1;
  const { x, y, z } = pos;
  switch (face) {
    case 'U': return { row: z, col: x };
    case 'D': return { row: last - z, col: x };
    case 'F': return { row: last - y, col: x };
    case 'B': return { row: last - y, col: last - x };
    case 'L': return { row: last - y, col: z };
    case 'R': return { row: last - y, col: last - z };
  }
}
