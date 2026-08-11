import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ViewStyle,
  TextStyle,
  useWindowDimensions,
} from 'react-native';
import { useCubeStore } from '../../../entities/cube/model';
import { useTimerStore } from '../../../features/timer-control/model/timerStore';
import { useSolveHistoryStore } from '../../../features/timer-control/model/solveHistoryStore';
import { Cube3DView } from '../../../widgets/cube-viewer-3d/ui';
import { TimerDisplay } from '../../../widgets/timer/ui';
import { ScrambleDisplay } from '../../../widgets/scramble-display/ui';
import { theme } from '../../../shared/config/theme';
import { AppText } from '../../../shared/ui/Text';
import { Button } from '../../../shared/ui/Button';
import { isSolved, parseMove } from '../../../shared/lib/cube-logic';
import { generateScrambleNotation } from '../../../features/scramble/model';
import { generateId } from '../../../entities/solve/model';
import { parsePuzzleKey } from '../../../entities/rank/model';
import { calculateStats } from '../../../entities/solve/model';
import type { Move } from '../../../shared/types';
import { SolveResultModal } from './SolveResultModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  onBack?: () => void;
  /** 'timed' = 通常のタイムアタック。'free' = タイマー・履歴保存なしの練習モード。 */
  mode?: 'timed' | 'free';
}

// ---------------------------------------------------------------------------
// GamePage
// ---------------------------------------------------------------------------

