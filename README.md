# RubiksMaster

A speedcubing timer and practice app for React Native. Solve a fully interactive 3D Rubik's Cube right on your phone — orbit the camera and turn layers with your finger, just like a real cube — with WCA-style scrambles, inspection timing, and a world-record-based ranking system.

## What is this app?

RubiksMaster turns your phone into a cubing training tool. Pick a puzzle size (2×2 through 7×7), get a fresh WCA-notation scramble, and either race the clock in **Start Solve** mode or practice freely with no timer in **Free Mode**. Every solve is tracked per puzzle size, ranked against world-record pace, and saved to your history.

The cube itself is rendered in real 3D (not a flat illustration) and responds to direct touch: drag the background to orbit the camera around the cube, or drag a sticker to twist that layer — the same intuition as handling a physical cube.

## How to play

1. **Pick a puzzle size** on the Home screen (2×2–7×7).
2. Tap **Start Solve** to get a scramble and enter Start Solve mode, or **Free Mode** to practice without a timer.
3. **Orbit the camera** — drag anywhere on the empty background of the cube view to rotate your viewpoint and see every face.
4. **Turn a layer** — drag directly on a sticker; the layer under your finger twists in the direction you drag.
5. In Start Solve mode: tap the timer to start inspection, tap again to start the clock, and tap once more (or finish the cube) to stop. Mark **DNF** or **+2** penalties after stopping if needed.
6. Check **History** for past solves per puzzle size (swipe a row left to delete it), or open **Help** from Settings for a full walkthrough of controls and cubing terminology (scramble notation, DNF, +2, inspection, ranks, etc.).

## Features

### Core
- **Start Solve mode**: WCA-style timer with inspection (off / 8s / 15s, configurable)
- **Free Mode**: untimed practice with a move counter, no history recorded
- **Scrambles**: auto-generated in official WCA notation (11 moves for 2×2 up to 100 for 7×7)
- **Ranking**: 8-tier evaluation benchmarked against world-record pace (SSS / SS / S / A / B / C / D / E)
- **Stats**: live ao5 / ao12 / ao100 averages, best time, and rank progress

### 3D cube interaction
- **Drag-to-orbit camera** — free rotation around the whole cube, all 6 faces reachable
- **Drag-to-turn layers** — grab any sticker and twist that layer directly, with a snapping 90°/180° animation
- Cube geometry and turn direction are exhaustively verified by an automated script covering every face/axis/layer combination

### History & help
- Per-puzzle solve history with swipe-to-delete and a detail view (time, date, scramble)
- In-app Help screen: app overview, control walkthrough, and a glossary of cubing terms
- Haptic feedback on timer state changes

## Supported puzzles

| Size | Scramble length |
|------|-----------------|
| 2×2  | 11 moves |
| 3×3  | 20 moves |
| 4×4  | 40 moves |
| 5×5  | 60 moves |
| 6×6  | 80 moves |
| 7×7  | 100 moves |

## Rank tiers (3×3 reference)

| Rank | Time      | Level |
|------|-----------|-------|
| SSS  | ≤ 3.13s   | World-record class |
| SS   | ≤ 6s      | Competitive elite |
| S    | ≤ 10s     | Advanced speedcuber |
| A    | ≤ 20s     | Speedcuber |
| B    | ≤ 45s     | Intermediate |
| C    | ≤ 1m30s   | Casual |
| D    | ≤ 5m      | Beginner |
| E    | > 5m      | Just starting out |

## Tech stack

- **Framework**: React Native + Expo SDK 57 (custom Dev Client, not Expo Go)
- **Language**: TypeScript
- **Architecture**: Feature-Sliced Design (FSD)
- **State management**: Zustand
- **3D rendering**: `react-native-webgpu` + `three/webgpu` + `@react-three/fiber` — a declarative WebGPU pipeline (replaces the legacy OpenGL ES/`expo-gl` path, which Apple has deprecated and which could not reliably render multi-object scenes on this stack)
- **Gestures**: React Native's GestureResponder system, composited with a custom raycasting hit-test for camera-orbit vs. layer-turn disambiguation
- **Animation**: react-native-reanimated v4
- **2D cube preview**: react-native-svg (isometric projection, used for the Home screen preview)
- **Persistence**: AsyncStorage
- **Icons**: @expo/vector-icons
- **Code style**: ESLint + Prettier

## Directory structure (FSD)

```
src/
├── app/            # App entry, navigation, providers
├── pages/          # Screens (Home / Game / History / Settings / Help)
├── widgets/        # Composite UI blocks (3D cube viewer, timer, scramble display, stats panel...)
├── features/       # Use cases (timer-control / scramble / rank)
├── entities/       # Domain models (cube / solve / rank)
└── shared/         # Shared resources (ui / lib / config / types)
```

## Getting started

`react-native-webgpu` requires native modules that aren't available in Expo Go, so this project needs a custom Dev Client build rather than `expo start`.

```bash
# Install dependencies
npm install

# Build and run on iOS Simulator (first run — builds the native Dev Client)
npx expo run:ios

# Build and run on an Android emulator
npx expo run:android

# Subsequent runs: start Metro only, then relaunch the already-installed Dev Client app
npx expo start --dev-client
```

### Requirements

- Node.js 20+
- Xcode 15+ (iOS) / Android Studio (Android)
- CocoaPods (iOS)

## License

MIT
