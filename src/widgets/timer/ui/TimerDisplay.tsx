import React, { useEffect } from 'react';
import {
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { theme } from '../../../shared/config/theme';
import { TimerState } from '../../../shared/types';
import { formatTime, getRank } from '../../../entities/rank/model';
import { AppText } from '../../../shared/ui/Text';
import { RankBadge } from '../../stats-panel/ui/RankBadge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  timeMs: number;
  state: TimerState;
  inspectionSecondsLeft?: number;
  onPress: () => void;
  puzzleKey?: string; // e.g. '3x3' — used to look up rank when stopped
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatInspection(secondsLeft: number): string {
  if (secondsLeft <= 0) return 'DNF';
  return String(Math.ceil(secondsLeft));
}

// ---------------------------------------------------------------------------
// TimerDisplay
// ---------------------------------------------------------------------------

export function TimerDisplay({
  timeMs,
  state,
  inspectionSecondsLeft = 15,
  onPress,
  puzzleKey = '3x3',
}: Props) {
  const inspectionOpacity = useSharedValue(1);
  // 0 = accent color, 1 = success color (animated on stop)
  const stoppedProgress = useSharedValue(0);

  // Inspection: red pulsing animation
  useEffect(() => {
    if (state === 'inspection') {
      inspectionOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(inspectionOpacity);
      inspectionOpacity.value = withTiming(1, { duration: 150 });
    }
  }, [state, inspectionOpacity]);

  // Animate time text color: accent -> success on stop
  useEffect(() => {
    if (state === 'running') {
      stoppedProgress.value = 0;
    } else if (state === 'stopped') {
      stoppedProgress.value = withTiming(1, { duration: 400 });
    } else {
      stoppedProgress.value = 0;
    }
  }, [state, stoppedProgress]);

  const animatedTimeColor = useDerivedValue(() =>
    interpolateColor(
      stoppedProgress.value,
      [0, 1],
      [theme.colors.accent.primary, theme.colors.success],
    ),
  );

  const inspectionAnimStyle = useAnimatedStyle(() => ({
    opacity: state === 'inspection' ? inspectionOpacity.value : 1,
  }));

  const runningTimeAnimStyle = useAnimatedStyle(() => {
    if (state !== 'running' && state !== 'stopped') return {};
    return { color: animatedTimeColor.value };
  });

  // Determine display content
  let displayText: string;
  let staticTimeColor: string;

  switch (state) {
    case 'inspection':
      displayText = formatInspection(inspectionSecondsLeft);
      staticTimeColor =
        inspectionSecondsLeft <= 0
          ? theme.colors.error
          : inspectionSecondsLeft <= 3
          ? theme.colors.error
          : inspectionSecondsLeft <= 8
          ? theme.colors.warning
          : theme.colors.text.primary;
      break;

    case 'running':
      displayText = formatTime(timeMs);
      staticTimeColor = theme.colors.accent.primary; // overridden by animated style
      break;

    case 'stopped':
      displayText = formatTime(timeMs);
      staticTimeColor = theme.colors.success; // overridden by animated style
      break;

    case 'idle':
    default:
      displayText = '0.00';
      staticTimeColor = theme.colors.text.secondary;
      break;
  }

  const rank = state === 'stopped' ? getRank(puzzleKey, timeMs) : null;

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        state === 'idle'
          ? 'タップしてインスペクション開始'
          : state === 'inspection'
          ? 'タップしてタイマー開始'
          : state === 'running'
          ? 'タップしてタイマー停止'
          : 'タップしてリセット'
      }
    >
      <Animated.View style={[styles.inner, inspectionAnimStyle]}>
        {/* Inspection label */}
        {state === 'inspection' && (
          <AppText variant="caption" style={styles.inspectionLabel}>
            INSPECTION
          </AppText>
        )}

        {/* Main time display */}
        <Animated.Text
          style={[
            styles.timeText,
            { color: staticTimeColor },
            (state === 'running' || state === 'stopped') && runningTimeAnimStyle,
            state === 'inspection' && styles.inspectionTimeText,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {displayText}
        </Animated.Text>

        {/* Rank badge — shown only when stopped */}
        {state === 'stopped' && rank !== null && (
          <RankBadge tier={rank} size="md" showLabel />
        )}

        {/* Idle hint */}
        {state === 'idle' && (
          <AppText variant="caption" style={styles.hintText}>
            タップしてインスペクション開始
          </AppText>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  } as ViewStyle,

  inspectionLabel: {
    letterSpacing: 4,
    color: theme.colors.error,
    fontWeight: theme.font.weight.bold,
  } as TextStyle,

  timeText: {
    fontSize: 80,
    fontWeight: theme.font.weight.extrabold,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  inspectionTimeText: {
    fontSize: 120,
  } as TextStyle,

  hintText: {
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
  } as TextStyle,
});
