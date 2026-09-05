import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import type { SolveRecord, RankTier } from '../../../shared/types';
import { theme } from '../../../shared/config/theme';
import { RankBadge } from '../../../widgets/stats-panel/ui/RankBadge';
import { formatTime } from '../../../entities/rank/model';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  solve: SolveRecord;
  index: number;
  rank: RankTier | null;
  onDelete: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatSolveTime(solve: SolveRecord): string {
  if (solve.dnf) return 'DNF';
  const baseTime = solve.plusTwo ? solve.time + 2000 : solve.time;
  return formatTime(baseTime);
}

// ---------------------------------------------------------------------------
// Detail Modal
// ---------------------------------------------------------------------------

interface DetailModalProps {
  solve: SolveRecord;
  rank: RankTier | null;
  onClose: () => void;
}

function DetailModal({ solve, rank, onClose }: DetailModalProps) {
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={modalStyles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={modalStyles.container}>
          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>ソルブの詳細</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View style={modalStyles.timeSection}>
            <Text style={modalStyles.timeValue}>{formatSolveTime(solve)}</Text>
            <View style={modalStyles.badgeRow}>
              {solve.dnf && (
                <View style={[modalStyles.badge, modalStyles.dnfBadge]}>
                  <Text style={modalStyles.badgeText}>DNF</Text>
                </View>
              )}
              {solve.plusTwo && !solve.dnf && (
                <View style={[modalStyles.badge, modalStyles.plusTwoBadge]}>
                  <Text style={modalStyles.badgeText}>+2</Text>
                </View>
              )}
              {rank && (
                <RankBadge tier={rank} size="sm" showLabel={false} />
              )}
            </View>
          </View>

          {/* Meta */}
          <View style={modalStyles.metaSection}>
            <View style={modalStyles.metaRow}>
              <Text style={modalStyles.metaLabel}>日付</Text>
              <Text style={modalStyles.metaValue}>{formatDateTime(solve.date)}</Text>
            </View>
            <View style={modalStyles.metaRow}>
              <Text style={modalStyles.metaLabel}>パズル</Text>
              <Text style={modalStyles.metaValue}>
                {solve.cubeSize}x{solve.cubeSize}
              </Text>
            </View>
          </View>

          {/* Scramble */}
          <View style={modalStyles.scrambleSection}>
            <Text style={modalStyles.scrambleLabel}>スクランブル</Text>
            <ScrollView style={modalStyles.scrambleScroll} showsVerticalScrollIndicator={false}>
              <Text style={modalStyles.scrambleText} selectable>
                {solve.scramble}
              </Text>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  } as ViewStyle,

  container: {
    width: '100%',
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadow.lg,
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,

  title: {
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.primary,
    includeFontPadding: false,
  } as TextStyle,

  closeButton: {
    fontSize: theme.font.size.md,
    color: theme.colors.text.tertiary,
    fontWeight: theme.font.weight.bold,
    includeFontPadding: false,
  } as TextStyle,

  timeSection: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  } as ViewStyle,

  timeValue: {
    fontSize: theme.font.size['4xl'],
    fontWeight: theme.font.weight.extrabold,
    color: theme.colors.text.primary,
    letterSpacing: -1,
    includeFontPadding: false,
  } as TextStyle,

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  } as ViewStyle,

  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  } as ViewStyle,

  dnfBadge: {
    backgroundColor: 'rgba(255, 59, 92, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.error,
  } as ViewStyle,

  plusTwoBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.warning,
  } as ViewStyle,

  badgeText: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.primary,
    includeFontPadding: false,
  } as TextStyle,

  metaSection: {
    gap: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    paddingTop: theme.spacing.sm,
  } as ViewStyle,

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  metaLabel: {
    fontSize: theme.font.size.sm,
    color: theme.colors.text.tertiary,
    includeFontPadding: false,
  } as TextStyle,

  metaValue: {
    fontSize: theme.font.size.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.font.weight.medium,
    includeFontPadding: false,
  } as TextStyle,

  scrambleSection: {
    gap: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    paddingTop: theme.spacing.sm,
  } as ViewStyle,

  scrambleLabel: {
    fontSize: theme.font.size.sm,
    color: theme.colors.text.tertiary,
    fontWeight: theme.font.weight.medium,
    letterSpacing: 0.5,
    includeFontPadding: false,
  } as TextStyle,

  scrambleScroll: {
    maxHeight: 120,
  } as ViewStyle,

  scrambleText: {
    fontSize: theme.font.size.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.font.size.sm * theme.font.lineHeight.relaxed,
    fontFamily: 'monospace',
    includeFontPadding: false,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SolveListItem({ solve, index, rank, onDelete }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);

  const timeDisplay = formatSolveTime(solve);

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => {
        swipeableRef.current?.close();
        onDelete(solve.id);
      }}
    >
      <Ionicons name="trash-outline" size={18} color={theme.colors.text.inverse} />
      <Text style={styles.deleteButtonText}>削除</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.wrapper}>
        <Swipeable
          ref={swipeableRef}
          renderRightActions={renderRightActions}
          overshootRight={false}
          rightThreshold={40}
        >
          {/* Main row */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setShowDetail(true)}
          >
            {/* Index */}
            <Text style={styles.indexText}>#{index + 1}</Text>

            {/* Time + badges */}
            <View style={styles.timeSection}>
              <Text style={[styles.timeText, solve.dnf && styles.dnfText]}>
                {timeDisplay}
              </Text>
              <View style={styles.badgesRow}>
                {solve.dnf && (
                  <View style={[styles.badge, styles.dnfBadge]}>
                    <Text style={styles.badgeText}>DNF</Text>
                  </View>
                )}
                {solve.plusTwo && !solve.dnf && (
                  <View style={[styles.badge, styles.plusTwoBadge]}>
                    <Text style={styles.badgeText}>+2</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Date */}
            <Text style={styles.dateText}>{formatDate(solve.date)}</Text>

            {/* Rank badge */}
            {rank && (
              <View style={styles.rankContainer}>
                <RankBadge tier={rank} size="sm" showLabel={false} />
              </View>
            )}
          </TouchableOpacity>
        </Swipeable>
      </View>

      {showDetail && (
        <DetailModal
          solve={solve}
          rank={rank}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs / 2,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  } as ViewStyle,

  deleteButton: {
    width: 80,
    height: '100%',
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  } as ViewStyle,

  deleteButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
    includeFontPadding: false,
  } as TextStyle,

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    gap: theme.spacing.sm,
  } as ViewStyle,

  indexText: {
    fontSize: theme.font.size.sm,
    color: theme.colors.text.tertiary,
    fontWeight: theme.font.weight.medium,
    width: 36,
    includeFontPadding: false,
  } as TextStyle,

  timeSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  } as ViewStyle,

  timeText: {
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.primary,
    includeFontPadding: false,
    letterSpacing: -0.3,
  } as TextStyle,

  dnfText: {
    color: theme.colors.error,
  } as TextStyle,

  badgesRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs / 2,
  } as ViewStyle,

  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: theme.radius.sm,
  } as ViewStyle,

  dnfBadge: {
    backgroundColor: 'rgba(255, 59, 92, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.error,
  } as ViewStyle,

  plusTwoBadge: {
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    borderWidth: 1,
    borderColor: theme.colors.warning,
  } as ViewStyle,

  badgeText: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.primary,
    includeFontPadding: false,
  } as TextStyle,

  dateText: {
    fontSize: theme.font.size.xs,
    color: theme.colors.text.tertiary,
    includeFontPadding: false,
  } as TextStyle,

  rankContainer: {
    marginLeft: theme.spacing.xs,
  } as ViewStyle,
});
