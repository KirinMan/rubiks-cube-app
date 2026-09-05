import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../config/theme';
import { AppText } from '../Text';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingHorizontal: theme.spacing.md, paddingVertical: 8, borderRadius: theme.radius.sm },
    text: { fontSize: theme.font.size.sm },
  },
  md: {
    container: { paddingHorizontal: theme.spacing.lg, paddingVertical: 14, borderRadius: theme.radius.md },
    text: { fontSize: theme.font.size.md },
  },
  lg: {
    container: { paddingHorizontal: theme.spacing.xl, paddingVertical: 18, borderRadius: theme.radius.lg },
    text: { fontSize: theme.font.size.lg },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  fullWidth = false,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled || loading ? 0.5 : 1,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.95, { duration: 80, easing: Easing.out(Easing.quad) });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
  }, [scale]);

  const { container: sizeContainer, text: sizeText } = sizeStyles[size];

  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle[] = [
    styles.base,
    sizeContainer,
    fullWidth ? styles.fullWidth : {},
    style ?? {},
  ];

  // For non-primary variants, we render a plain Pressable with a background color.
  const variantBg: Record<Exclude<ButtonVariant, 'primary'>, string> = {
    secondary: theme.colors.bg.elevated,
    ghost: 'transparent',
    danger: theme.colors.error,
  };

  const variantBorder: Record<Exclude<ButtonVariant, 'primary'>, string | undefined> = {
    secondary: theme.colors.border.default,
    ghost: theme.colors.border.subtle,
    danger: undefined,
  };

  const spinnerColor =
    variant === 'primary' || variant === 'danger'
      ? theme.colors.text.primary
      : theme.colors.text.secondary;

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, fullWidth ? styles.fullWidth : {}, theme.glow.violet]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        <LinearGradient
          colors={[...theme.colors.accent.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, sizeContainer, style ?? {}]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.text.primary} />
          ) : (
            <AppText variant="label" style={[styles.label, sizeText, { color: theme.colors.text.primary }]}>
              {label}
            </AppText>
          )}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        containerStyle,
        { backgroundColor: variantBg[variant] },
        variantBorder[variant] ? { borderWidth: 1, borderColor: variantBorder[variant] } : {},
        variant === 'danger' ? theme.glow.pink : {},
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <AppText
          variant="label"
          style={[
            styles.label,
            sizeText,
            { color: variant === 'danger' ? theme.colors.text.primary : theme.colors.text.primary },
          ]}
        >
          {label}
        </AppText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  } as ViewStyle,
  fullWidth: {
    alignSelf: 'stretch',
  } as ViewStyle,
  label: {
    fontWeight: theme.font.weight.semibold,
    letterSpacing: 0.3,
  } as TextStyle,
});
