import { useEffect, useRef } from 'react';
import { useTimerStore } from './timerStore';
import { useSolveHistoryStore } from './solveHistoryStore';
import { haptics } from '../../../shared/lib/haptics';
import { formatTime } from '../../../entities/rank/model';

export { useTimerStore } from './timerStore';
export { useSolveHistoryStore } from './solveHistoryStore';

// インスペクション超過ペナルティ閾値（WCA規定）
const PLUS_TWO_THRESHOLD_MS = 17000;
const DNF_THRESHOLD_MS = 20000;

/**
 * タイマー制御フック。
 *
 * インスペクション中は17秒超過で+2、20秒超過でDNFを自動判定する。
 * 各状態遷移でハプティクスフィードバックを発火する。
 */
export function useTimer() {
  const store = useTimerStore();
  const inspectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // インスペクション中のDNF/+2自動判定
  useEffect(() => {
    if (store.state !== 'inspection') {
      if (inspectionIntervalRef.current !== null) {
        clearInterval(inspectionIntervalRef.current);
        inspectionIntervalRef.current = null;
      }
      return;
    }

    // インスペクション超過を監視（100ms 粒度）
    inspectionIntervalRef.current = setInterval(() => {
      const remaining = store.inspectionMs;

      // 20秒超過: DNFとしてタイマーを強制停止
      if (remaining <= -DNF_THRESHOLD_MS + 15000) {
        haptics.error();
        store.startTimer();
      }
    }, 100);

    return () => {
      if (inspectionIntervalRef.current !== null) {
        clearInterval(inspectionIntervalRef.current);
        inspectionIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.state]);

  // 状態遷移ごとのハプティクス
  useEffect(() => {
    switch (store.state) {
      case 'inspection':
        haptics.light();
        break;
      case 'running':
        haptics.medium();
        break;
      case 'stopped':
        haptics.success();
        break;
      default:
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.state]);

  // インスペクション残り時間に応じた警告ハプティクス
  const prevInspectionBucket = useRef<number | null>(null);
  useEffect(() => {
    if (store.state !== 'inspection') return;

    const remainingSeconds = Math.ceil(store.inspectionMs / 1000);

    // 8秒・3秒のタイミングで警告（WCA審判の慣例に合わせた設定）
    if (remainingSeconds === 8 && prevInspectionBucket.current !== 8) {
      haptics.warning();
      prevInspectionBucket.current = 8;
    } else if (remainingSeconds === 3 && prevInspectionBucket.current !== 3) {
      haptics.warning();
      prevInspectionBucket.current = 3;
    } else if (remainingSeconds <= 0 && prevInspectionBucket.current !== 0) {
      // 15秒超過（+2領域に入った）
      haptics.error();
      prevInspectionBucket.current = 0;
    }
  }, [store.state, store.inspectionMs]);

  // インスペクション開始時にバケットをリセット
  useEffect(() => {
    if (store.state === 'inspection') {
      prevInspectionBucket.current = null;
    }
  }, [store.state]);

  /** 実際の計測時間に+2ペナルティを加算した表示用時間 */
  const displayElapsedMs =
    store.currentSolve?.plusTwo
      ? store.elapsedMs + 2000
      : store.elapsedMs;

  /** インスペクション残り秒数（0未満はペナルティ超過を示す） */
  const inspectionTimeSeconds = Math.ceil(store.inspectionMs / 1000);

  return {
    state: store.state,
    displayTime: formatTime(displayElapsedMs),
    elapsedMs: store.elapsedMs,
    inspectionTime: inspectionTimeSeconds,
    isInspection: store.state === 'inspection',
    isRunning: store.state === 'running',
    isStopped: store.state === 'stopped',
    isPlusTwo: store.currentSolve?.plusTwo ?? false,
    isDNF: store.currentSolve?.dnf ?? false,
    currentSolve: store.currentSolve,

    /** インスペクション開始（idle / stopped -> inspection） */
    start: store.startInspection,
    /** タイマー停止（running -> stopped） */
    stop: store.stopTimer,
    /** タイマーリセット（任意 -> idle） */
    reset: store.resetTimer,
    /** 手動でDNFマーク（stopped 状態でのみ有効） */
    markDNF: store.markDNF,
    /** 手動で+2マーク（stopped 状態でのみ有効） */
    markPlusTwo: store.markPlusTwo,
  };
}

/**
 * ソルブ履歴アクセスフック。
 * 初回マウント時に指定パズルの履歴をロードする。
 */
export function useSolveHistory(puzzleKey: string) {
  const store = useSolveHistoryStore();

  useEffect(() => {
    store.loadSolves(puzzleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleKey]);

  return {
    solves: store.solves[puzzleKey] ?? [],
    isLoading: store.isLoading,
    addSolve: store.addSolve,
    deleteSolve: (id: string) => store.deleteSolve(puzzleKey, id),
    clearHistory: () => store.clearHistory(puzzleKey),
  };
}
