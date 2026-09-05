import React, { useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../../shared/config/theme';
import { AppText } from '../../../shared/ui/Text';
import { Button } from '../../../shared/ui/Button';
import { CubeFaceGrid } from '../../cube-viewer/ui/CubeFaceGrid';
import { createSolvedCube, applyMoves, parseMove } from '../../../shared/lib/cube-logic';
import { CubeState } from '../../../shared/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  scramble: string; // e.g. "R U R' U' F2 Lw ..."
  onNewScramble: () => void;
}

interface MoveToken {
  notation: string;
  isInverse: boolean; // ends with '
  isWide: boolean;    // contains 'w'
  isDouble: boolean;  // ends with 2
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tokenize(scramble: string): MoveToken[] {
  return scramble
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((notation) => ({
      notation,
      isInverse: notation.endsWith("'"),
      isWide: notation.toLowerCase().includes('w'),
      isDouble: notation.endsWith('2'),
    }));
}

/**
 * Parse the scramble string and compute the resulting CubeState on a 3x3.
 * Falls back to a solved cube if any token fails to parse.
 */
function computeScrambledState(scramble: string): CubeState {
  try {
    const moves = scramble
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => parseMove(n));
    return applyMoves(createSolvedCube(3), moves, 3);
  } catch {
    return createSolvedCube(3);
  }
}

// ---------------------------------------------------------------------------
// MoveChip
// ---------------------------------------------------------------------------

function MoveChip({ token }: { token: MoveToken }) {
  let backgroundColor: string;
  let borderColor: string;
  let textColor: string;

  if (token.isInverse) {
    backgroundColor = 'rgba(239, 68, 68, 0.12)';
    borderColor = theme.colors.error;
    textColor = '#FF8080';
  } else if (token.isWide) {
    backgroundColor = 'rgba(108, 99, 255, 0.15)';
    borderColor = theme.colors.accent.primary;
    textColor = theme.colors.accent.secondary;
  } else if (token.isDouble) {
    backgroundColor = 'rgba(245, 158, 11, 0.12)';
    borderColor = theme.colors.warning;
    textColor = theme.colors.warning;
  } else {
    backgroundColor = theme.colors.bg.elevated;
    borderColor = theme.colors.border.default;
    textColor = theme.colors.text.primary;
  }

  return (
    <View style={[styles.chip, { backgroundColor, borderColor }]}>
      <AppText
        variant="label"
        style={[styles.chipText, { color: textColor }]}
      >
        {token.notation}
      </AppText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ScrambleDisplay
// ---------------------------------------------------------------------------

export function ScrambleDisplay({ scramble, onNewScramble }: Props) {
  const tokens = useMemo(() => tokenize(scramble), [scramble]);
  const scrambledState = useMemo(() => computeScrambledState(scramble), [scramble]);

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <AppText variant="caption" style={styles.headerLabel}>
          SCRAMBLE
        </AppText>
        <Button
          label="新しいスクランブル"
          onPress={onNewScramble}
          variant="ghost"
          size="sm"
        />
      </View>

      {/* Horizontally scrollable chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContent}
        style={styles.chipsScroll}
        accessibilityLabel="スクランブル手順"
      >
        {tokens.map((token, index) => (
          <MoveChip key={`${index}-${token.notation}`} token={token} />
        ))}
      </ScrollView>

      {/* Preview row: raw text + cube state mini-preview */}
      <View style={styles.previewRow}>
        <AppText variant="caption" style={styles.rawScramble} numberOfLines={2}>
          {scramble}
        </AppText>

        {/* Cube face grid preview (small cell size) */}
        <View style={styles.cubePreviewWrapper}>
          <CubeFaceGrid
            state={scrambledState}
            size={3}
            cellSize={8}
          />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: 'hidden',
    ...theme.shadow.sm,
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  } as ViewStyle,

  headerLabel: {
    letterSpacing: 2,
    fontWeight: theme.font.weight.semibold,
    color: theme.colors.text.tertiary,
  } as TextStyle,

  chipsScroll: {
    flexGrow: 0,
  } as ViewStyle,

  chipsContent: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    alignItems: 'center',
  } as ViewStyle,

  chip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  chipText: {
    fontWeight: theme.font.weight.semibold,
    fontVariant: ['tabular-nums'],
    fontSize: theme.font.size.sm,
  } as TextStyle,

  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  } as ViewStyle,

  rawScramble: {
    flex: 1,
    color: theme.colors.text.tertiary,
    lineHeight: theme.font.size.xs * theme.font.lineHeight.relaxed,
  } as TextStyle,

  cubePreviewWrapper: {
    opacity: 0.85,
  } as ViewStyle,
});
