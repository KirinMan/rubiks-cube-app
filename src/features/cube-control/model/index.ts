import { useCubeStore } from '../../../entities/cube/model';
import { CubeSize, FaceId, Move } from '../../../shared/types';

type SwipeDirection = 'up' | 'down' | 'left' | 'right';

/**
 * スワイプジェスチャーからムーブを判定する。
 *
 * 各面における列/行の位置 (x, y) と方向から、
 * どの層をどの方向に回すかを決定する。
 * x, y は 0 始まりのセルインデックス。
 *
 * 対応表:
 *   U面:
 *     left/right -> U面スワイプ: F/B方向スライス (L-R軸)
 *       up -> 列xをL方向 -> L/R face slice
 *       down -> 列xをR方向
 *     left -> 行yをF方向 -> U/D face slice
 *     right -> 行yをB方向
 *   F面:
 *     up/down -> 列xのL/R slice
 *     left/right -> 行yのU/D slice
 *   R/L/B 面も同様にマッピング
 */
export function handleSwipe(
  faceId: FaceId,
  direction: SwipeDirection,
  x: number,
  y: number,
  size: CubeSize,
): Move | null {
  const last = size - 1;

  switch (faceId) {
    case 'F': {
      if (direction === 'up' || direction === 'down') {
        // 列 x をスワイプ: R or L 面のスライス
        // x=0 -> L面, x=last -> R面, それ以外は内側スライス
        if (x === 0) {
          return { face: 'L', direction: direction === 'up' ? 1 : -1, wide: false, double: false };
        }
        if (x === last) {
          return { face: 'R', direction: direction === 'up' ? -1 : 1, wide: false, double: false };
        }
        // 内側の列: ワイドムーブ相当 (layer指定)
        return {
          face: 'R',
          direction: direction === 'up' ? -1 : 1,
          wide: true,
          double: false,
          layer: last - x + 1,
        };
      } else {
        // left/right: 行 y をスワイプ: U or D 面のスライス
        if (y === 0) {
          return { face: 'U', direction: direction === 'right' ? 1 : -1, wide: false, double: false };
        }
        if (y === last) {
          return { face: 'D', direction: direction === 'right' ? -1 : 1, wide: false, double: false };
        }
        return {
          face: 'U',
          direction: direction === 'right' ? 1 : -1,
          wide: true,
          double: false,
          layer: y + 1,
        };
      }
    }

    case 'B': {
      if (direction === 'up' || direction === 'down') {
        if (x === 0) {
          return { face: 'R', direction: direction === 'up' ? 1 : -1, wide: false, double: false };
        }
        if (x === last) {
          return { face: 'L', direction: direction === 'up' ? -1 : 1, wide: false, double: false };
        }
        return {
          face: 'L',
          direction: direction === 'up' ? -1 : 1,
          wide: true,
          double: false,
          layer: last - x + 1,
        };
      } else {
        if (y === 0) {
          return { face: 'U', direction: direction === 'left' ? 1 : -1, wide: false, double: false };
        }
        if (y === last) {
          return { face: 'D', direction: direction === 'left' ? -1 : 1, wide: false, double: false };
        }
        return {
          face: 'U',
          direction: direction === 'left' ? 1 : -1,
          wide: true,
          double: false,
          layer: y + 1,
        };
      }
    }

    case 'U': {
      if (direction === 'left' || direction === 'right') {
        // 行 y をスワイプ: U/D軸の水平スライス
        if (y === 0) {
          return { face: 'U', direction: direction === 'right' ? 1 : -1, wide: false, double: false };
        }
        if (y === last) {
          return { face: 'D', direction: direction === 'right' ? -1 : 1, wide: false, double: false };
        }
        return {
          face: 'U',
          direction: direction === 'right' ? 1 : -1,
          wide: true,
          double: false,
          layer: y + 1,
        };
      } else {
        // up/down: 列 x をスワイプ: L/R軸の垂直スライス
        if (x === 0) {
          return { face: 'L', direction: direction === 'up' ? 1 : -1, wide: false, double: false };
        }
        if (x === last) {
          return { face: 'R', direction: direction === 'up' ? -1 : 1, wide: false, double: false };
        }
        return {
          face: 'R',
          direction: direction === 'up' ? -1 : 1,
          wide: true,
          double: false,
          layer: last - x + 1,
        };
      }
    }

    case 'D': {
      if (direction === 'left' || direction === 'right') {
        if (y === last) {
          return { face: 'D', direction: direction === 'right' ? -1 : 1, wide: false, double: false };
        }
        if (y === 0) {
          return { face: 'U', direction: direction === 'right' ? 1 : -1, wide: false, double: false };
        }
        return {
          face: 'D',
          direction: direction === 'right' ? -1 : 1,
          wide: true,
          double: false,
          layer: last - y + 1,
        };
      } else {
        if (x === 0) {
          return { face: 'L', direction: direction === 'down' ? 1 : -1, wide: false, double: false };
        }
        if (x === last) {
          return { face: 'R', direction: direction === 'down' ? -1 : 1, wide: false, double: false };
        }
        return {
          face: 'R',
          direction: direction === 'down' ? -1 : 1,
          wide: true,
          double: false,
          layer: last - x + 1,
        };
      }
    }

    case 'L': {
      if (direction === 'up' || direction === 'down') {
        if (x === 0) {
          return { face: 'L', direction: direction === 'up' ? 1 : -1, wide: false, double: false };
        }
        if (x === last) {
          return { face: 'R', direction: direction === 'up' ? -1 : 1, wide: false, double: false };
        }
        return {
          face: 'R',
          direction: direction === 'up' ? -1 : 1,
          wide: true,
          double: false,
          layer: last - x + 1,
        };
      } else {
        if (y === 0) {
          return { face: 'U', direction: direction === 'right' ? 1 : -1, wide: false, double: false };
        }
        if (y === last) {
          return { face: 'D', direction: direction === 'right' ? -1 : 1, wide: false, double: false };
        }
        return {
          face: 'U',
          direction: direction === 'right' ? 1 : -1,
          wide: true,
          double: false,
          layer: y + 1,
        };
      }
    }

    case 'R': {
      if (direction === 'up' || direction === 'down') {
        if (x === last) {
          return { face: 'R', direction: direction === 'up' ? -1 : 1, wide: false, double: false };
        }
        if (x === 0) {
          return { face: 'L', direction: direction === 'up' ? 1 : -1, wide: false, double: false };
        }
        return {
          face: 'R',
          direction: direction === 'up' ? -1 : 1,
          wide: true,
          double: false,
          layer: last - x + 1,
        };
      } else {
        if (y === 0) {
          return { face: 'U', direction: direction === 'left' ? 1 : -1, wide: false, double: false };
        }
        if (y === last) {
          return { face: 'D', direction: direction === 'left' ? -1 : 1, wide: false, double: false };
        }
        return {
          face: 'U',
          direction: direction === 'left' ? 1 : -1,
          wide: true,
          double: false,
          layer: y + 1,
        };
      }
    }

    default:
      return null;
  }
}

export function useCubeControl() {
  const store = useCubeStore();

  return {
    handleSwipe: (
      faceId: FaceId,
      direction: SwipeDirection,
      x: number,
      y: number,
      size: CubeSize,
    ): Move | null => handleSwipe(faceId, direction, x, y, size),
    applyMove: store.applyMove,
    undo: store.undo,
    reset: store.reset,
  };
}
