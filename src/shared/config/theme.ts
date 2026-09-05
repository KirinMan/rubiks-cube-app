export const theme = {
  colors: {
    // Background layers
    bg: {
      primary: '#0D0D0F',
      secondary: '#16161A',
      elevated: '#1E1E24',
      overlay: 'rgba(255,255,255,0.05)',
    },

    // Brand / accent
    accent: {
      primary: '#6C63FF',
      secondary: '#A78BFA',
      gradient: ['#6C63FF', '#A78BFA'] as const,
    },

    // Semantic colors
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    // Text
    text: {
      primary: '#F1F1F3',
      secondary: '#9CA3AF',
      tertiary: '#6B7280',
      inverse: '#0D0D0F',
    },

    // Border
    border: {
      subtle: 'rgba(255,255,255,0.08)',
      default: 'rgba(255,255,255,0.14)',
      strong: 'rgba(255,255,255,0.24)',
    },

    // Rubik's cube face colors
    cube: {
      white: '#FFFFFF',
      yellow: '#FFD500',
      red: '#C41E3A',
      orange: '#FF5800',
      blue: '#003DA5',
      green: '#009B48',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  radius: {
    sm: 6,
    md: 12,
    lg: 18,
    xl: 24,
    full: 9999,
  },

  font: {
    size: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    weight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
  },

  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 12,
    },
  },
} as const;

export type Theme = typeof theme;
