import type { RankTier } from '../../../shared/types';
import { getRank, getRankProgress, formatTime } from '../../../entities/rank/model';
import { calculateStats } from '../../../entities/solve/model';
import { useSolveHistory } from '../../timer-control/model';
import { getRankDefinition } from '../../../entities/rank/model';

/**
 * ランク情報フック。
 *
 * 指定パズルのソルブ履歴からベストタイムを取得し、
 * 現在ランク・次のランク・進捗率を計算して返す。
 */
export function useRank(puzzleKey: string) {
  const { solves, isLoading } = useSolveHistory(puzzleKey);
  const stats = calculateStats(solves);

  const currentRank: RankTier | null =
    stats.best !== null ? getRank(puzzleKey, stats.best) : null;

  /** 現在ランクの1段階上のランク（SSSの場合は null） */
  const nextRank: RankTier | null = (() => {
    if (currentRank === null) return null;

    const definition = getRankDefinition(puzzleKey);
    if (!definition) return null;

    const currentIndex = definition.tiers.findIndex(
      (t) => t.grade === currentRank.grade
    );

    // tiers は SSS -> E の順なので、インデックスが小さいほど上位
    if (currentIndex <= 0) return null;

    return definition.tiers[currentIndex - 1];
  })();

  /**
   * 現在ランク内での進捗 (0-1)。
   * 0 = ランクに入ったばかり、1 = 次ランクに近い。
   */
  const progress: number =
    stats.best !== null ? getRankProgress(puzzleKey, stats.best) : 0;

  return {
    currentRank,
    nextRank,
    progress,
    stats,
    isLoading,

    // 便利なフォーマット済み値
    bestFormatted: stats.best !== null ? formatTime(stats.best) : null,
    ao5Formatted: stats.ao5 !== null ? formatTime(stats.ao5) : null,
    ao12Formatted: stats.ao12 !== null ? formatTime(stats.ao12) : null,
  };
}
