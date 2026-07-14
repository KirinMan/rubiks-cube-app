import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useCubeStore } from '../../../entities/cube/model';
import { useRank } from '../../../features/rank/model';
import { InteractiveCubeView } from '../../../widgets/cube-viewer/ui';
import { RankBadge } from '../../../widgets/stats-panel/ui/RankBadge';
import { theme } from '../../../shared/config/theme';
import { CUBE_CONFIGS } from '../../../shared/config/constants';
import type { CubeSize } from '../../../shared/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The cube size used as puzzleKey for rank lookup. */
function puzzleKeyFromSize(size: CubeSize): string {
  return `${size}x${size}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PuzzleTabProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function PuzzleTab({ label, selected, onPress }: PuzzleTabProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.puzzleTab, selected && styles.puzzleTabSelected]}
    >
      <Text style={[styles.puzzleTabText, selected && styles.puzzleTabTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface HomePageProps {
  onStartSolve?: () => void;
  onHistory?: () => void;
}

export function HomePage({ onStartSolve, onHistory }: HomePageProps) {
  // ---- Cube store ----
  const { cubeState, cubeSize, setCubeSize } = useCubeStore();
  const [selectedSize, setSelectedSize] = useState<CubeSize>(cubeSize);

  const puzzleKey = puzzleKeyFromSize(selectedSize);
  const { currentRank, bestFormatted } = useRank(puzzleKey);

  // ---- Auto-rotation animation ----
  // We cycle a value 0->1 continuously and derive a viewSize offset that
  // gives the illusion of slow rotation by scaling the IsoCubeView.
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotateAnim]);

  // Derive a subtle scale pulse from the rotation value to suggest 3-D spin.
  const scaleAnim = rotateAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 1.04, 1, 0.96, 1],
  });

  // ---- Puzzle selection ----
  const handleSelectSize = useCallback(
    (size: CubeSize) => {
      setSelectedSize(size);
      setCubeSize(size);
    },
    [setCubeSize],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bg.primary} />

      <View style={styles.root}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerLogo}>🎲</Text>
          <Text style={styles.headerTitle}>RubiksMaster</Text>
        </View>

        {/* ── Puzzle selection tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          style={styles.tabsScrollView}
        >
          {CUBE_CONFIGS.map((config) => (
            <PuzzleTab
              key={config.size}
              label={config.label}
              selected={selectedSize === config.size}
              onPress={() => handleSelectSize(config.size as CubeSize)}
            />
          ))}
        </ScrollView>

        <View style={styles.divider} />

        {/* ── IsoCubeView with rotation animation ── */}
        <View style={styles.cubeSection}>
          <Animated.View style={[styles.cubeWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <InteractiveCubeView state={cubeState} size={selectedSize} viewSize={240} />
          </Animated.View>
        </View>

        <View style={styles.divider} />

        {/* ── Stats summary ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ベスト</Text>
            <Text style={styles.statValue}>{bestFormatted ?? '--:--'}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ランク</Text>
            {currentRank ? (
              <RankBadge tier={currentRank} size="sm" showLabel={false} />
            ) : (
              <Text style={styles.statValue}>--</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── CTA buttons ── */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onStartSolve}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>🎲  Start Solve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onHistory}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>📊  History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  } as ViewStyle,

  root: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  } as ViewStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  } as ViewStyle,

  headerLogo: {
    fontSize: theme.font.size['2xl'],
    marginRight: theme.spacing.sm,
  } as TextStyle,

  headerTitle: {
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.primary,
    letterSpacing: 0.4,
  } as TextStyle,

  // Tabs
  tabsScrollView: {
    flexGrow: 0,
    backgroundColor: theme.colors.bg.secondary,
  } as ViewStyle,

  tabsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  } as ViewStyle,

  puzzleTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: 'transparent',
  } as ViewStyle,

  puzzleTabSelected: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  } as ViewStyle,

  puzzleTabText: {
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.medium,
    color: theme.colors.text.secondary,
  } as TextStyle,

  puzzleTabTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: theme.font.weight.bold,
  } as TextStyle,

  // Divider
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.subtle,
  } as ViewStyle,

  // Cube section
  cubeSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.bg.primary,
  } as ViewStyle,

  cubeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.bg.elevated,
  } as ViewStyle,

  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  } as ViewStyle,

  statLabel: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.medium,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,

  statValue: {
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.primary,
    letterSpacing: 0.2,
  } as TextStyle,

  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.border.subtle,
    marginHorizontal: theme.spacing.md,
  } as ViewStyle,

  // CTA
  ctaSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.bg.secondary,
  } as ViewStyle,

  primaryButton: {
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.md,
  } as ViewStyle,

  primaryButtonText: {
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  } as TextStyle,

  secondaryButton: {
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  } as ViewStyle,

  secondaryButtonText: {
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.semibold,
    color: theme.colors.text.secondary,
    letterSpacing: 0.3,
  } as TextStyle,
});
