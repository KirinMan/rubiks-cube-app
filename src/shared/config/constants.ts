import type { CubeColor, CubeConfig, CubeSize, FaceId, PuzzleType } from '../types';

// デフォルト面カラー（標準色: 白上・黄下・緑前・青後・橙左・赤右）
// WCA標準色配置: 上=白、下=黄、前=赤、後=橙、左=青、右=緑
const DEFAULT_COLORS: Record<FaceId, CubeColor> = {
  U: 'white',
  D: 'yellow',
  F: 'red',
  B: 'orange',
  L: 'blue',
  R: 'green',
};

// 各サイズのキューブ設定
export const CUBE_CONFIGS: CubeConfig[] = [
  { size: 2, puzzleType: 'NxN', label: '2x2', defaultColors: { ...DEFAULT_COLORS } },
  { size: 3, puzzleType: 'NxN', label: '3x3', defaultColors: { ...DEFAULT_COLORS } },
  { size: 4, puzzleType: 'NxN', label: '4x4', defaultColors: { ...DEFAULT_COLORS } },
  { size: 5, puzzleType: 'NxN', label: '5x5', defaultColors: { ...DEFAULT_COLORS } },
  { size: 6, puzzleType: 'NxN', label: '6x6', defaultColors: { ...DEFAULT_COLORS } },
  { size: 7, puzzleType: 'NxN', label: '7x7', defaultColors: { ...DEFAULT_COLORS } },
];

// パズル種別の表示名
export const PUZZLE_DISPLAY_NAMES: Record<PuzzleType, string> = {
  NxN: 'NxN Cube',
  pyraminx: 'Pyraminx',
  megaminx: 'Megaminx',
  skewb: 'Skewb',
};

// デフォルトのキューブサイズ
export const DEFAULT_CUBE_SIZE: CubeSize = 3;

// インスペクション時間（ミリ秒）: WCA規定の15秒
export const INSPECTION_TIME: number = 15000;

// アニメーション時間（ミリ秒）
export const ANIMATION_DURATION: number = 200;

// スクランブル手数の目安
export const SCRAMBLE_LENGTH: Record<CubeSize, number> = {
  2: 11,
  3: 20,
  4: 40,
  5: 60,
  6: 80,
  7: 100,
};

// 平均計算に使うソルブ数
export const AO_COUNTS = [5, 12, 50, 100] as const;
export type AoCount = (typeof AO_COUNTS)[number];

// ローカルストレージキー
export const STORAGE_KEYS = {
  SOLVE_RECORDS: 'rubiks-cube-app:solve-records',
  SETTINGS: 'rubiks-cube-app:settings',
  CURRENT_PUZZLE: 'rubiks-cube-app:current-puzzle',
} as const;

// タイマーのキーバインド
export const TIMER_KEYS = {
  START_STOP: ' ',     // スペースキー
  RESET: 'Escape',
  INSPECTION: 'Enter',
} as const;
