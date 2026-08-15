// react-native-webgpu公式サンプル(expo/examples: with-webgpu)を移植。
// https://github.com/expo/examples/blob/master/with-webgpu/src/lib/make-webgpu-renderer.ts
import type { NativeCanvas } from 'react-native-webgpu';
import * as THREE from 'three/webgpu';

// GPUCanvasContextのcanvasをThree.jsが期待するHTMLCanvasElement風オブジェクトに
// ラップする(react-native-webgpuのNativeCanvasはDOM Canvasではないため)。
export class ReactNativeCanvas {
  constructor(private canvas: NativeCanvas) {}

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  set width(width: number) {
    this.canvas.width = width;
  }

  set height(height: number) {
    this.canvas.height = height;
  }

  get clientWidth() {
    return this.canvas.width;
  }

  get clientHeight() {
    return this.canvas.height;
  }

  set clientWidth(width: number) {
    this.canvas.width = width;
  }

  set clientHeight(height: number) {
    this.canvas.height = height;
  }

  addEventListener(_type: string, _listener: EventListener) {
    // no-op: react-native-webgpuはDOMイベントを提供しない
  }

  removeEventListener(_type: string, _listener: EventListener) {
    // no-op
  }

  dispatchEvent(_event: Event) {
    // no-op
  }

  setPointerCapture() {
    // no-op
  }

  releasePointerCapture() {
    // no-op
  }
}

export const makeWebGPURenderer = (
  context: GPUCanvasContext,
  { antialias = true }: { antialias?: boolean } = {},
) =>
  new THREE.WebGPURenderer({
    antialias,
    // @ts-expect-error ReactNativeCanvasはHTMLCanvasElementを模したラッパー
    canvas: new ReactNativeCanvas(context.canvas),
    context,
  });
