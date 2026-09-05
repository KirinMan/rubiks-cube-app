// react-native-webgpu + @react-three/fiberによる3Dルービックキューブ表示。
// (旧expo-gl + 生THREE.WebGLRenderer実装は、シーンに2オブジェクト以上あると
// 一切描画されないという致命的な非互換性が判明したため全面的に置き換えた)
import * as THREE from 'three/webgpu';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useThree } from '@react-three/fiber';
import type { CubeSize, CubeState, Move } from '../../../shared/types';
import { FiberCanvas } from '../../../shared/lib/webgpu/FiberCanvas';
import { CELL_SPACING } from '../lib/cubeGeometry';
import { RubiksCubeScene, createSceneRefs, type CubeSceneRefs } from './RubiksCubeScene';
import { useCubeGestures } from './useCubeGestures';

interface Props {
  cubeState: CubeState;
  size: CubeSize;
  viewSize?: number;
  interactive: boolean;
  onMove: (move: Move) => void;
}

function CameraSetup({ size }: { size: CubeSize }) {
  const { camera } = useThree();
  useEffect(() => {
    const distance = Math.max(4, size * CELL_SPACING * 1.7);
    camera.position.set(distance * 0.62, distance * 0.5, distance * 0.62);
    camera.lookAt(0, 0, 0);
  }, [camera, size]);
  return null;
}

export function Cube3DView({ cubeState, size, viewSize = 300, interactive, onMove }: Props) {
  const refsBag = useRef<CubeSceneRefs>(createSceneRefs());
  const [OrbitControls, events] = useCubeGestures(refsBag, size, interactive, onMove);

  return (
    <View style={[styles.container, { width: viewSize, height: viewSize }]} {...events}>
      <FiberCanvas style={styles.canvas}>
        <CameraSetup size={size} />
        <OrbitControls enableRotate enablePan={false} minZoom={2.5} maxZoom={size * CELL_SPACING * 5} />
        <RubiksCubeScene cubeState={cubeState} size={size} refsBag={refsBag} onMove={onMove} />
      </FiberCanvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
});
