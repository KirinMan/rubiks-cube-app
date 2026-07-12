import { create } from 'zustand';
import type { SolveRecord, TimerState } from '../../../shared/types';

// インスペクション閾値（WCA規定）
const INSPECTION_PLUS_TWO_MS = 17000; // 17秒超過で+2
const INSPECTION_DNF_MS = 20000;      // 20秒超過でDNF

interface TimerStore {
  state: TimerState;
  elapsedMs: number;
  inspectionMs: number; // カウントダウン残り（0以下でDNF領域）
  currentSolve: Partial<SolveRecord> | null;

  // 内部タイムスタンプ（Date.now()差分計算用）
  _startTimestamp: number | null;
  _inspectionStartTimestamp: number | null;
  _intervalId: ReturnType<typeof setInterval> | null;

  startInspection: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  markDNF: () => void;
  markPlusTwo: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  state: 'idle',
  elapsedMs: 0,
  inspectionMs: 15000,
  currentSolve: null,

  _startTimestamp: null,
  _inspectionStartTimestamp: null,
  _intervalId: null,

  startInspection: () => {
    const { state, _intervalId } = get();
    if (state !== 'idle' && state !== 'stopped') return;

    // 既存タイマーをクリア
    if (_intervalId !== null) {
      clearInterval(_intervalId);
    }

    const now = Date.now();
    const inspectionDuration = 15000; // WCA規定15秒

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - now;
      const remaining = inspectionDuration - elapsed;
      set({ inspectionMs: remaining });
    }, 100);

    set({
      state: 'inspection',
      inspectionMs: inspectionDuration,
      elapsedMs: 0,
      currentSolve: null,
      _inspectionStartTimestamp: now,
      _startTimestamp: null,
      _intervalId: intervalId,
    });
  },

  startTimer: () => {
    const { state, _intervalId, _inspectionStartTimestamp } = get();
    if (state !== 'inspection' && state !== 'idle' && state !== 'stopped') return;

    // インスペクション用インターバルをクリア
    if (_intervalId !== null) {
      clearInterval(_intervalId);
    }

    // インスペクション超過チェック（+2 / DNF）
    let plusTwo = false;
    let dnf = false;
    if (_inspectionStartTimestamp !== null) {
      const inspectionElapsed = Date.now() - _inspectionStartTimestamp;
      if (inspectionElapsed >= INSPECTION_DNF_MS) {
        dnf = true;
      } else if (inspectionElapsed >= INSPECTION_PLUS_TWO_MS) {
        plusTwo = true;
      }
    }

    const now = Date.now();

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - now;
      set({ elapsedMs: elapsed });
    }, 10);

    set({
      state: 'running',
      elapsedMs: 0,
      _startTimestamp: now,
      _intervalId: intervalId,
      currentSolve: {
        dnf,
        plusTwo,
      },
    });
  },

  stopTimer: () => {
    const { state, _startTimestamp, _intervalId, currentSolve } = get();
    if (state !== 'running') return;

    if (_intervalId !== null) {
      clearInterval(_intervalId);
    }

    const elapsed = _startTimestamp !== null ? Date.now() - _startTimestamp : 0;

    set({
      state: 'stopped',
      elapsedMs: elapsed,
      _intervalId: null,
      _startTimestamp: null,
      currentSolve: {
        ...currentSolve,
        time: elapsed,
      },
    });
  },

  resetTimer: () => {
    const { _intervalId } = get();
    if (_intervalId !== null) {
      clearInterval(_intervalId);
    }

    set({
      state: 'idle',
      elapsedMs: 0,
      inspectionMs: 15000,
      currentSolve: null,
      _startTimestamp: null,
      _inspectionStartTimestamp: null,
      _intervalId: null,
    });
  },

  markDNF: () => {
    const { state, currentSolve } = get();
    if (state !== 'stopped') return;

    set({
      currentSolve: {
        ...currentSolve,
        dnf: true,
        plusTwo: false,
      },
    });
  },

  markPlusTwo: () => {
    const { state, currentSolve } = get();
    if (state !== 'stopped') return;

    set({
      currentSolve: {
        ...currentSolve,
        plusTwo: true,
        dnf: false,
      },
    });
  },
}));
