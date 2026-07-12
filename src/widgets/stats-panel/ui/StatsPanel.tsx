import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle, Text, TextStyle } from 'react-native';
import { SolveStats, RankTier } from '../../../shared/types/index';
import { theme } from '../../../shared/config/theme';
import { Card } from '../../../shared/ui/Card/index';
import { RankBadge } from './RankBadge';
import { RankProgressBar } from './RankProgressBar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  stats: SolveStats;
  currentRank: RankTier | null;
  puzzleKey: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ms: number | null): string {
  if (ms === null) return '--';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  if (minutes > 0) {
    return `${minutes}:${seconds.padStart(5, '0')}`;
  }
  return seconds;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={subStyles.statItem}>
      <Text style={subStyles.statValue}>{value}</Text>
      <Text style={subStyles.statLabel}>{label}</Text>
    </View>
  );
}

const subStyles = StyleSheet.create({
  statItem: {
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,

  statValue: {
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.primary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,

  statLabel: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.medium,
    color: theme.colors.text.tertiary,
    marginTop: 2,
    letterSpacing: 0.3,
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StatsPanel({ stats, currentRank, puzzleKey }: Props) {
  /**
   * Derive the next rank tier.
   * This requires the full rank definitions, but StatsPanel only receives the
   * current tier. We expose nextTier as a prop-derivable value using the rank
   * tier list stored in currentRank. If that information is not available here,
   * the progress bar simply shows a "MAX" state.
   *
   * A parent can pass a `nextRank` prop when needed; for now we treat it as
   * unavailable (null) and let RankProgressBar show MAX when nextTier is null.
   */
  const nextRank: RankTier | null = null;

  const bestDisplay = formatTime(stats.best);

  const ao5Display = formatTime(stats.ao5);
  const ao12Display = formatTime(stats.ao12);
  const ao100Display = formatTime(stats.ao100);

  return (
    <Card style={styles.card}>
      {/* Puzzle label */}
      <Text style={styles.puzzleLabel}>{puzzleKey.toUpperCase()}</Text>

      {/* Best time — prominently displayed */}
      <View style={styles.bestSection}>
        <Text style={styles.bestLabel}>BEST</Text>
        <Text style={styles.bestTime}>{bestDisplay}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Averages row */}
      <View style={styles.averagesRow}>
        <StatItem label="ao5" value={ao5Display} />
        <View style={styles.verticalDivider} />
        <StatItem label="ao12" value={ao12Display} />
        <View style={styles.verticalDivider} />
        <StatItem label="ao100" value={ao100Display} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Rank section */}
      {currentRank ? (
        <View style={styles.rankSection}>
          <View style={styles.rankHeader}>
            <RankBadge tier={currentRank} size="md" showLabel />
            <View style={styles.rankMeta}>
              <Text style={styles.rankDescription} numberOfLines={2}>
                {currentRank.description}
              </Text>
              <Text style={styles.sessionCount}>
                {stats.count} {stats.count === 1 ? 'solve' : 'solves'}
              </Text>
            </View>
          </View>

          {stats.best !== null && (
            <View style={styles.progressSection}>
              <RankProgressBar
                currentTier={currentRank}
                nextTier={nextRank}
                currentBestMs={stats.best}
              />
            </View>
          )}
        </View>
      ) : (
        /* No rank yet — show session count only */
        <View style={styles.noRankSection}>
          <Text style={styles.noRankText}>Keep solving to earn your first rank!</Text>
          <Text style={styles.sessionCount}>
            {stats.count} {stats.count === 1 ? 'solve' : 'solves'}
          </Text>
        </View>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.sm,
  } as ViewStyle,

  puzzleLabel: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.accent.primary,
    letterSpacing: 1.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,

  bestSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  } as ViewStyle,

  bestLabel: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs,
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,

  bestTime: {
    fontSize: theme.font.size['4xl'],
    fontWeight: theme.font.weight.extrabold,
    color: theme.colors.text.primary,
    letterSpacing: -1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,

  divider: {
    height: 1,
    backgroundColor: theme.colors.border.subtle,
    marginVertical: theme.spacing.xs,
  } as ViewStyle,

  averagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  } as ViewStyle,

  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.border.subtle,
  } as ViewStyle,

  rankSection: {
    gap: theme.spacing.sm,
  } as ViewStyle,

  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  } as ViewStyle,

  rankMeta: {
    flex: 1,
    gap: theme.spacing.xs / 2,
  } as ViewStyle,

  rankDescription: {
    fontSize: theme.font.size.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.font.size.sm * theme.font.lineHeight.normal,
    includeFontPadding: false,
  } as TextStyle,

  sessionCount: {
    fontSize: theme.font.size.xs,
    color: theme.colors.text.tertiary,
    fontWeight: theme.font.weight.medium,
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,

  progressSection: {
    marginTop: theme.spacing.xs,
  } as ViewStyle,

  noRankSection: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  } as ViewStyle,

  noRankText: {
    fontSize: theme.font.size.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,
});
