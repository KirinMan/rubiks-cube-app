import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../../shared/config/theme';
import { AppText } from '../../../shared/ui/Text';
import { Button } from '../../../shared/ui/Button';
import { RankBadge } from '../../../widgets/stats-panel/ui';
import { formatTime, getRank } from '../../../entities/rank/model';
import type { RankTier, SolveStats } from '../../../shared/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  visible: boolean;
  timeMs: number;
  isDNF: boolean;
  isPlusTwo: boolean;
  stats: SolveStats;
  puzzleKey: string;
  onNextSolve: () => void;
  onGoHome: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatStatTime(ms: number | null): string {
  if (ms === null) return '-';
  return formatTime(ms);
}

// ---------------------------------------------------------------------------
// SolveResultModal
// ---------------------------------------------------------------------------

export function SolveResultModal({
  visible,
  timeMs,
  isDNF,
  isPlusTwo,
  stats,
  puzzleKey,
  onNextSolve,
  onGoHome,
}: Props) {
  // Animation values
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);

  const rank: RankTier | null = isDNF ? null : getRank(puzzleKey, timeMs);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
      cardScale.value = withSpring(1, { damping: 16, stiffness: 200 });
      cardOpacity.value = withTiming(1, { duration: 200 });
      badgeScale.value = withDelay(
        300,
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = withTiming(0.85, { duration: 180 });
      cardOpacity.value = withTiming(0, { duration: 180 });
      badgeScale.value = 0;
    }
  }, [visible, backdropOpacity, cardScale, cardOpacity, badgeScale]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  // Time display
  const displayTime = isDNF ? 'DNF' : isPlusTwo ? `${formatTime(timeMs)} +2` : formatTime(timeMs);
  const timeColor = isDNF
    ? theme.colors.error
    : isPlusTwo
    ? theme.colors.warning
    : theme.colors.success;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onGoHome}
    >
      <TouchableWithoutFeedback onPress={onGoHome}>
        <View style={styles.overlay}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />

          <TouchableWithoutFeedback>
            <Animated.View style={[styles.card, cardStyle]}>
              {/* Title */}
              <AppText variant="caption" style={styles.titleLabel}>
                ソルブ完了
              </AppText>

              {/* Main time */}
              <AppText
                variant="h1"
                style={[styles.timeText, { color: timeColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {displayTime}
              </AppText>

              {/* Rank badge */}
              {rank !== null && (
                <Animated.View style={[styles.badgeWrapper, badgeStyle]}>
                  <RankBadge tier={rank} size="lg" showLabel />
                </Animated.View>
              )}

              {/* Divider */}
              <View style={styles.divider} />

              {/* Stats row */}
              <View style={styles.statsRow}>
                <StatItem label="ao5" value={formatStatTime(stats.ao5)} />
                <StatItem label="ao12" value={formatStatTime(stats.ao12)} />
                <StatItem label="ベスト" value={formatStatTime(stats.best)} />
              </View>

              {/* Buttons */}
              <View style={styles.buttonStack}>
                <Button
                  label="次のソルブ"
                  onPress={onNextSolve}
                  variant="primary"
                  size="lg"
                  fullWidth
                />
                <Button
                  label="ホームに戻る"
                  onPress={onGoHome}
                  variant="ghost"
                  size="md"
                  fullWidth
                />
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// StatItem
// ---------------------------------------------------------------------------

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <AppText variant="caption" style={styles.statLabel}>
        {label.toUpperCase()}
      </AppText>
      <AppText variant="h3" style={styles.statValue}>
        {value}
      </AppText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  } as ViewStyle,

  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  } as ViewStyle,

  card: {
    width: '100%',
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadow.lg,
  } as ViewStyle,

  titleLabel: {
    letterSpacing: 3,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.tertiary,
  } as TextStyle,

  timeText: {
    fontSize: 64,
    fontWeight: theme.font.weight.extrabold,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  } as TextStyle,

  badgeWrapper: {
    marginVertical: theme.spacing.sm,
  } as ViewStyle,

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.border.subtle,
    marginVertical: theme.spacing.sm,
  } as ViewStyle,

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: theme.spacing.sm,
  } as ViewStyle,

  statItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  } as ViewStyle,

  statLabel: {
    letterSpacing: 1.5,
    color: theme.colors.text.tertiary,
  } as TextStyle,

  statValue: {
    fontVariant: ['tabular-nums'],
    color: theme.colors.text.primary,
  } as TextStyle,

  buttonStack: {
    width: '100%',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  } as ViewStyle,
});
