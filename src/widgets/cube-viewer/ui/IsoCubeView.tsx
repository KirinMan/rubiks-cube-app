import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import type { CubeState, CubeSize, CubeColor } from '../../../shared/types';
import { theme } from '../../../shared/config/theme';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_AZIMUTH = Math.PI / 4;
export const DEFAULT_ELEVATION = Math.atan(1 / Math.sqrt(2)); // ≈35.26° 標準等角投影
export const MIN_ELEVATION = Math.PI / 12;    // 15°
export const MAX_ELEVATION = (Math.PI * 5) / 12; // 75°

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  state: CubeState;
  size: CubeSize;
  viewSize?: number;
  azimuth?: number;   // 方位角 ラジアン (デフォルト: π/4 = 45°)
  elevation?: number; // 仰角 ラジアン (デフォルト: ≈35.26°)
}

type Point = [number, number];

type CellData = {
  key: string;
  points: Point[];
  fill: string;
  depth: number;
};

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<CubeColor, string> = {
  white: '#FFFFFF',
  yellow: '#FFD500',
  red: '#C41E3A',
  orange: '#FF5800',
  blue: '#003680',
  green: '#009B48',
};

function applyBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v * factor)));
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
}

function pointsToString(pts: Point[]): string {
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

// ---------------------------------------------------------------------------
// 3D → 2D 正射影
//
// 座標系: x=右, y=上, z=手前(F面側)
// カメラは球面座標 (azimuth, elevation) で定義
// ---------------------------------------------------------------------------

function project(
  x: number,
  y: number,
  z: number,
  cosAz: number,
  sinAz: number,
  cosEl: number,
  sinEl: number,
  cellSize: number,
): Point {
  const sx = x * cosAz - z * sinAz;
  const sy = x * sinAz * sinEl - y * cosEl + z * cosAz * sinEl;
  return [sx * cellSize, sy * cellSize];
}

function depthOf(
  x: number,
  y: number,
  z: number,
  sinAz: number,
  sinEl: number,
  cosAz: number,
  cosEl: number,
): number {
  return x * sinAz * cosEl + y * sinEl + z * cosAz * cosEl;
}

// ---------------------------------------------------------------------------
// 面構築 (ペインタアルゴリズム)
// ---------------------------------------------------------------------------

// 光源方向（正規化）: やや左上前
const LIGHT_X = -0.4082;
const LIGHT_Y = 0.8165;
const LIGHT_Z = 0.4082;

function faceBrightness(nx: number, ny: number, nz: number): number {
  const dot = nx * LIGHT_X + ny * LIGHT_Y + nz * LIGHT_Z;
  return 0.45 + 0.55 * Math.max(0, dot);
}

function buildCells(
  state: CubeState,
  n: number,
  az: number,
  el: number,
  cellSize: number,
): CellData[] {
  const cosAz = Math.cos(az);
  const sinAz = Math.sin(az);
  const cosEl = Math.cos(el);
  const sinEl = Math.sin(el);

  // カメラ方向ベクトル（バックフェイスカリング用）
  const camX = sinAz * cosEl;
  const camY = sinEl;
  const camZ = cosAz * cosEl;

  const proj = (x: number, y: number, z: number): Point =>
    project(x, y, z, cosAz, sinAz, cosEl, sinEl, cellSize);

  const dep = (x: number, y: number, z: number): number =>
    depthOf(x, y, z, sinAz, sinEl, cosAz, cosEl);

  const cells: CellData[] = [];

  function addFace(
    nx: number,
    ny: number,
    nz: number,
    colorGrid: CubeColor[][],
    getCorners: (row: number, col: number) => [number, number, number][],
    keyPrefix: string,
  ) {
    // バックフェイスカリング
    if (nx * camX + ny * camY + nz * camZ <= 0) return;

    const br = faceBrightness(nx, ny, nz);

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const hex = COLOR_MAP[colorGrid[row][col]] ?? '#888888';
        const corners = getCorners(row, col);
        const cx = corners.reduce((s, c) => s + c[0], 0) / corners.length;
        const cy = corners.reduce((s, c) => s + c[1], 0) / corners.length;
        const cz = corners.reduce((s, c) => s + c[2], 0) / corners.length;
        cells.push({
          key: `${keyPrefix}-${row}-${col}`,
          points: corners.map(([x, y, z]) => proj(x, y, z)),
          fill: applyBrightness(hex, br),
          depth: dep(cx, cy, cz),
        });
      }
    }
  }

  // ── 各面のセル座標定義 ──
  // WCA展開図に基づく3D座標マッピング (x=右,y=上,z=手前):
  //   U[row][col]: x=col, y=n,     z=row   (row=0=B側)
  //   D[row][col]: x=col, y=0,     z=n-row (row=0=F側)
  //   F[row][col]: x=col, y=n-row, z=n
  //   B[row][col]: x=n-col, y=n-row, z=0   (左右反転)
  //   R[row][col]: x=n, y=n-row, z=n-col   (col=0=F側)
  //   L[row][col]: x=0, y=n-row, z=col     (col=0=B側)

  addFace(0, 1, 0, state.U, (row, col) => [
    [col, n, row], [col + 1, n, row], [col + 1, n, row + 1], [col, n, row + 1],
  ], 'U');

  addFace(0, -1, 0, state.D, (row, col) => [
    [col, 0, n - row], [col + 1, 0, n - row],
    [col + 1, 0, n - row - 1], [col, 0, n - row - 1],
  ], 'D');

  addFace(0, 0, 1, state.F, (row, col) => [
    [col, n - row, n], [col + 1, n - row, n],
    [col + 1, n - row - 1, n], [col, n - row - 1, n],
  ], 'F');

  addFace(0, 0, -1, state.B, (row, col) => [
    [n - col, n - row, 0], [n - col - 1, n - row, 0],
    [n - col - 1, n - row - 1, 0], [n - col, n - row - 1, 0],
  ], 'B');

  addFace(1, 0, 0, state.R, (row, col) => [
    [n, n - row, n - col], [n, n - row, n - col - 1],
    [n, n - row - 1, n - col - 1], [n, n - row - 1, n - col],
  ], 'R');

  addFace(-1, 0, 0, state.L, (row, col) => [
    [0, n - row, col], [0, n - row, col + 1],
    [0, n - row - 1, col + 1], [0, n - row - 1, col],
  ], 'L');

  // 深度昇順ソート (奥→手前の順で描画)
  cells.sort((a, b) => a.depth - b.depth);
  return cells;
}

