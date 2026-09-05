import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { CubeState, CubeSize, CubeColor, FaceId } from '../../../shared/types';
import { theme } from '../../../shared/config/theme';

interface Props {
  state: CubeState;
  size: CubeSize;
  /** セルひとつの表示サイズ (default: 20) */
  cellSize?: number;
  /** 押したときのコールバック */
  onFacePress?: (face: FaceId) => void;
}

const COLOR_MAP: Record<CubeColor, string> = {
  white: '#FFFFFF',
  yellow: '#FFD500',
  red: '#C41E3A',
  orange: '#FF5800',
  blue: '#003680',
  green: '#009B48',
};

// 6面展開図のレイアウト
//
//        [ U ]
//  [ L ] [ F ] [ R ] [ B ]
//        [ D ]
//
// 各面の (gridRow, gridCol) オフセット
const FACE_POSITIONS: Record<FaceId, [number, number]> = {
  U: [0, 1],
  L: [1, 0],
  F: [1, 1],
  R: [1, 2],
  B: [1, 3],
  D: [2, 1],
};

interface FaceGridProps {
  faceId: FaceId;
  colors: CubeColor[][];
  cellSize: number;
  gap: number;
  onPress?: () => void;
}

function FaceGrid({ faceId, colors, cellSize, gap, onPress }: FaceGridProps) {
  const n = colors.length;

  const content = (
    <View style={[styles.face, { gap }]}>
      {colors.map((row, rowIdx) => (
        <View key={rowIdx} style={[styles.row, { gap }]}>
          {row.map((color, colIdx) => (
            <View
              key={colIdx}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: COLOR_MAP[color] ?? '#888888',
                  borderRadius: Math.max(1, cellSize * 0.1),
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export function CubeFaceGrid({ state, size, cellSize = 20, onFacePress }: Props) {
  const n = size;
  const gap = Math.max(1, cellSize * 0.08);
  const faceSize = n * cellSize + (n - 1) * gap;
  const faceGap = Math.max(2, cellSize * 0.15);

  const faces: FaceId[] = ['U', 'D', 'F', 'B', 'L', 'R'];

  // グリッドの行数・列数
  const gridRows = 3;
  const gridCols = 4;
  const containerWidth = gridCols * faceSize + (gridCols - 1) * faceGap;
  const containerHeight = gridRows * faceSize + (gridRows - 1) * faceGap;

  return (
    <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      {faces.map((faceId) => {
        const [gridRow, gridCol] = FACE_POSITIONS[faceId];
        const top = gridRow * (faceSize + faceGap);
        const left = gridCol * (faceSize + faceGap);
        return (
          <View key={faceId} style={[styles.faceWrapper, { top, left }]}>
            <FaceGrid
              faceId={faceId}
              colors={state[faceId]}
              cellSize={cellSize}
              gap={gap}
              onPress={onFacePress ? () => onFacePress(faceId) : undefined}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  faceWrapper: {
    position: 'absolute',
  },
  face: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border.subtle,
  },
});
