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
import { Ionicons } from '@expo/vector-icons';
import { useCubeStore } from '../../../entities/cube/model';
import { useRank } from '../../../features/rank/model';
import { useSolveHistory } from '../../../features/timer-control/model';
import { formatTime } from '../../../entities/rank/model';
import { IsoCubeView } from '../../../widgets/cube-viewer/ui';
import { RankBadge } from '../../../widgets/stats-panel/ui/RankBadge';
import { theme } from '../../../shared/config/theme';
import { GradientText } from '../../../shared/ui/GradientText';
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
  onFreeMode?: () => void;
}

export function HomePage({ onStartSolve, onHistory, onFreeMode }: HomePageProps) {
  // ---- Cube store ----
  const { cubeState, cubeSize, setCubeSize } = useCubeStore();
  const [selectedSize, setSelectedSize] = useState<CubeSize>(cubeSize);

  const puzzleKey = puzzleKeyFromSize(selectedSize);
  const { currentRank, bestFormatted } = useRank(puzzleKey);
  const { solves } = useSolveHistory(puzzleKey);
  const lastSolve = solves[0] ?? null;

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
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.bg.primary} />

      <View style={styles.root}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLogoBadge}>
            <Ionicons name="cube" size={20} color={theme.colors.text.primary} />
          </View>
          <GradientText style={styles.headerTitle}>RubiksMaster</GradientText>
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

        {/* ── ヒーローカード: 小さめのキューブプレビュー(タップでStart Solve) +
               ベスト/ランク + 前回のソルブ。旧デザインは巨大な装飾キューブが
               画面の大半を占めるだけで何もしてくれなかったため、実用的な
               情報と1タップアクションを兼ねるカードにまとめた。 ── */}
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollBodyContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.heroCard}
            onPress={onStartSolve}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="タップしてソルブを開始"
          >
            <View style={styles.heroCubeArea}>
              <View style={styles.cubeGlowRing} pointerEvents="none" />
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <IsoCubeView state={cubeState} size={selectedSize} viewSize={108} />
              </Animated.View>
            </View>

            <View style={styles.heroStatsArea}>
              <View style={styles.heroStatRow}>
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

              <View style={styles.lastSolveRow}>
                <Ionicons name="time-outline" size={14} color={theme.colors.text.tertiary} />
                <Text style={styles.lastSolveText}>
                  {lastSolve
                    ? `前回 ${formatTime(lastSolve.time)}${lastSolve.dnf ? ' (DNF)' : ''}`
                    : 'まだ記録がありません'}
                </Text>
              </View>
            </View>

            <View style={styles.heroTapHint}>
              <Ionicons name="play-circle" size={30} color={theme.colors.accent.primary} />
            </View>
          </TouchableOpacity>

          {/* ── Primary CTA ── */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onStartSolve}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={18} color={theme.colors.text.inverse} style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>ソルブ開始</Text>
          </TouchableOpacity>

          {/* ── Secondary actions: 横並びタイルにして、Start Solveが主役だと
                 分かりやすくする(旧デザインは3つの全幅ボタンが縦に並び、
                 重要度の差が視覚的に伝わらなかった) ── */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={styles.secondaryTile}
              onPress={onHistory}
              activeOpacity={0.8}
            >
              <Ionicons name="stats-chart" size={20} color={theme.colors.accent.secondary} />
              <Text style={styles.secondaryTileText}>履歴</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryTile}
              onPress={onFreeMode}
              activeOpacity={0.8}
            >
              <Ionicons name="extension-puzzle" size={20} color={theme.colors.accent.tertiary} />
              <Text style={styles.secondaryTileText}>フリーモード</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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

  headerLogoBadge: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    ...theme.glow.violet,
  } as ViewStyle,

  headerTitle: {
    fontSize: theme.font.size['2xl'],
    fontWeight: theme.font.weight.extrabold,
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
    ...theme.glow.violet,
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

  // Scroll body
  scrollBody: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
  } as ViewStyle,

  scrollBodyContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  } as ViewStyle,

  // ── ヒーローカード ──
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadow.md,
  } as ViewStyle,

  heroCubeArea: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // キューブの背後に漂わせる、柔らかいキャンディカラーの光の輪
  cubeGlowRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: theme.colors.accent.secondary,
    opacity: 0.22,
  } as ViewStyle,

  heroStatsArea: {
    flex: 1,
    gap: theme.spacing.sm,
  } as ViewStyle,

  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  lastSolveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,

  lastSolveText: {
    fontSize: theme.font.size.xs,
    color: theme.colors.text.tertiary,
    includeFontPadding: false,
  } as TextStyle,

  heroTapHint: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Stats
  statItem: {
    alignItems: 'flex-start',
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
    color: theme.colors.neon.cyan,
    letterSpacing: 0.2,
  } as TextStyle,

  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.border.subtle,
    marginHorizontal: theme.spacing.md,
  } as ViewStyle,

  // ── CTA ──
  buttonIcon: {
    marginRight: theme.spacing.xs,
  } as TextStyle,

  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.glow.pink,
  } as ViewStyle,

  primaryButtonText: {
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.inverse,
    letterSpacing: 0.3,
  } as TextStyle,

  // ── Secondary actions(横並びタイル) ──
  secondaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  } as ViewStyle,

  secondaryTile: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  } as ViewStyle,

  secondaryTileText: {
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.semibold,
    color: theme.colors.text.secondary,
    letterSpacing: 0.2,
  } as TextStyle,
});
