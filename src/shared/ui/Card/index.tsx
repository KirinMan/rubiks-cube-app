import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../../config/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Extra padding inside the card. Defaults to theme.spacing.md */
  padding?: number;
  /** Remove the border (useful when nesting cards) */
  borderless?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Glassmorphism-style dark card.
 *
 * On React Native we approximate the glass effect with:
 *   - Semi-transparent elevated background
 *   - Subtle white border
 *   - Drop shadow
 *   - Slightly lighter inner tint via an overlay
 */
export function Card({ children, style, padding = theme.spacing.md, borderless = false }: CardProps) {
  return (
    // シャドウ/グローはoverflow:'hidden'と同じViewに乗せると切り取られてしまうため、
    // グロー用の外側Viewと、角丸+tintOverlayをクリップする内側Viewを分けている。
    <View style={[theme.shadow.md, theme.glow.soft, styles.glowWrapper]}>
      <View style={[styles.card, !borderless && styles.border, { padding }, style]}>
        {/* Frosted-glass tint overlay */}
        <View style={styles.tintOverlay} pointerEvents="none" />
        {children}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  glowWrapper: {
    borderRadius: theme.radius.lg,
  } as ViewStyle,

  card: {
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  } as ViewStyle,

  border: {
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  } as ViewStyle,

  /**
   * A thin semi-transparent white layer that sits on top of the background
   * to simulate the bright-edge refraction typical of glassmorphism cards.
   */
  tintOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: theme.radius.lg,
    // Gradient-like highlight along the top edge
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.06)',
  } as ViewStyle,
});
