import React, { useRef, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { IsoCubeView, DEFAULT_AZIMUTH, DEFAULT_ELEVATION, MIN_ELEVATION, MAX_ELEVATION } from './IsoCubeView';
import type { CubeState, CubeSize } from '../../../shared/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  state: CubeState;
  size: CubeSize;
  viewSize?: number;
  /** 1本指パン終了時に呼ばれる (timerRunning時のみキューブ操作に使う) */
  onSingleFingerSwipeEnd?: (translationX: number, translationY: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InteractiveCubeView({
  state,
  size,
  viewSize = 300,
  onSingleFingerSwipeEnd,
}: Props) {
  const [azimuth, setAzimuth] = useState(DEFAULT_AZIMUTH);
  const [elevation, setElevation] = useState(DEFAULT_ELEVATION);

  const startAzRef = useRef(DEFAULT_AZIMUTH);
  const startElRef = useRef(DEFAULT_ELEVATION);
  const activePointersRef = useRef(0);

  // 1本指パン: キューブ面操作用スワイプ
  const singlePan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .runOnJS(true)
    .onBegin(() => {
      activePointersRef.current = 1;
    })
    .onEnd((e) => {
      if (activePointersRef.current === 1) {
        onSingleFingerSwipeEnd?.(e.translationX, e.translationY);
      }
    });

  // 2本指パン: カメラ視点回転
  const twoFingerPan = Gesture.Pan()
    .minPointers(2)
    .maxPointers(2)
    .runOnJS(true)
    .onBegin(() => {
      activePointersRef.current = 2;
      startAzRef.current = azimuth;
      startElRef.current = elevation;
    })
    .onUpdate((e) => {
      const sensitivity = 0.005;
      const newAz = startAzRef.current + e.translationX * sensitivity;
      const newEl = Math.max(
        MIN_ELEVATION,
        Math.min(MAX_ELEVATION, startElRef.current - e.translationY * sensitivity),
      );
      setAzimuth(newAz);
      setElevation(newEl);
    })
    .onFinalize(() => {
      activePointersRef.current = 0;
    });

  // 1本指と2本指を同時認識
  const gesture = Gesture.Simultaneous(singlePan, twoFingerPan);

  return (
    <GestureDetector gesture={gesture}>
      <IsoCubeView
        state={state}
        size={size}
        viewSize={viewSize}
        azimuth={azimuth}
        elevation={elevation}
      />
    </GestureDetector>
  );
}
