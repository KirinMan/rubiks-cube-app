import AsyncStorage from '@react-native-async-storage/async-storage';
import { SolveRecord } from '../../types';

const KEYS = {
  SOLVES: 'rubiks:solves',
  SETTINGS: 'rubiks:settings',
};

function solvesKeyForPuzzle(puzzleKey: string): string {
  return `${KEYS.SOLVES}:${puzzleKey}`;
}

export async function getSolves(puzzleKey: string): Promise<SolveRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(solvesKeyForPuzzle(puzzleKey));
    if (!raw) return [];
    return JSON.parse(raw) as SolveRecord[];
  } catch {
    return [];
  }
}

export async function saveSolve(record: SolveRecord): Promise<void> {
  const key = solvesKeyForPuzzle(record.puzzleType);
  const existing = await getSolves(record.puzzleType);
  const updated = [record, ...existing];
  await AsyncStorage.setItem(key, JSON.stringify(updated));
}

export async function deleteSolve(id: string, puzzleKey: string): Promise<void> {
  const solves = await getSolves(puzzleKey);
  const updated = solves.filter((s) => s.id !== id);
  await AsyncStorage.setItem(solvesKeyForPuzzle(puzzleKey), JSON.stringify(updated));
}

export async function clearSolves(puzzleKey: string): Promise<void> {
  await AsyncStorage.removeItem(solvesKeyForPuzzle(puzzleKey));
}

export async function getSettings(): Promise<Record<string, unknown>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function saveSettings(settings: Record<string, unknown>): Promise<void> {
  const current = await getSettings();
  const merged = { ...current, ...settings };
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
}
