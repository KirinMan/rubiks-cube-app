import * as THREE from 'three';
import type { CubeColor, CubeSize, CubeState, FaceId, Move } from '../../../shared/types';

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

export const COLOR_HEX: Record<CubeColor, number> = {
  white: 0xffffff,
  yellow: 0xffd500,
  red: 0xc41e3a,
  orange: 0xff5800,
  blue: 0x003680,
  green: 0x009b48,
};

const BASE_COLOR = 0x0a0a0c; // プラスチックベースの色
const CUBIE_SIZE = 1;
const CUBIE_GAP = 0.06; // キュービー間の隙間
const STICKER_INSET = 0.86; // ベース面に対するステッカーの縮小率
const STICKER_OFFSET = 0.002; // Zファイティング防止

export const CELL_SPACING = CUBIE_SIZE + CUBIE_GAP;

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

export interface GridPos {
  x: number;
  y: number;
  z: number;
}

export interface Cubie3D {
  group: THREE.Group;
  gridPos: GridPos;
  stickers: Partial<Record<FaceId, THREE.Mesh>>;
}

export interface AxisSpec {
  axis: 'x' | 'y' | 'z';
  sign: 1 | -1;
}

export interface MoveRotation {
  axis: 'x' | 'y' | 'z';
  /** ワールドの正の軸まわりの回転角(ラジアン、右手系)。pivotの最終回転値として使う。 */
  angle: number;
  /** このレイヤーに含まれるグリッド座標(該当軸上の値)。0 か n-1。 */
  layerIndex: number;
  /** 90°刻みで何回分の回転か(バケ処理・gridPos更新用)。 */
  quarterTurns: 1 | 2;
}

// ---------------------------------------------------------------------------
// グリッド <-> ワールド座標
// ---------------------------------------------------------------------------

export function gridToWorld(pos: GridPos, n: CubeSize): THREE.Vector3 {
  const c = (n - 1) / 2;
  return new THREE.Vector3(
    (pos.x - c) * CELL_SPACING,
    (pos.y - c) * CELL_SPACING,
    (pos.z - c) * CELL_SPACING,
  );
}

function isVisible(pos: GridPos, n: CubeSize): boolean {
  const last = n - 1;
  return (
    pos.x === 0 || pos.x === last ||
    pos.y === 0 || pos.y === last ||
    pos.z === 0 || pos.z === last
  );
}

function facesOfCubie(pos: GridPos, n: CubeSize): FaceId[] {
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

// ---------------------------------------------------------------------------
// キュービー生成
// ---------------------------------------------------------------------------

function createSticker(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(STICKER_INSET, STICKER_INSET);
  const mat = new THREE.MeshStandardMaterial({ color: BASE_COLOR, roughness: 0.35, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.matrixAutoUpdate = true;
  return mesh;
}

// PlaneGeometryは既定で+Zを法線として持つ。各面に貼るために回転・オフセットする。
function orientSticker(mesh: THREE.Mesh, face: FaceId): void {
  const half = CUBIE_SIZE / 2 + STICKER_OFFSET;
  switch (face) {
    case 'U':
      mesh.position.set(0, half, 0);
      mesh.rotation.set(-Math.PI / 2, 0, 0);
      break;
    case 'D':
      mesh.position.set(0, -half, 0);
      mesh.rotation.set(Math.PI / 2, 0, 0);
      break;
    case 'F':
      mesh.position.set(0, 0, half);
      mesh.rotation.set(0, 0, 0);
      break;
    case 'B':
      mesh.position.set(0, 0, -half);
      mesh.rotation.set(0, Math.PI, 0);
      break;
    case 'R':
      mesh.position.set(half, 0, 0);
      mesh.rotation.set(0, Math.PI / 2, 0);
      break;
    case 'L':
      mesh.position.set(-half, 0, 0);
      mesh.rotation.set(0, -Math.PI / 2, 0);
      break;
  }
}

export function buildCubies(n: CubeSize): Cubie3D[] {
  const cubies: Cubie3D[] = [];
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      for (let z = 0; z < n; z++) {
        const pos: GridPos = { x, y, z };
        if (!isVisible(pos, n)) continue;

        const group = new THREE.Group();
        // この環境(expo-gl)ではジオメトリ/マテリアルを複数メッシュで共有すると
        // 2つ目以降の描画でシーン全体が表示されなくなる不具合があるため、
        // キュービーごとに個別インスタンスを生成する(実測で確認済み)。
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE),
          new THREE.MeshStandardMaterial({ color: BASE_COLOR, roughness: 0.6, metalness: 0.05 }),
        );
        group.add(base);

        const stickers: Partial<Record<FaceId, THREE.Mesh>> = {};
        for (const face of facesOfCubie(pos, n)) {
          const sticker = createSticker();
          orientSticker(sticker, face);
          sticker.userData.faceId = face;
          group.add(sticker);
          stickers[face] = sticker;
        }

        group.position.copy(gridToWorld(pos, n));
        const cubieIndex = cubies.length;
        group.userData.cubieIndex = cubieIndex;
        for (const face of Object.keys(stickers) as FaceId[]) {
          stickers[face]!.userData.cubieIndex = cubieIndex;
        }
        cubies.push({ group, gridPos: pos, stickers });
      }
    }
  }
  return cubies;
}

