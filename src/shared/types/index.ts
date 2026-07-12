// キューブの色
export type CubeColor = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green';

// 面の識別子
export type FaceId = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

// キューブのサイズ
export type CubeSize = 2 | 3 | 4 | 5 | 6 | 7;

// キューブの種類（特殊パズルを含む）
export type PuzzleType = 'NxN' | 'pyraminx' | 'megaminx' | 'skewb';

// キューブ設定
export interface CubeConfig {
  size: CubeSize;
  puzzleType: PuzzleType;
  label: string;
  defaultColors: Record<FaceId, CubeColor>;
}

// キューブの状態: 各面はN×N配列
export type FaceState = CubeColor[][];
export interface CubeState {
  U: FaceState;
  D: FaceState;
  F: FaceState;
  B: FaceState;
  L: FaceState;
  R: FaceState;
}

// ソルブ記録
export interface SolveRecord {
  id: string;
  puzzleType: PuzzleType;
  cubeSize: CubeSize;
  time: number; // ミリ秒
  scramble: string;
  date: string; // ISO 8601
  dnf: boolean;
  plusTwo: boolean;
}

// ランク定義
export type RankGrade = 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C' | 'D' | 'E';

export interface RankTier {
  grade: RankGrade;
  label: string;
  maxTime: number | null; // null = 上限なし(最下位ランク)
  minTime: number;
  color: string;
  bgColor: string;
  description: string;
}

export interface RankDefinition {
  puzzleKey: string; // e.g. '3x3'
  tiers: RankTier[];
}

// 統計
export interface SolveStats {
  best: number | null;
  worst: number | null;
  mean: number | null;
  ao5: number | null;
  ao12: number | null;
  ao50: number | null;
  ao100: number | null;
  count: number;
}

// タイマー状態
export type TimerState = 'idle' | 'inspection' | 'running' | 'stopped';

// 移動の記述
export interface Move {
  face: FaceId;
  direction: 1 | -1; // 1=時計回り, -1=反時計回り
  wide: boolean; // ワイドムーブ
  double: boolean; // ダブルムーブ
  layer?: number; // レイヤー番号（1始まり）
}
