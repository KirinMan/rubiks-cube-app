import type { CubeColor, CubeSize, CubeState, FaceId } from '../../../shared/types';
import { facesOfCubie, stickerCellForFace, type GridPos } from './cubeGeometry';

/**
 * 固定グリッド位置(gridPos)にあるキュービーが、現在のcubeStateにおいて
 * 各面にどの色を表示すべきかを求める。回転してもキュービーの位置自体は
 * 固定のまま、常にcubeStateから色を再解決する設計(宣言的レンダリングに
 * よって色の更新をReactの再描画に任せられ、位置のベイク処理が不要になる)。
 */
export function getCubieColors(
  cubeState: CubeState,
  gridPos: GridPos,
  n: CubeSize,
): Partial<Record<FaceId, CubeColor>> {
  const colors: Partial<Record<FaceId, CubeColor>> = {};
  for (const face of facesOfCubie(gridPos, n)) {
    const { row, col } = stickerCellForFace(face, gridPos, n);
    colors[face] = cubeState[face][row][col];
  }
  return colors;
}
