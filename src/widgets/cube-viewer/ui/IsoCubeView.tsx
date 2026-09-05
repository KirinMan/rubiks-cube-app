import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Svg, { Polygon, G } from 'react-native-svg';
import { CubeState, CubeSize, CubeColor } from '../../../shared/types';
import { theme } from '../../../shared/config/theme';

interface Props {
  state: CubeState;
  size: CubeSize;
  viewSize?: number;
  onFacePress?: (face: 'U' | 'F' | 'R') => void;
}

// 3DキューブのSTICKER_COLOR_HEXと統一するため、theme.colors.cubeをそのまま使う
const COLOR_MAP: Record<CubeColor, string> = theme.colors.cube;

// 等角投影の基底ベクトル（単位セルあたり）
// 右方向: (cos30°, sin30°) = (√3/2, 0.5)
// 左方向: (-cos30°, sin30°) = (-√3/2, 0.5)
// 上方向: (0, -1)
const COS30 = Math.sqrt(3) / 2; // ≈ 0.866
const SIN30 = 0.5;

type Point = [number, number];

// 等角投影: (right_steps, left_steps, up_steps) -> (x, y)
function iso(r: number, l: number, u: number, cellSize: number, origin: Point): Point {
  const x = origin[0] + (r * COS30 - l * COS30) * cellSize;
  const y = origin[1] + (r * SIN30 + l * SIN30 - u) * cellSize;
  return [x, y];
}

function pointsToString(pts: Point[]): string {
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

// 上面(U)のセル(row, col)の4頂点
// row=0が奥、row=n-1が手前。col=0が左、col=n-1が右。
// 等角投影では right=col方向, left=row方向, up=n方向（上面はup=n固定）
function getTopCellPoints(
  row: number,
  col: number,
  n: number,
  cellSize: number,
  origin: Point,
): Point[] {
  const up = n;
  const r0 = col;
  const r1 = col + 1;
  const l0 = row;
  const l1 = row + 1;
  return [
    iso(r0, l0, up, cellSize, origin),
    iso(r1, l0, up, cellSize, origin),
    iso(r1, l1, up, cellSize, origin),
    iso(r0, l1, up, cellSize, origin),
  ];
}

// 正面(F)のセル(row, col)の4頂点
// row=0が上、row=n-1が下。col=0が左、col=n-1が右。
// 正面はleft=n固定、up方向がrow、right方向がcol
function getFrontCellPoints(
  row: number,
  col: number,
  n: number,
  cellSize: number,
  origin: Point,
): Point[] {
  const l = n;
  const r0 = col;
  const r1 = col + 1;
  const u0 = n - row - 1;
  const u1 = n - row;
  return [
    iso(r0, l, u1, cellSize, origin),
    iso(r1, l, u1, cellSize, origin),
    iso(r1, l, u0, cellSize, origin),
    iso(r0, l, u0, cellSize, origin),
  ];
}

// 右面(R)のセル(row, col)の4頂点
// row=0が上、row=n-1が下。col=0が左(手前)、col=n-1が右(奥)。
// 右面はright=n固定、up方向がrow、left方向がcol
function getRightCellPoints(
  row: number,
  col: number,
  n: number,
  cellSize: number,
  origin: Point,
): Point[] {
  const r = n;
  const l0 = col;
  const l1 = col + 1;
  const u0 = n - row - 1;
  const u1 = n - row;
  return [
    iso(r, l0, u1, cellSize, origin),
    iso(r, l1, u1, cellSize, origin),
    iso(r, l1, u0, cellSize, origin),
    iso(r, l0, u0, cellSize, origin),
  ];
}

// 面の陰影色（等角投影らしい立体感）
const FACE_BRIGHTNESS = {
  top: 1.0,
  front: 0.75,
  right: 0.85,
};

function applyBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v * factor)));
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
}

export function IsoCubeView({ state, size, viewSize = 300, onFacePress }: Props) {
  const n = size;

  // セルサイズ: viewSizeをn面が収まるよう調整
  // 等角投影で3面が収まる幅: n * √3 * cellSize, 高さ: n * 1.5 * cellSize + n * cellSize
  // 横幅 = 2 * n * COS30 * cellSize、縦幅 = n * (SIN30 + SIN30 + 1) * cellSize = n * 2 * cellSize
  // viewSize / (n * 2 * COS30 + margin) でcellSizeを決める
  const cellSize = useMemo(() => {
    const marginFactor = 2.6;
    return viewSize / (n * marginFactor);
  }, [n, viewSize]);

  // SVG内の原点: キューブ全体をSVGの中心付近に配置
  // 等角投影の原点(0,0,0)をSVG上のどこに置くか
  // 上面の最奥頂点 iso(0,0,n) がSVGの上端付近になるよう調整
  const origin: Point = useMemo(() => {
    const topY = iso(0, 0, n, cellSize, [0, 0])[1];
    const bottomFrontY = iso(0, n, 0, cellSize, [0, 0])[1];
    const totalHeight = bottomFrontY - topY;
    const leftX = iso(0, n, 0, cellSize, [0, 0])[0];
    const rightX = iso(n, 0, 0, cellSize, [0, 0])[0];
    const totalWidth = rightX - leftX;
    const padX = (viewSize - totalWidth) / 2 - leftX;
    const padY = (viewSize - totalHeight) / 2 - topY;
    return [padX, padY];
  }, [n, cellSize, viewSize]);

  const cells = useMemo(() => {
    const result: Array<{
      key: string;
      points: Point[];
      fill: string;
      stroke: string;
      face: 'U' | 'F' | 'R';
    }> = [];

    // 上面 (U)
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const color = state.U[row][col];
        const hex = COLOR_MAP[color] ?? '#888888';
        result.push({
          key: `U-${row}-${col}`,
          points: getTopCellPoints(row, col, n, cellSize, origin),
          fill: applyBrightness(hex, FACE_BRIGHTNESS.top),
          stroke: theme.colors.bg.primary,
          face: 'U',
        });
      }
    }

    // 正面 (F) - 左側の面
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const color = state.F[row][col];
        const hex = COLOR_MAP[color] ?? '#888888';
        result.push({
          key: `F-${row}-${col}`,
          points: getFrontCellPoints(row, col, n, cellSize, origin),
          fill: applyBrightness(hex, FACE_BRIGHTNESS.front),
          stroke: theme.colors.bg.primary,
          face: 'F',
        });
      }
    }

    // 右面 (R)
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const color = state.R[row][col];
        const hex = COLOR_MAP[color] ?? '#888888';
        result.push({
          key: `R-${row}-${col}`,
          points: getRightCellPoints(row, col, n, cellSize, origin),
          fill: applyBrightness(hex, FACE_BRIGHTNESS.right),
          stroke: theme.colors.bg.primary,
          face: 'R',
        });
      }
    }

    return result;
  }, [state, n, cellSize, origin]);

  const strokeWidth = Math.max(0.5, cellSize * 0.04);

  return (
    <View style={[styles.container, { width: viewSize, height: viewSize }]}>
      <Svg width={viewSize} height={viewSize} viewBox={`0 0 ${viewSize} ${viewSize}`}>
        <G>
          {cells.map((cell) => (
            <Polygon
              key={cell.key}
              points={pointsToString(cell.points)}
              fill={cell.fill}
              stroke={cell.stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              onPress={onFacePress ? () => onFacePress(cell.face) : undefined}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
