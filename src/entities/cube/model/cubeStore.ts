import { create } from 'zustand';
import { CubeState, CubeSize, Move, PuzzleType } from '../../../shared/types';
import { applyMove, createSolvedCube } from '../../../shared/lib/cube-logic';

interface CubeStore {
  // 状態
  cubeState: CubeState;
  cubeSize: CubeSize;
  puzzleType: PuzzleType;
  moveHistory: Move[];
  isScrambled: boolean;

  // アクション
  applyMove: (move: Move) => void;
  scramble: (moves: Move[]) => void;
  reset: () => void;
  setCubeSize: (size: CubeSize) => void;
  setPuzzleType: (type: PuzzleType) => void;
  undo: () => void;
}

const DEFAULT_SIZE: CubeSize = 3;
const DEFAULT_PUZZLE_TYPE: PuzzleType = 'NxN';

export const useCubeStore = create<CubeStore>((set, get) => ({
  cubeState: createSolvedCube(DEFAULT_SIZE),
  cubeSize: DEFAULT_SIZE,
  puzzleType: DEFAULT_PUZZLE_TYPE,
  moveHistory: [],
  isScrambled: false,

  applyMove: (move: Move) => {
    const { cubeState, cubeSize, moveHistory } = get();
    const nextState = applyMove(cubeState, move, cubeSize);
    set({
      cubeState: nextState,
      moveHistory: [...moveHistory, move],
    });
  },

  scramble: (moves: Move[]) => {
    const { cubeSize } = get();
    const solvedState = createSolvedCube(cubeSize);
    const scrambledState = moves.reduce(
      (state, move) => applyMove(state, move, cubeSize),
      solvedState,
    );
    set({
      cubeState: scrambledState,
      moveHistory: [...moves],
      isScrambled: true,
    });
  },

  reset: () => {
    const { cubeSize } = get();
    set({
      cubeState: createSolvedCube(cubeSize),
      moveHistory: [],
      isScrambled: false,
    });
  },

  setCubeSize: (size: CubeSize) => {
    set({
      cubeSize: size,
      cubeState: createSolvedCube(size),
      moveHistory: [],
      isScrambled: false,
    });
  },

  setPuzzleType: (type: PuzzleType) => {
    set({ puzzleType: type });
  },

  undo: () => {
    const { moveHistory, cubeSize } = get();
    if (moveHistory.length === 0) return;

    const previousMoves = moveHistory.slice(0, -1);
    const solvedState = createSolvedCube(cubeSize);
    const restoredState = previousMoves.reduce(
      (state, move) => applyMove(state, move, cubeSize),
      solvedState,
    );
    set({
      cubeState: restoredState,
      moveHistory: previousMoves,
      isScrambled: previousMoves.length > 0,
    });
  },
}));
