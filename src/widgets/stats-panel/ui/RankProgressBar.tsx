import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle, Text, TextStyle } from 'react-native';
import { RankTier } from '../../../shared/types/index';
import { theme } from '../../../shared/config/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  currentTier: RankTier;
  nextTier: RankTier | null;
  /** Current best time in milliseconds. Used to calculate progress. */
  currentBestMs: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns progress [0, 1] from currentTier toward nextTier.
 * Progress = how far the user's best time has improved within the current tier's range.
 *
 * Since faster = better, progress increases as bestTime decreases toward nextTier.minTime.
 */
function calcProgress(currentBestMs: number, currentTier: RankTier, nextTier: RankTier): number {
  // currentTier.maxTime is the worst time to still be in this tier (or null for lowest tier).
  // nextTier.maxTime is the threshold to reach next tier.
  const tierStart = currentTier.maxTime ?? currentTier.minTime + 60_000;
  const tierEnd = nextTier.maxTime ?? nextTier.minTime;

  if (tierStart <= tierEnd) return 0;

  const progress = (tierStart - currentBestMs) / (tierStart - tierEnd);
  return Math.min(1, Math.max(0, progress));
}

function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  if (minutes > 0) {
    return `${minutes}:${seconds.padStart(5, '0')}`;
  }
  return `${seconds}s`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RankProgressBar({ currentTier, nextTier, currentBestMs }: Props) {
  const progress = useMemo(() => {
    if (!nextTier) return 1;
    return calcProgress(currentBestMs, currentTier, nextTier);
  }, [currentBestMs, currentTier, nextTier]);

  const progressPercent = `${Math.round(progress * 100)}%` as `${number}%`;

  return (
    <View style={styles.wrapper}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.tierLabel, { color: currentTier.color }]}>
          {currentTier.grade}
        </Text>
        {nextTier ? (
          <Text style={[styles.tierLabel, { color: nextTier.color }]}>
            {nextTier.grade}
          </Text>
        ) : (
          <Text style={styles.maxLabel}>MAX</Text>
        )}
      </View>

      {/* Track */}
      <View style={styles.track}>
        {/* Filled portion */}
        <View
          style={[
            styles.fill,
            {
              width: progressPercent,
              backgroundColor: nextTier ? nextTier.color : currentTier.color,
              shadowColor: nextTier ? nextTier.color : currentTier.color,
            },
          ]}
        />
      </View>

      {/* Footer row */}
      <View style={styles.footerRow}>
        <Text style={styles.progressText}>{progressPercent}</Text>
        {nextTier && nextTier.maxTime !== null && (
          <Text style={styles.thresholdText}>
            Next: {formatTime(nextTier.maxTime)}
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  } as ViewStyle,

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  } as ViewStyle,

  tierLabel: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,

  maxLabel: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,

  track: {
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: 'hidden',
  } as ViewStyle,

  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
    // Glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  } as ViewStyle,

  progressText: {
    fontSize: theme.font.size.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.font.weight.medium,
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,

  thresholdText: {
    fontSize: theme.font.size.xs,
    color: theme.colors.text.tertiary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,
});
