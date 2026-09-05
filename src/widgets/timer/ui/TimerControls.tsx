import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../../../shared/config/theme';
import { Button } from '../../../shared/ui/Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  onDNF: () => void;
  onPlusTwo: () => void;
  onReset: () => void;
  onUndo: () => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// TimerControls
// ---------------------------------------------------------------------------

export function TimerControls({
  onDNF,
  onPlusTwo,
  onReset,
  onUndo,
  disabled = false,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Button
          label="DNF"
          onPress={onDNF}
          variant="danger"
          size="sm"
          disabled={disabled}
          style={styles.button}
        />
        <Button
          label="+2"
          onPress={onPlusTwo}
          variant="secondary"
          size="sm"
          disabled={disabled}
          style={styles.button}
        />
      </View>
      <View style={styles.row}>
        <Button
          label="リセット"
          onPress={onReset}
          variant="ghost"
          size="sm"
          disabled={disabled}
          style={styles.button}
        />
        <Button
          label="Undo"
          onPress={onUndo}
          variant="ghost"
          size="sm"
          disabled={disabled}
          style={styles.button}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  } as ViewStyle,

  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  } as ViewStyle,

  button: {
    minWidth: 100,
  } as ViewStyle,
});
