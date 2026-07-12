import type { SolveRecord, SolveStats } from '../../../shared/types';

/**
 * Generate a UUID-like random ID string.
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Compute the average of N solves using the trimmed mean (drop best and worst).
 * DNF solves are excluded from the list before trimming.
 * Returns null when there are fewer than N valid solves or when too many DNFs
 * prevent a meaningful average (i.e. N <= 2 and no valid times remain).
 *
 * @param solves - The full list of solve records (most recent last, or any order).
 *                 Only the LAST `n` records are considered.
 * @param n      - Window size (e.g. 5, 12, 50, 100).
 */
function computeAoN(solves: SolveRecord[], n: number): number | null {
  if (solves.length < n) return null;

  const window = solves.slice(-n);
  const validTimes = window.filter((s) => !s.dnf).map((s) => s.time);

  // For a trimmed mean we need at least 3 times (remove best + worst, 1 left).
  if (n <= 2) {
    if (validTimes.length === 0) return null;
    const sum = validTimes.reduce((a, b) => a + b, 0);
    return sum / validTimes.length;
  }

  // Standard competition rule: if more than 1 DNF, the result is DNF (null).
  const dnfCount = window.length - validTimes.length;
  if (dnfCount > 1) return null;
  // With exactly 1 DNF that DNF acts as the worst time and is dropped; the
  // rest are averaged after also removing the best.
  // With 0 DNFs: remove the single best and single worst by time.

  if (dnfCount === 1) {
    // DNF is already excluded from validTimes; it serves as the "worst" drop.
    // We still need to drop the best valid time.
    if (validTimes.length < 1) return null;
    const sorted = [...validTimes].sort((a, b) => a - b);
    // Drop best (index 0); DNF already dropped as worst.
    const trimmed = sorted.slice(1);
    if (trimmed.length === 0) return null;
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  }

  // 0 DNFs: remove best and worst.
  const sorted = [...validTimes].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, sorted.length - 1);
  if (trimmed.length === 0) return null;
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

/**
 * Calculate aggregate statistics for a list of solve records.
 *
 * - DNF solves are excluded from best/worst/mean calculations.
 * - ao5/ao12/ao50/ao100 use the standard trimmed mean (drop best + worst)
 *   over the most recent N solves; more than one DNF in the window yields null.
 */
export function calculateStats(solves: SolveRecord[]): SolveStats {
  const count = solves.length;

  const validTimes = solves.filter((s) => !s.dnf).map((s) => s.time);

  const best = validTimes.length > 0 ? Math.min(...validTimes) : null;
  const worst = validTimes.length > 0 ? Math.max(...validTimes) : null;
  const mean =
    validTimes.length > 0
      ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
      : null;

  return {
    count,
    best,
    worst,
    mean,
    ao5: computeAoN(solves, 5),
    ao12: computeAoN(solves, 12),
    ao50: computeAoN(solves, 50),
    ao100: computeAoN(solves, 100),
  };
}
