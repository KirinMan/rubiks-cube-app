export const theme = {
  colors: {
    // Background layers — クリーム白ベース(パステル・ポップ方向)
    bg: {
      primary: '#FFF8F0',
      secondary: '#FFFFFF',
      elevated: '#FFFFFF',
      overlay: 'rgba(58,46,77,0.03)',
    },

    // Brand / accent — キャンディカラー(ピンク→ラベンダー→ミント)
    accent: {
      primary: '#FF5FA2',
      secondary: '#9B7EF0',
      tertiary: '#2FC9B7',
      gradient: ['#FF5FA2', '#9B7EF0', '#2FC9B7'] as const,
    },

    // キャンディカラーの単色パレット(ボタン/カード/バッジの縁取り・影に個別指定する用)
    neon: {
      violet: '#9B7EF0',
      pink: '#FF5FA2',
      cyan: '#2FC9B7',
      green: '#6BCB77',
      yellow: '#FFC93D',
    },

    // Semantic colors
    success: '#4CAF7D',
    error: '#FF6B6B',
    warning: '#FFA940',
    info: '#2FC9B7',

    // Text — 純黒ではなく温かみのあるダークプラムで柔らかく
    text: {
      primary: '#3A2E4D',
      secondary: '#8A7A99',
      tertiary: '#B8ACC4',
      inverse: '#FFFFFF',
    },

    // Border — ラベンダーを薄く乗せた優しい縁取り
    border: {
      subtle: 'rgba(155,126,240,0.14)',
      default: 'rgba(155,126,240,0.28)',
      strong: 'rgba(155,126,240,0.50)',
    },

    // Rubik's cube face colors(3Dキューブ側のSTICKER_COLOR_HEXと統一)
    cube: {
      white: '#F5F5F0',
      yellow: '#FFD400',
      red: '#FF2D3A',
      orange: '#FF7A1A',
      blue: '#1E6BFF',
      green: '#17C964',
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

  // パステル・ポップらしい、大きめの角丸
  radius: {
    sm: 8,
    md: 14,
    lg: 22,
    xl: 30,
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

  // 白背景の上でくっきり浮き上がる、柔らかいドロップシャドウ
  // (shadowColorを純黒ではなく本文色に近いダークプラムにして、きつくなりすぎないようにする)
  shadow: {
    sm: {
      shadowColor: '#3A2E4D',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#3A2E4D',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 6,
    },
    lg: {
      shadowColor: '#3A2E4D',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 12,
    },
  },

  // 「ぷっくり」としたポップな立体感を出すための、色付きドロップシャドウ。
  // ネオン方向のような発光ではなく、はっきりオフセットの付いたキャンディ調の影にする。
  glow: {
    violet: {
      shadowColor: '#9B7EF0',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
    },
    pink: {
      shadowColor: '#FF5FA2',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
    },
    cyan: {
      shadowColor: '#2FC9B7',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 8,
    },
    // カード等の背後にうっすら漂わせる、控えめなアンビエントシャドウ
    soft: {
      shadowColor: '#9B7EF0',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 14,
      elevation: 5,
    },
  },
} as const;

export type Theme = typeof theme;
