// react-native-webgpu公式サンプル(expo/examples: with-webgpu)を移植。
// https://github.com/expo/examples/blob/master/with-webgpu/src/lib/fiber-canvas.tsx
import * as THREE from 'three/webgpu';
import React, { useEffect, useRef, useState } from 'react';
import type { ReconcilerRoot, RootState } from '@react-three/fiber';
import { extend, createRoot, unmountComponentAtNode, events } from '@react-three/fiber';
import type { LayoutChangeEvent, ViewProps } from 'react-native';
import { PixelRatio } from 'react-native';
import { Canvas, type CanvasRef } from 'react-native-webgpu';

import { makeWebGPURenderer, ReactNativeCanvas } from './makeWebGPURenderer';

interface FiberCanvasProps {
  children: React.ReactNode;
  style?: ViewProps['style'];
  camera?: THREE.PerspectiveCamera;
  scene?: THREE.Scene;
}

export const FiberCanvas = ({ children, style, scene, camera }: FiberCanvasProps) => {
  const root = useRef<ReconcilerRoot<OffscreenCanvas>>(null!);
  // @ts-expect-error extend()はThree.jsの全エクスポートを受け取る想定の型
  React.useMemo(() => extend(THREE), []);
  const canvasRef = useRef<CanvasRef>(null);
  // ネイティブ側のCanvasビューは、マウント直後のuseEffectではまだ実測サイズが
  // 確定していないことがある(clientWidthが0のまま)。その状態でWebGPUコンテキストを
  // configureすると、Dawnがそのswapchainを永続的に無効化し、以降ずっと描画されなく
  // なる。そのため、onLayoutで実測サイズが判明するまで初期化を遅延させる。
  const [layoutSize, setLayoutSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!layoutSize || layoutSize.width <= 0 || layoutSize.height <= 0 || root.current) return;
    const context = canvasRef.current!.getContext('webgpu')!;
    const renderer = makeWebGPURenderer(context);

    // @ts-expect-error ReactNativeCanvasはHTMLCanvasElementを模したラッパー
    const canvas = new ReactNativeCanvas(context.canvas) as HTMLCanvasElement;
    canvas.width = layoutSize.width * PixelRatio.get();
    canvas.height = layoutSize.height * PixelRatio.get();
    const size = {
      top: 0,
      left: 0,
      width: layoutSize.width,
      height: layoutSize.height,
    };

    root.current = createRoot(canvas);
    root.current.configure({
      size,
      events,
      scene,
      camera,
      gl: renderer,
      frameloop: 'always',
      dpr: 1,
      onCreated: async (state: RootState) => {
        const gpuRenderer = state.gl as unknown as THREE.WebGPURenderer;
        await gpuRenderer.init();
        const renderFrame = gpuRenderer.render.bind(gpuRenderer);
        gpuRenderer.render = (s: THREE.Scene, c: THREE.Camera) => {
          renderFrame(s, c);
          context?.present();
        };
      },
    });
    root.current.render(children);

    return () => {
      if (root.current) {
        unmountComponentAtNode(canvas);
        root.current = null!;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutSize]);

  useEffect(() => {
    if (root.current) {
      root.current.render(children);
    }
  }, [children]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayoutSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return <Canvas ref={canvasRef} style={style} onLayout={handleLayout} />;
};
