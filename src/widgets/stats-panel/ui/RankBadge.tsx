import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { RankTier } from '../../../shared/types/index';
import { theme } from '../../../shared/config/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  tier: RankTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------

const sizeConfig = {
  sm: {
    container: 36,
    fontSize: theme.font.size.sm,
    labelFontSize: theme.font.size.xs,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
  },
  md: {
    container: 52,
    fontSize: theme.font.size.xl,
    labelFontSize: theme.font.size.sm,
    borderRadius: theme.radius.md,
    borderWidth: 2,
  },
  lg: {
    container: 72,
    fontSize: theme.font.size['3xl'],
    labelFontSize: theme.font.size.md,
    borderRadius: theme.radius.lg,
    borderWidth: 2.5,
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RankBadge({ tier, size = 'md', showLabel = true }: Props) {
  const config = sizeConfig[size];

  const containerStyle: ViewStyle = {
    width: config.container,
    height: config.container,
    borderRadius: config.borderRadius,
    borderWidth: config.borderWidth,
    borderColor: tier.color,
    backgroundColor: tier.bgColor,
    // Glow effect via shadow
    shadowColor: tier.color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: size === 'lg' ? 12 : size === 'md' ? 8 : 4,
    elevation: size === 'lg' ? 10 : size === 'md' ? 6 : 3,
  };

  const gradeStyle: TextStyle = {
    fontSize: config.fontSize,
    color: tier.color,
    fontWeight: theme.font.weight.extrabold,
    letterSpacing: -0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  };

  const labelStyle: TextStyle = {
    fontSize: config.labelFontSize,
    color: tier.color,
    fontWeight: theme.font.weight.semibold,
    marginTop: theme.spacing.xs / 2,
    letterSpacing: 0.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, containerStyle]}>
        <Text style={gradeStyle}>{tier.grade}</Text>
      </View>
      {showLabel && (
        <Text style={labelStyle} numberOfLines={1}>
          {tier.label}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  } as ViewStyle,

  container: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});
