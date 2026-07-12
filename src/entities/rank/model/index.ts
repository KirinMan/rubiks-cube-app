import type { CubeSize, RankTier } from '../../../shared/types';
import { getRankDefinition } from './rankDefinitions';

export { rankDefinitions, getRankDefinition } from './rankDefinitions';

/**
 * Convert a CubeSize to its puzzle key string (e.g. 3 -> "3x3").
 */
export function parsePuzzleKey(size: CubeSize): string {
  return `${size}x${size}`;
}

/**
 * Return the RankTier that corresponds to the given time for a puzzle.
 * Falls back to the lowest tier (E) when no definition is found or the time
 * exceeds all upper bounds.
 */
export function getRank(puzzleKey: string, timeMs: number): RankTier {
  const definition = getRankDefinition(puzzleKey);

  if (!definition) {
    // Unknown puzzle: return a generic E tier
    return {
      grade: 'E',
      label: 'Novice',
      minTime: 0,
      maxTime: null,
      color: '#888888',
      bgColor: '#1A1A1A',
      description: 'Just getting started',
    };
  }

  // Tiers are ordered from best (SSS) to worst (E).
  // Find the first tier whose range contains timeMs.
  for (const tier of definition.tiers) {
    const belowMax = tier.maxTime === null || timeMs < tier.maxTime;
    if (timeMs >= tier.minTime && belowMax) {
      return tier;
    }
  }

  // Should not reach here if definitions are complete, but return last tier as safety.
  return definition.tiers[definition.tiers.length - 1];
}

/**
 * Return a value in [0, 1] representing how far the solver has progressed
 * toward the next (better) rank within the current tier.
 *
 * 0 = just entered this tier (worst end)
 * 1 = about to reach the next tier (best end)
 *
 * For the top tier (SSS) where minTime is 0 and maxTime is finite, progress
 * is measured toward 0 ms; for the bottom tier (E) with no maxTime a fixed
 * window is used.
 */
export function getRankProgress(puzzleKey: string, timeMs: number): number {
  const definition = getRankDefinition(puzzleKey);
  if (!definition) return 0;

  const tierIndex = definition.tiers.findIndex((t) => {
    const belowMax = t.maxTime === null || timeMs < t.maxTime;
    return timeMs >= t.minTime && belowMax;
  });

  if (tierIndex === -1) return 0;

  const tier = definition.tiers[tierIndex];

  // Bottom tier (E) — no upper bound; use a 30-minute window for progress.
  if (tier.maxTime === null) {
    const windowMs = 30 * 60 * 1000;
    const overMin = timeMs - tier.minTime;
    // Progress toward the threshold (lower is better here is ambiguous for E,
    // so we simply show how far past the threshold the solver is, capped at 1).
    return Math.min(overMin / windowMs, 1);
  }

  // Normal tier: progress from maxTime (entry point, worst) toward minTime (best).
  const rangeMs = tier.maxTime - tier.minTime;
  if (rangeMs <= 0) return 1;

  // timeMs close to maxTime -> 0, timeMs close to minTime -> 1
  const progress = (tier.maxTime - timeMs) / rangeMs;
  return Math.max(0, Math.min(1, progress));
}

/**
 * Format a duration in milliseconds to "M:SS.mm" or "SS.mm" string.
 *
 * Examples:
 *   83450  -> "1:23.45"
 *   9870   -> "9.87"
 *   3723000 -> "62:03.00"
 */
export function formatTime(timeMs: number): string {
  if (timeMs < 0) return '0.00';

  const totalCentiseconds = Math.floor(timeMs / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const cs = centiseconds.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  if (minutes > 0) {
    return `${minutes}:${ss}.${cs}`;
  }
  return `${seconds}.${cs}`;
}
