import React from 'react';
import { Text, TextProps, TextStyle, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  style?: TextStyle | TextStyle[];
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Variant style map
// ---------------------------------------------------------------------------

const variantStyles: Record<TextVariant, TextStyle> = {
  h1: {
    fontSize: theme.font.size['3xl'],
    fontWeight: theme.font.weight.extrabold,
    lineHeight: theme.font.size['3xl'] * theme.font.lineHeight.tight,
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: theme.font.size['2xl'],
    fontWeight: theme.font.weight.bold,
    lineHeight: theme.font.size['2xl'] * theme.font.lineHeight.tight,
    color: theme.colors.text.primary,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.semibold,
    lineHeight: theme.font.size.xl * theme.font.lineHeight.normal,
    color: theme.colors.text.primary,
  },
  body: {
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.regular,
    lineHeight: theme.font.size.md * theme.font.lineHeight.relaxed,
    color: theme.colors.text.secondary,
  },
  caption: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.regular,
    lineHeight: theme.font.size.xs * theme.font.lineHeight.normal,
    color: theme.colors.text.tertiary,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.medium,
    lineHeight: theme.font.size.sm * theme.font.lineHeight.normal,
    color: theme.colors.text.primary,
    letterSpacing: 0.1,
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppText({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}: AppTextProps) {
  const resolvedStyle: TextStyle[] = [
    styles.base,
    variantStyles[variant],
    color ? { color } : {},
    ...(Array.isArray(style) ? style : style ? [style] : []),
  ];

  return (
    <Text style={resolvedStyle} {...rest}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  } as TextStyle,
});