// ---------------------------------------------------------------------------
// CubeState からの彩色
//
// 各面のrow/col規約は、実際にcube-logicのapplyMoveを解いた状態(単発の各面
// クロックワイズ回転)からどのセルが変化するかを実測して確定したもの
// (手動でのコード読解によるトレースではなく、実行結果から逆算している)。
//   U[row][col] = grid(x=col,        y=n-1, z=row)
//   D[row][col] = grid(x=col,        y=0,   z=n-1-row)
//   F[row][col] = grid(x=col,        y=n-1-row, z=n-1)
//   B[row][col] = grid(x=n-1-col,    y=n-1-row, z=0)
//   L[row][col] = grid(x=0,          y=n-1-row, z=col)
//   R[row][col] = grid(x=n-1,        y=n-1-row, z=n-1-col)
// ---------------------------------------------------------------------------

export function paintCubiesFromState(cubies: Cubie3D[], state: CubeState, n: CubeSize): void {
  const last = n - 1;
  for (const cubie of cubies) {
    const { x, y, z } = cubie.gridPos;
    for (const key of Object.keys(cubie.stickers)) {
      const face = key as FaceId;
      const mesh = cubie.stickers[face];
      if (!mesh) continue;

      let color: CubeColor;
      switch (face) {
        case 'U': color = state.U[z][x]; break;
        case 'D': color = state.D[last - z][x]; break;
        case 'F': color = state.F[last - y][x]; break;
        case 'B': color = state.B[last - y][last - x]; break;
        case 'L': color = state.L[last - y][z]; break;
        case 'R': color = state.R[last - y][last - z]; break;
      }

      (mesh.material as THREE.MeshStandardMaterial).color.setHex(COLOR_HEX[color]);
    }
  }
}

// ---------------------------------------------------------------------------
// 回転
// ---------------------------------------------------------------------------

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

// direction=1(時計回り)のときの、ワールド正の軸まわりの回転角の符号。
// 手動導出では符号を誤りやすいため、cube-logicのapplyMoveを実際に実行し
// (createSolvedCubeにapplyMoveして色の移動先を比較する)全パターンを
// 機械的に照合して確定した値(全軸・全方向・二重回転で不一致ゼロを確認済み)。
const TURN_ANGLE_SIGN: Record<FaceId, 1 | -1> = {
  U: 1,
  D: -1,
  F: -1,
  B: 1,
  L: 1,
  R: -1,
};

/**
 * Moveからワールド軸まわりの回転パラメータを算出する。
 */
export function resolveMoveRotation(move: Move, n: CubeSize): MoveRotation {
  const { axis, sign } = axisForFace(move.face);
  const dirSign = move.direction === 1 ? 1 : -1;
  const unit = move.double ? Math.PI : Math.PI / 2;
  const angleSign = TURN_ANGLE_SIGN[move.face] * dirSign;
  const angle = angleSign * unit;
  const layerIndex = sign === 1 ? n - 1 : 0;
  return { axis, angle, layerIndex, quarterTurns: move.double ? 2 : 1 };
}

/** 回転軸とレイヤー位置(0 か n-1)から、対応するFaceIdを求める(resolveMoveRotationの逆)。 */
export function faceForAxisLayer(axis: 'x' | 'y' | 'z', layerIndex: number, n: CubeSize): FaceId {
  const isMax = layerIndex === n - 1;
  switch (axis) {
    case 'x': return isMax ? 'R' : 'L';
    case 'y': return isMax ? 'U' : 'D';
    case 'z': return isMax ? 'F' : 'B';
  }
}

/**
 * 面と「ワールド正の軸まわりの回転角の符号」から、対応するMove.directionを求める
 * (resolveMoveRotationの逆)。ドラッグ操作から確定したい回転方向を渡すと、
 * cubeStore.applyMoveに渡せるMoveのdirectionが得られる。
 */
export function directionForAngleSign(face: FaceId, angleSign: 1 | -1): 1 | -1 {
  const dirSign = angleSign * TURN_ANGLE_SIGN[face];
  return dirSign === 1 ? 1 : -1;
}

function rotateOnce(c: GridPos, axis: 'x' | 'y' | 'z', sign: 1 | -1): GridPos {
  const { x, y, z } = c;
  switch (axis) {
    case 'y': return sign === -1 ? { x: -z, y, z: x } : { x: z, y, z: -x };
    case 'x': return sign === -1 ? { x, y: z, z: -y } : { x, y: -z, z: y };
    case 'z': return sign === -1 ? { x: y, y: -x, z } : { x: -y, y: x, z };
  }
}

/**
 * グリッド座標(整数)を、ワールドの正の軸まわりに90°刻みで回転させる。
 * 90°刻みの回転はsin/cosが0/±1になるため、座標の入れ替え+符号反転だけで
 * 厳密に計算でき、浮動小数点誤差が蓄積しない。
 */
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
