import { create } from 'zustand';
import type { SolveRecord } from '../../../shared/types';
import {
  getSolves,
  saveSolve,
  deleteSolve as storagDeleteSolve,
  clearSolves,
} from '../../../shared/lib/storage';

interface SolveHistoryStore {
  /** puzzleKey -> ソルブ記録の配列（新しい順） */
  solves: Record<string, SolveRecord[]>;
  isLoading: boolean;

  /**
   * 指定パズルのソルブ履歴をAsyncStorageからロードする。
   * 既にロード済みの場合でも再取得する。
   */
  loadSolves: (puzzleKey: string) => Promise<void>;

  /**
   * 新しいソルブ記録を追加してAsyncStorageに永続化する。
   * record.puzzleType をキーとして使用する。
   */
  addSolve: (record: SolveRecord) => Promise<void>;

  /**
   * 指定したIDのソルブ記録を削除してAsyncStorageに反映する。
   */
  deleteSolve: (puzzleKey: string, id: string) => Promise<void>;

  /**
   * 指定パズルの全ソルブ履歴を消去する。
   */
  clearHistory: (puzzleKey: string) => Promise<void>;
}

export const useSolveHistoryStore = create<SolveHistoryStore>((set, get) => ({
  solves: {},
  isLoading: false,

  loadSolves: async (puzzleKey: string) => {
    set({ isLoading: true });
    try {
      const records = await getSolves(puzzleKey);
      set((state) => ({
        solves: {
          ...state.solves,
          [puzzleKey]: records,
        },
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  addSolve: async (record: SolveRecord) => {
    // puzzleKey は "3x3" 形式（record.puzzleType は 'NxN' 固定でサイズを区別できないため使用しない）
    const puzzleKey = `${record.cubeSize}x${record.cubeSize}`;

    // AsyncStorage に保存
    await saveSolve(record, puzzleKey);

    set((state) => {
      const existing = state.solves[puzzleKey] ?? [];
      return {
        solves: {
          ...state.solves,
          [puzzleKey]: [record, ...existing],
        },
      };
    });
  },

  deleteSolve: async (puzzleKey: string, id: string) => {
    await storagDeleteSolve(id, puzzleKey);

    set((state) => {
      const existing = state.solves[puzzleKey] ?? [];
      return {
        solves: {
          ...state.solves,
          [puzzleKey]: existing.filter((s) => s.id !== id),
        },
      };
    });
  },

  clearHistory: async (puzzleKey: string) => {
    await clearSolves(puzzleKey);

    set((state) => ({
      solves: {
        ...state.solves,
        [puzzleKey]: [],
      },
    }));
  },
}));