export function GamePage({ onBack, mode = 'timed' }: Props) {
  const { width } = useWindowDimensions();
  const isFree = mode === 'free';

  // Stores
  const cubeStore = useCubeStore();
  const timerStore = useTimerStore();
  const historyStore = useSolveHistoryStore();

  // Scramble
  const [scramble, setScramble] = useState<string>(() =>
    generateScrambleNotation(cubeStore.cubeSize),
  );

  // Result modal
  const [resultVisible, setResultVisible] = useState(false);
  const resultShownRef = useRef(false);

  // Puzzle key e.g. "3x3"
  const puzzleKey = parsePuzzleKey(cubeStore.cubeSize);

  // 初回マウント時にスクランブルをキューブに適用
  const scrambleAppliedRef = useRef(false);
  useEffect(() => {
    if (!scrambleAppliedRef.current && scramble) {
      scrambleAppliedRef.current = true;
      const moves = scramble.trim().split(/\s+/).filter(Boolean).map((n) => parseMove(n));
      cubeStore.scramble(moves);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load solve history on mount
  useEffect(() => {
    if (isFree) return;
    historyStore.loadSolves(puzzleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleKey, isFree]);

  // Solve detection: when timer is running and cube becomes solved
  useEffect(() => {
    if (isFree) return;
    if (timerStore.state !== 'running') return;
    if (isSolved(cubeStore.cubeState) && !resultShownRef.current) {
      timerStore.stopTimer();
    }
  }, [cubeStore.cubeState, timerStore, isFree]);

  // Show result modal when timer stops
  useEffect(() => {
    if (isFree) return;
    if (timerStore.state !== 'stopped') return;
    if (resultShownRef.current) return;

    const solve = timerStore.currentSolve;
    if (!solve || solve.time === undefined) return;

    // Save to history
    const record = {
      id: generateId(),
      puzzleType: cubeStore.puzzleType,
      cubeSize: cubeStore.cubeSize,
      time: solve.time,
      scramble,
      date: new Date().toISOString(),
      dnf: solve.dnf ?? false,
      plusTwo: solve.plusTwo ?? false,
    };
    historyStore.addSolve(record);

    resultShownRef.current = true;
    setResultVisible(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStore.state]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleTimerPress = useCallback(() => {
    const { state } = timerStore;
    if (state === 'idle' || state === 'stopped') {
      timerStore.startInspection();
    } else if (state === 'inspection') {
      timerStore.startTimer();
    } else if (state === 'running') {
      timerStore.stopTimer();
    }
  }, [timerStore]);

  const handleReset = useCallback(() => {
    timerStore.resetTimer();
    cubeStore.reset();
    resultShownRef.current = false;
    const newScramble = generateScrambleNotation(cubeStore.cubeSize);
    setScramble(newScramble);
    // スクランブルをキューブに適用
    const moves = newScramble.trim().split(/\s+/).filter(Boolean).map((n) => parseMove(n));
    cubeStore.scramble(moves);
  }, [timerStore, cubeStore]);

  const handleNewScramble = useCallback(() => {
    timerStore.resetTimer();
    cubeStore.reset();
    resultShownRef.current = false;
    const newScramble = generateScrambleNotation(cubeStore.cubeSize);
    setScramble(newScramble);
    // Apply scramble to cube store
    cubeStore.scramble(
      newScramble.trim().split(/\s+/).filter(Boolean).map((n) => parseMove(n)),
    );
  }, [timerStore, cubeStore]);

  const handleUndo = useCallback(() => {
    if (isFree || timerStore.state === 'stopped') {
      cubeStore.undo();
    }
  }, [isFree, timerStore.state, cubeStore]);

  const handleCubeMove = useCallback(
    (move: Move) => {
      cubeStore.applyMove(move);
    },
    [cubeStore],
  );

  const handleDNF = useCallback(() => {
    timerStore.markDNF();
  }, [timerStore]);

  const handlePlusTwo = useCallback(() => {
    timerStore.markPlusTwo();
  }, [timerStore]);

  const handleNextSolve = useCallback(() => {
    setResultVisible(false);
    resultShownRef.current = false;
    timerStore.resetTimer();
    cubeStore.reset();
    const newScramble = generateScrambleNotation(cubeStore.cubeSize);
    setScramble(newScramble);
  }, [timerStore, cubeStore]);

  const handleGoHome = useCallback(() => {
    setResultVisible(false);
    resultShownRef.current = false;
    timerStore.resetTimer();
    cubeStore.reset();
    onBack?.();
  }, [timerStore, cubeStore, onBack]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const { state: timerState, elapsedMs, inspectionMs, currentSolve } = timerStore;

  const displayElapsedMs =
    currentSolve?.plusTwo ? elapsedMs + 2000 : elapsedMs;

  const inspectionSecondsLeft = Math.ceil(inspectionMs / 1000);

  const isStopped = timerState === 'stopped';
  const isRunning = timerState === 'running';
  const isInspection = timerState === 'inspection';
  const isIdle = timerState === 'idle';

  // Stats for result modal
  const solves = historyStore.solves[puzzleKey] ?? [];
  const stats = calculateStats(solves);

  // Cube view size
  const cubeViewSize = Math.min(width * 0.75, 300);

  // Info text
  let infoText: string | null = null;
  if (isIdle) infoText = 'タップでインスペクション開始';
  else if (isInspection) infoText = 'タップでタイマー開始';
  else if (isRunning) infoText = 'タップで停止';

  const puzzleLabel = isFree
    ? `${cubeStore.cubeSize}×${cubeStore.cubeSize} フリーモード`
    : `${cubeStore.cubeSize}×${cubeStore.cubeSize}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="戻る"
          >
            <AppText variant="label" style={styles.backText}>
              ← Back
            </AppText>
          </Pressable>

          <AppText variant="label" style={styles.puzzleLabel}>
            {puzzleLabel}
          </AppText>

          <Pressable
            onPress={handleReset}
            style={styles.resetButton}
            accessibilityRole="button"
            accessibilityLabel="リセット"
          >
            <AppText variant="label" style={styles.resetText}>
              Reset
            </AppText>
          </Pressable>
        </View>

        {/* ── Scramble display ───────────────────────────── */}
        <View style={styles.scrambleWrapper}>
          <ScrambleDisplay
            scramble={scramble}
            onNewScramble={handleNewScramble}
          />
        </View>

        {/* ── Cube view ──────────────────────────────────── */}
        <View style={styles.cubeWrapper}>
          <Cube3DView
            cubeState={cubeStore.cubeState}
            size={cubeStore.cubeSize}
            viewSize={cubeViewSize}
            interactive={isFree || isRunning}
            onMove={handleCubeMove}
          />
        </View>

        {/* ── Timer section ──────────────────────────────── */}
        {!isFree && (
          <View style={styles.timerSection}>
            <TimerDisplay
              timeMs={displayElapsedMs}
              state={timerState}
              inspectionSecondsLeft={inspectionSecondsLeft}
              onPress={handleTimerPress}
              puzzleKey={puzzleKey}
            />
          </View>
        )}

        {/* ── Info / Controls ────────────────────────────── */}
        <View style={styles.bottomSection}>
          {isFree ? (
            <View style={styles.controlsRow}>
              <AppText variant="caption" style={styles.infoText}>
                {cubeStore.moveHistory.length}手
              </AppText>
              <Button
                label="Undo"
                onPress={handleUndo}
                variant="ghost"
                size="sm"
                style={styles.controlButton}
              />
            </View>
          ) : (
            <>
              {infoText !== null && !isStopped && (
                <AppText variant="caption" style={styles.infoText}>
                  {infoText}
                </AppText>
              )}

              {isStopped && (
                <View style={styles.controlsRow}>
                  <Button
                    label="DNF"
                    onPress={handleDNF}
                    variant={currentSolve?.dnf ? 'danger' : 'secondary'}
                    size="sm"
                    style={styles.controlButton}
                  />
                  <Button
                    label="+2"
                    onPress={handlePlusTwo}
                    variant={currentSolve?.plusTwo ? 'secondary' : 'ghost'}
                    size="sm"
                    style={styles.controlButton}
                  />
                  <Button
                    label="Undo"
                    onPress={handleUndo}
                    variant="ghost"
                    size="sm"
                    style={styles.controlButton}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </View>

      {/* ── Result Modal ───────────────────────────────── */}
      {!isFree && (
        <SolveResultModal
          visible={resultVisible}
          timeMs={displayElapsedMs}
          isDNF={currentSolve?.dnf ?? false}
          isPlusTwo={currentSolve?.plusTwo ?? false}
          stats={stats}
          puzzleKey={puzzleKey}
          onNextSolve={handleNextSolve}
          onGoHome={handleGoHome}
        />
      )}
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

  container: {
    flex: 1,
    flexDirection: 'column',
  } as ViewStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  } as ViewStyle,

  backButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    minWidth: 70,
  } as ViewStyle,

  backText: {
    color: theme.colors.accent.secondary,
  } as TextStyle,

  puzzleLabel: {
    color: theme.colors.text.primary,
    fontWeight: theme.font.weight.semibold,
    fontSize: theme.font.size.lg,
  } as TextStyle,

  resetButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    minWidth: 70,
    alignItems: 'flex-end',
  } as ViewStyle,

  resetText: {
    color: theme.colors.text.secondary,
  } as TextStyle,

  // Scramble
  scrambleWrapper: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  } as ViewStyle,

  // Cube
  cubeWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  } as ViewStyle,

  // Timer
  timerSection: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  } as ViewStyle,

  // Bottom
  bottomSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  infoText: {
    color: theme.colors.text.tertiary,
    letterSpacing: 0.5,
    textAlign: 'center',
  } as TextStyle,

  controlsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    flexWrap: 'wrap',
  } as ViewStyle,

  controlButton: {
    minWidth: 80,
  } as ViewStyle,
});
