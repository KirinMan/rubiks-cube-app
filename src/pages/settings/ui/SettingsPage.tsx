import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../../shared/config/theme';
import { CUBE_CONFIGS } from '../../../shared/config/constants';
import { saveSettings, getSettings } from '../../../shared/lib/storage';
import type { CubeSize } from '../../../shared/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InspectionTime = 'off' | '8' | '15';

interface AppSettings {
  defaultCubeSize: CubeSize;
  inspectionTime: InspectionTime;
}

interface Props {
  onBack?: () => void;
}

// ---------------------------------------------------------------------------
// Default settings
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: AppSettings = {
  defaultCubeSize: 3,
  inspectionTime: '15',
};

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.card}>{children}</View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  } as ViewStyle,

  title: {
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.tertiary,
    letterSpacing: 1.2,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
    textTransform: 'uppercase',
    includeFontPadding: false,
  } as TextStyle,

  card: {
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    overflow: 'hidden',
  } as ViewStyle,
});

// ---------------------------------------------------------------------------
// Row components
// ---------------------------------------------------------------------------

interface OptionRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
}

function OptionRow({ label, selected, onPress, isLast = false }: OptionRowProps) {
  return (
    <TouchableOpacity
      style={[rowStyles.row, !isLast && rowStyles.rowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={rowStyles.rowLabel}>{label}</Text>
      {selected && (
        <View style={rowStyles.checkmark}>
          <Text style={rowStyles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

function InfoRow({ label, value, isLast = false }: InfoRowProps) {
  return (
    <View style={[rowStyles.row, !isLast && rowStyles.rowBorder]}>
      <Text style={rowStyles.rowLabel}>{label}</Text>
      <Text style={rowStyles.rowValue}>{value}</Text>
    </View>
  );
}

interface PlaceholderRowProps {
  label: string;
  isLast?: boolean;
}

function PlaceholderRow({ label, isLast = false }: PlaceholderRowProps) {
  return (
    <View style={[rowStyles.row, !isLast && rowStyles.rowBorder]}>
      <Text style={rowStyles.rowLabel}>{label}</Text>
      <Text style={rowStyles.rowValue}>Coming soon</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 52,
  } as ViewStyle,

  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  } as ViewStyle,

  rowLabel: {
    fontSize: theme.font.size.md,
    color: theme.colors.text.primary,
    fontWeight: theme.font.weight.regular,
    includeFontPadding: false,
  } as TextStyle,

  rowValue: {
    fontSize: theme.font.size.sm,
    color: theme.colors.text.tertiary,
    includeFontPadding: false,
  } as TextStyle,

  checkmark: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  checkmarkText: {
    color: '#FFFFFF',
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.bold,
    includeFontPadding: false,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Cube size options
// ---------------------------------------------------------------------------

const CUBE_SIZE_OPTIONS = CUBE_CONFIGS.map((c) => ({
  label: `${c.size}x${c.size}`,
  value: c.size as CubeSize,
}));

const INSPECTION_OPTIONS: { label: string; value: InspectionTime }[] = [
  { label: 'Off', value: 'off' },
  { label: '8 seconds', value: '8' },
  { label: '15 seconds (WCA)', value: '15' },
];

// ---------------------------------------------------------------------------
// App version (placeholder — replace with Constants.expoConfig?.version)
// ---------------------------------------------------------------------------

const APP_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SettingsPage({ onBack }: Props) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    getSettings().then((raw) => {
      setSettings({
        defaultCubeSize: (raw.defaultCubeSize as CubeSize) ?? DEFAULT_SETTINGS.defaultCubeSize,
        inspectionTime: (raw.inspectionTime as InspectionTime) ?? DEFAULT_SETTINGS.inspectionTime,
      });
      setIsLoaded(true);
    });
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings({ [key]: value });
  };

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
            <Text style={styles.backButtonText}>{'< Back'}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Settings</Text>
        {onBack && <View style={styles.headerSpacer} />}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoaded && (
          <>
            {/* Default puzzle size */}
            <Section title="Default Puzzle">
              {CUBE_SIZE_OPTIONS.map((opt, i) => (
                <OptionRow
                  key={opt.value}
                  label={opt.label}
                  selected={settings.defaultCubeSize === opt.value}
                  onPress={() => updateSetting('defaultCubeSize', opt.value)}
                  isLast={i === CUBE_SIZE_OPTIONS.length - 1}
                />
              ))}
            </Section>

            {/* Inspection time */}
            <Section title="Inspection Time">
              {INSPECTION_OPTIONS.map((opt, i) => (
                <OptionRow
                  key={opt.value}
                  label={opt.label}
                  selected={settings.inspectionTime === opt.value}
                  onPress={() => updateSetting('inspectionTime', opt.value)}
                  isLast={i === INSPECTION_OPTIONS.length - 1}
                />
              ))}
            </Section>

            {/* Theme (placeholder) */}
            <Section title="Appearance">
              <PlaceholderRow label="Theme" isLast />
            </Section>

            {/* About */}
            <Section title="About">
              <InfoRow label="Version" value={APP_VERSION} />
              <InfoRow label="Platform" value="React Native / Expo" isLast />
            </Section>
          </>
        )}
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
    minWidth: 64,
  } as ViewStyle,

  backButtonText: {
    fontSize: theme.font.size.md,
    color: theme.colors.accent.primary,
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

  scrollView: {
    flex: 1,
  } as ViewStyle,

  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  } as ViewStyle,
});
