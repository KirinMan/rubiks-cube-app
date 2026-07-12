import { CubeSize, FaceId, Move } from '../../../shared/types';
import { moveToNotation } from '../../../shared/lib/cube-logic';

const FACES: FaceId[] = ['U', 'D', 'F', 'B', 'L', 'R'];

// WCA公式スクランブル長のデフォルト値
export function getDefaultScrambleLength(size: CubeSize): number {
  switch (size) {
    case 2:
      return 11;
    case 3:
      return 20;
    case 4:
      return 40;
    case 5:
      return 60;
    case 6:
      return 80;
    case 7:
      return 100;
    default:
      return 20;
  }
}

// 指定した面と「同じ軸」の面を返す（連続する軸違反を防ぐ）
// U-D, F-B, L-R が同一軸
function getOpposite(face: FaceId): FaceId {
  switch (face) {
    case 'U':
      return 'D';
    case 'D':
      return 'U';
    case 'F':
      return 'B';
    case 'B':
      return 'F';
    case 'L':
      return 'R';
    case 'R':
      return 'L';
  }
}

/**
 * WCA公式スクランブル記法に準拠したスクランブルを生成する。
 *
 * ルール:
 * - 連続する2手で同じ面を使わない
 * - 連続する2手で対面を使わない（3手目は対面でも可）
 * - double(2), inverse(') をランダムに付与
 * - 4x4以上では内側スライス (Uw, Fw, Rw など) を含む
 */
export function generateScramble(size: CubeSize, length?: number): Move[] {
  const count = length ?? getDefaultScrambleLength(size);
  const moves: Move[] = [];

  let lastFace: FaceId | null = null;
  let secondLastFace: FaceId | null = null;

  for (let i = 0; i < count; i++) {
    // 使用禁止の面: 直前の面、および直前が対面の場合は直前2手分
    const forbidden = new Set<FaceId>();
    if (lastFace !== null) {
      forbidden.add(lastFace);
      // 同じ軸の場合、2手前と同じ面も禁止
      if (secondLastFace !== null && getOpposite(secondLastFace) === lastFace) {
        forbidden.add(secondLastFace);
      }
    }

    const available = FACES.filter((f) => !forbidden.has(f));
    const face = available[Math.floor(Math.random() * available.length)];

    // 方向: 1(時計回り) or -1(反時計回り) or double
    const dirRoll = Math.floor(Math.random() * 3);
    const direction: 1 | -1 = dirRoll === 1 ? -1 : 1;
    const double = dirRoll === 2;

    // 4x4以上では内側スライスを確率的に使用
    let wide = false;
    let layer: number | undefined;
    if (size >= 4) {
      // 内側スライスを使う確率: 約40%
      if (Math.random() < 0.4) {
        wide = true;
        // layer は 2 から size/2 まで (WCA: 最大 floor(N/2))
        const maxLayer = Math.floor(size / 2);
        layer = maxLayer > 2 ? 2 + Math.floor(Math.random() * (maxLayer - 2)) : 2;
      }
    }

    const move: Move = { face, direction, wide, double };
    if (layer !== undefined) move.layer = layer;

    moves.push(move);

    secondLastFace = lastFace;
    lastFace = face;
  }

  return moves;
}

/**
 * スクランブルをWCA記法の文字列として生成する。
 * 例: "R U R' F2 L' B U2 ..."
 */
export function generateScrambleNotation(size: CubeSize, length?: number): string {
  const moves = generateScramble(size, length);
  return moves.map((m) => moveToNotation(m)).join(' ');
}