// ---------------------------------------------------------------------------
// ViewBox 計算
// ---------------------------------------------------------------------------

function computeViewBox(
  cells: CellData[],
  padding = 4,
): [number, number, number, number] {
  if (cells.length === 0) return [-50, -50, 100, 100];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const cell of cells) {
    for (const [x, y] of cell.points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return [
    minX - padding,
    minY - padding,
    maxX - minX + padding * 2,
    maxY - minY + padding * 2,
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IsoCubeView({
  state,
  size,
  viewSize = 300,
  azimuth = DEFAULT_AZIMUTH,
  elevation = DEFAULT_ELEVATION,
}: Props) {
  const n = size;
  const cellSize = viewSize / (n * 2.6);

  const cells = useMemo(
    () => buildCells(state, n, azimuth, elevation, cellSize),
    [state, n, azimuth, elevation, cellSize],
  );

  const [vx, vy, vw, vh] = useMemo(() => computeViewBox(cells), [cells]);

  const strokeWidth = Math.max(0.5, cellSize * 0.04);

  return (
    <View style={[styles.container, { width: viewSize, height: viewSize }]}>
      <Svg
        width={viewSize}
        height={viewSize}
        viewBox={`${vx.toFixed(2)} ${vy.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {cells.map((cell) => (
          <Polygon
            key={cell.key}
            points={pointsToString(cell.points)}
            fill={cell.fill}
            stroke={theme.colors.bg.primary}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
