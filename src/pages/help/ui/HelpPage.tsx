import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../shared/config/theme';
import { Card } from '../../../shared/ui/Card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  onBack?: () => void;
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

interface SectionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconBadge}>
          <Ionicons name={icon} size={16} color={theme.colors.accent.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Card style={styles.sectionCard}>{children}</Card>
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

interface GlossaryRowProps {
  term: string;
  description: string;
  isLast?: boolean;
}

function GlossaryRow({ term, description, isLast = false }: GlossaryRowProps) {
  return (
    <View style={[styles.glossaryRow, !isLast && styles.glossaryRowBorder]}>
      <Text style={styles.glossaryTerm}>{term}</Text>
      <Text style={styles.glossaryDescription}>{description}</Text>
    </View>
  );
}

interface StepRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  isLast?: boolean;
}

function StepRow({ icon, title, description, isLast = false }: StepRowProps) {
  return (
    <View style={[styles.stepRow, !isLast && styles.stepRowBorder]}>
      <View style={styles.stepIconBadge}>
        <Ionicons name={icon} size={18} color={theme.colors.accent.secondary} />
      </View>
      <View style={styles.stepTextArea}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function HelpPage({ onBack }: Props) {
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
        <Text style={styles.headerTitle}>ヘルプ</Text>
        {onBack && <View style={styles.headerSpacer} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── アプリの概要 ── */}
        <Section icon="cube" title="RubiksMasterについて">
          <Paragraph>
            3Dのルービックキューブを画面上で直接回して練習・タイムアタックできるアプリです。指でステッカーをつまんでドラッグするとその面が回転し、実物のキューブと同じ感覚で扱えます。
          </Paragraph>
          <Paragraph>
            「Start Solve」では計測・インスペクション付きのタイムアタックが、「フリーモード」ではタイマーなしで自由に練習できます。ソルブ履歴はホームやHistoryタブから確認でき、記録に応じたランクも表示されます。
          </Paragraph>
        </Section>

        {/* ── 操作方法 ── */}
        <Section icon="hand-left" title="操作方法">
          <StepRow
            icon="sync"
            title="カメラを回す"
            description="キューブの何もない背景部分をドラッグすると、視点(カメラ)が回転して裏側・側面が見えます。"
          />
          <StepRow
            icon="move"
            title="面を回す"
            description="回したい面のステッカーを直接つまんでドラッグすると、その1面(レイヤー)だけが回転します。90°以上動かすと手が確定します。"
          />
          <StepRow
            icon="timer-outline"
            title="タイマーの開始・停止"
            description="タップしてインスペクション開始→再タップでスタート→再タップで停止、の3ステップです(フリーモードにはタイマーはありません)。"
          />
          <StepRow
            icon="refresh"
            title="リセット / 新しいスクランブル"
            description="ヘッダーのResetで最初からやり直せます。スクランブルカードの「新しいスクランブル」で別の手順に変更できます。"
            isLast
          />
        </Section>

        {/* ── 用語集 ── */}
        <Section icon="book-outline" title="用語集">
          <GlossaryRow
            term="スクランブル"
            description="ソルブを始める前にキューブをランダムに崩す手順。全員が同じ条件で計測できるよう、WCA(世界キューブ協会)方式の記法で表示されます。"
          />
          <GlossaryRow
            term="U / D / F / B / L / R"
            description="回す面を表す記号。上(Up)・下(Down)・正面(Front)・背面(Back)・左(Left)・右(Right)。"
          />
          <GlossaryRow
            term="' (プライム)"
            description="反時計回りに90°回すことを表します。例: U' は上面を反時計回りに90°。"
          />
          <GlossaryRow
            term="2 (数字)"
            description="180°(2回)回すことを表します。例: U2 は上面を180°。"
          />
          <GlossaryRow
            term="インスペクション"
            description="スクランブル後、実際に解き始める前にキューブを観察できる準備時間(WCA公式ルールでは15秒)。"
          />
          <GlossaryRow
            term="DNF"
            description="Did Not Finish の略。ソルブが無効になった記録につけるマークです。"
          />
          <GlossaryRow
            term="+2"
            description="タイムに2秒のペナルティを加える記録。WCAルールでの軽微な反則時などに使います。"
          />
          <GlossaryRow
            term="ランク"
            description="記録したベストタイムに応じて表示される評価(S/SS/SSSなど)。パズルサイズごとに算出されます。"
            isLast
          />
        </Section>
      </ScrollView>
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

  scrollView: {
    flex: 1,
  } as ViewStyle,

  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  } as ViewStyle,

  section: {
    marginBottom: theme.spacing.lg,
  } as ViewStyle,

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  } as ViewStyle,

  sectionIconBadge: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.bg.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  sectionTitle: {
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.secondary,
    letterSpacing: 0.4,
  } as TextStyle,

  sectionCard: {
    gap: theme.spacing.sm,
  } as ViewStyle,

  paragraph: {
    fontSize: theme.font.size.md,
    color: theme.colors.text.secondary,
    lineHeight: theme.font.size.md * theme.font.lineHeight.relaxed,
  } as TextStyle,

  // Step rows (操作方法)
  stepRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  } as ViewStyle,

  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  } as ViewStyle,

  stepIconBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  stepTextArea: {
    flex: 1,
    gap: 2,
  } as ViewStyle,

  stepTitle: {
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.semibold,
    color: theme.colors.text.primary,
    includeFontPadding: false,
  } as TextStyle,

  stepDescription: {
    fontSize: theme.font.size.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.font.size.sm * theme.font.lineHeight.relaxed,
  } as TextStyle,

  // Glossary rows (用語集)
  glossaryRow: {
    paddingVertical: theme.spacing.sm,
    gap: 2,
  } as ViewStyle,

  glossaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  } as ViewStyle,

  glossaryTerm: {
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.accent.primary,
    includeFontPadding: false,
  } as TextStyle,

  glossaryDescription: {
    fontSize: theme.font.size.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.font.size.sm * theme.font.lineHeight.relaxed,
  } as TextStyle,
});
