import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../config/theme';

interface GradientTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  colors?: readonly [string, string, ...string[]];
}

/** ネオングラデーション(紫→ピンク→シアン)がかかった見出しテキスト。 */
export function GradientText({ children, style, colors = theme.colors.accent.gradient }: GradientTextProps) {
  return (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: 'transparent' }]}>{children}</Text>}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
