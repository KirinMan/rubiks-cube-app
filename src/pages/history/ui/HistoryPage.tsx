import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  ViewStyle,
  TextStyle,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSolveHistoryStore } from '../../../features/timer-control/model/solveHistoryStore';
import { calculateStats } from '../../../entities/solve/model';
import { getRank } from '../../../entities/rank/model';
import { StatsPanel } from '../../../widgets/stats-panel/ui';
import type { SolveRecord, CubeSize, RankTier } from '../../../shared/types';
import { theme } from '../../../shared/config/theme';
import { CUBE_CONFIGS } from '../../../shared/config/constants';
import { SolveListItem } from './SolveListItem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PuzzleTab {
  puzzleKey: string;
  label: string;
  size: CubeSize;
}

interface Props {
  onBack?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PUZZLE_TABS: PuzzleTab[] = CUBE_CONFIGS.map((c) => ({
  puzzleKey: `${c.size}x${c.size}`,
  label: `${c.size}x${c.size}`,
  size: c.size,
}));

// ---------------------------------------------------------------------------
// Puzzle tab selector
// ---------------------------------------------------------------------------

interface TabBarProps {
  selected: string;
  onSelect: (key: string) => void;
}

function TabBar({ selected, onSelect }: TabBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tabStyles.container}
    >
      {PUZZLE_TABS.map((tab) => {
        const isActive = tab.puzzleKey === selected;
        return (
          <TouchableOpacity
            key={tab.puzzleKey}
            style={[tabStyles.tab, isActive && tabStyles.tabActive]}
            onPress={() => onSelect(tab.puzzleKey)}
            activeOpacity={0.7}
          >
            <Text style={[tabStyles.tabText, isActive && tabStyles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  } as ViewStyle,

  tab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.bg.secondary,
  } as ViewStyle,

  tabActive: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
    ...theme.glow.violet,
  } as ViewStyle,

  tabText: {
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.medium,
    color: theme.colors.text.tertiary,
    includeFontPadding: false,
  } as TextStyle,

  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: theme.font.weight.bold,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconBadge}>
        <Ionicons name="stats-chart-outline" size={30} color={theme.colors.accent.tertiary} />
      </View>
      <Text style={emptyStyles.title}>まだ記録がありません</Text>
      <Text style={emptyStyles.subtitle}>
        ソルブを完了すると、ここに履歴が表示されます
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing['2xl'],
    gap: theme.spacing.sm,
  } as ViewStyle,

  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.glow.cyan,
  } as ViewStyle,

  title: {
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.secondary,
    includeFontPadding: false,
  } as TextStyle,

  subtitle: {
    fontSize: theme.font.size.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: theme.font.size.sm * theme.font.lineHeight.relaxed,
    includeFontPadding: false,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function HistoryPage({ onBack }: Props) {
  const [selectedPuzzleKey, setSelectedPuzzleKey] = useState<string>('3x3');

  const store = useSolveHistoryStore();
  const solves: SolveRecord[] = store.solves[selectedPuzzleKey] ?? [];
  const isLoading = store.isLoading;

  // Load on tab change
  React.useEffect(() => {
    store.loadSolves(selectedPuzzleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPuzzleKey]);

  const stats = useMemo(() => calculateStats(solves), [solves]);

  const currentRank: RankTier | null = useMemo(
    () => (stats.best !== null ? getRank(selectedPuzzleKey, stats.best) : null),
    [stats.best, selectedPuzzleKey],
  );

  const handleDelete = useCallback(
    (id: string) => {
      store.deleteSolve(selectedPuzzleKey, id);
    },
    [store, selectedPuzzleKey],
  );

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      '履歴を削除',
      `${selectedPuzzleKey}の記録${solves.length}件をすべて削除します。この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'すべて削除',
          style: 'destructive',
          onPress: () => store.clearHistory(selectedPuzzleKey),
        },
      ],
    );
  }, [solves.length, selectedPuzzleKey, store]);

  const renderItem: ListRenderItem<SolveRecord> = useCallback(
    ({ item, index }) => {
      const rank = item.dnf ? null : getRank(selectedPuzzleKey, item.time);
      return (
        <SolveListItem
          solve={item}
          index={index}
          rank={rank}
          onDelete={handleDelete}
        />
      );
    },
    [selectedPuzzleKey, handleDelete],
  );

  const keyExtractor = useCallback((item: SolveRecord) => item.id, []);

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.statsContainer}>
        <StatsPanel
          stats={stats}
          currentRank={currentRank}
          puzzleKey={selectedPuzzleKey}
        />
      </View>
    ),
    [stats, currentRank, selectedPuzzleKey],
  );

  const ListFooterComponent = useMemo(
    () =>
      solves.length > 0 ? (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearHistory}
            activeOpacity={0.8}
          >
            <Text style={styles.clearButtonText}>履歴をすべて削除</Text>
          </TouchableOpacity>
        </View>
      ) : null,
    [solves.length, handleClearHistory],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={18} color={theme.colors.accent.tertiary} />
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>履歴</Text>
        {onBack && <View style={styles.headerSpacer} />}
      </View>

      {/* Puzzle tabs */}
      <TabBar selected={selectedPuzzleKey} onSelect={setSelectedPuzzleKey} />

      {/* Divider */}
      <View style={styles.divider} />

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.accent.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={solves}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={solves.length === 0 ? styles.emptyContent : styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
  } as ViewStyle,

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 64,
  } as ViewStyle,

  backButtonText: {
    fontSize: theme.font.size.md,
    color: theme.colors.accent.tertiary,
    fontWeight: theme.font.weight.medium,
    includeFontPadding: false,
  } as TextStyle,

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.primary,
    includeFontPadding: false,
  } as TextStyle,

  headerSpacer: {
    minWidth: 64,
  } as ViewStyle,

  divider: {
    height: 1,
    backgroundColor: theme.colors.border.subtle,
    marginHorizontal: theme.spacing.md,
  } as ViewStyle,

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  statsContainer: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  } as ViewStyle,

  listContent: {
    paddingBottom: theme.spacing.xl,
  } as ViewStyle,

  emptyContent: {
    flex: 1,
  } as ViewStyle,

  footerContainer: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  } as ViewStyle,

  clearButton: {
    backgroundColor: 'rgba(255, 59, 92, 0.12)',
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  } as ViewStyle,

  clearButtonText: {
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.semibold,
    color: theme.colors.error,
    includeFontPadding: false,
  } as TextStyle,
});
