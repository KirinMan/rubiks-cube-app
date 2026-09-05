import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  buildCubies,
  paintCubiesFromState,
  gridToWorld,
  axisForFace,
  rotateGridPosition,
  faceForAxisLayer,
  directionForAngleSign,
  CELL_SPACING,
  type Cubie3D,
} from '../lib/cubieBuilder';
import type { CubeState, CubeSize, FaceId, Move } from '../../../shared/types';

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

interface Props {
  cubeState: CubeState;
  size: CubeSize;
  viewSize?: number;
  interactive: boolean;
  onMove: (move: Move) => void;
}

type Axis = 'x' | 'y' | 'z';

// expo-glのコンテキスト型はバージョンによってexport名が変わりやすいため、
// 実際に使うプロパティだけを持つ最小限の型を自前で定義する。
interface GLContext extends WebGLRenderingContext {
  endFrameEXP: () => void;
}

interface TurnDragInfo {
  cubie: Cubie3D;
  candidateAxes: Axis[];
  screenVel: Partial<Record<Axis, { x: number; y: number }>>;
  locked: boolean;
  lockedAxis?: Axis;
  layerIndex?: number;
  face?: FaceId;
  pivot?: THREE.Group;
  cubiesInLayer?: Cubie3D[];
  liveAngle: number;
}

interface OrbitDragInfo {
  startAzimuth: number;
  startPolar: number;
}

interface ActiveTurnAnim {
  pivot: THREE.Group;
  axis: Axis;
  cubies: Cubie3D[];
  face: FaceId;
  targetAngle: number;
  /** -2, -1, 0(キャンセル), 1, 2 */
  quarterSteps: number;
}

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

const DRAG_LOCK_THRESHOLD_PX = 6;
const TURN_SENSITIVITY = 0.012; // 1pxあたりの回転角(ラジアン)
const SNAP_QUARTER = Math.PI / 2;
const ORBIT_SENSITIVITY = 0.008;
const POLAR_MIN = 0.15;
const POLAR_MAX = Math.PI - 0.15;

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function projectToScreen(point: THREE.Vector3, camera: THREE.Camera, w: number, h: number) {
  const ndc = point.clone().project(camera);
  return { x: ((ndc.x + 1) / 2) * w, y: ((1 - ndc.y) / 2) * h };
}

function axisVector(axis: Axis): THREE.Vector3 {
  switch (axis) {
    case 'x': return new THREE.Vector3(1, 0, 0);
    case 'y': return new THREE.Vector3(0, 1, 0);
    case 'z': return new THREE.Vector3(0, 0, 1);
  }
}

/**
 * 指定軸まわりに角速度+1(単位ベクトル)で回転した場合、originの点が
 * スクリーン上でどちら向きに動くかを表す正規化ベクトルを求める。
 * v = ω × r の関係を使い、現在のカメラ視点でのスクリーン投影で判定する。
 */
function worldDirToScreenVel(
  origin: THREE.Vector3,
  axis: Axis,
  camera: THREE.Camera,
  w: number,
  h: number,
): { x: number; y: number } {
  const omega = axisVector(axis);
  const velocity = new THREE.Vector3().crossVectors(omega, origin);
  if (velocity.lengthSq() < 1e-8) return { x: 0, y: 0 };

  const p0 = projectToScreen(origin, camera, w, h);
  const p1 = projectToScreen(origin.clone().addScaledVector(velocity, 0.05), camera, w, h);
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

// ---------------------------------------------------------------------------
// コンポーネント
// ---------------------------------------------------------------------------

export function Cube3DView({ cubeState, size, viewSize = 300, interactive, onMove }: Props) {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubiesRef = useRef<Cubie3D[]>([]);
  const renderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sizeRef = useRef<CubeSize>(size);
  const cubeStateRef = useRef<CubeState>(cubeState);
  const interactiveRef = useRef(interactive);
  const onMoveRef = useRef(onMove);
  const pendingSelfMoveRef = useRef(false);
  sizeRef.current = size;
  cubeStateRef.current = cubeState;
  interactiveRef.current = interactive;
  onMoveRef.current = onMove;

  const cameraStateRef = useRef({
    azimuth: Math.PI / 4,
    polar: Math.PI / 3,
    distance: Math.max(4, size * CELL_SPACING * 1.7),
  });
  const pinchStartDistanceRef = useRef(cameraStateRef.current.distance);

  const dragKindRef = useRef<'none' | 'orbit' | 'turn'>('none');
  const orbitDragRef = useRef<OrbitDragInfo>({ startAzimuth: 0, startPolar: 0 });
  const turnDragRef = useRef<TurnDragInfo | null>(null);
  const activeTurnAnimRef = useRef<ActiveTurnAnim | null>(null);

  // -----------------------------------------------------------------------
  // カメラ
  // -----------------------------------------------------------------------

  const updateCameraTransform = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    const { azimuth, polar, distance } = cameraStateRef.current;
    camera.position.set(
      distance * Math.sin(polar) * Math.sin(azimuth),
      distance * Math.cos(polar),
      distance * Math.sin(polar) * Math.cos(azimuth),
    );
    camera.lookAt(0, 0, 0);
  }, []);

  // -----------------------------------------------------------------------
  // シーン構築 / 再彩色
  // -----------------------------------------------------------------------

  const rebuildCubies = useCallback((n: CubeSize) => {
    const scene = sceneRef.current;
    if (!scene) return;

    for (const cubie of cubiesRef.current) {
      scene.remove(cubie.group);
    }
    const cubies = buildCubies(n);
    for (const cubie of cubies) scene.add(cubie.group);
    cubiesRef.current = cubies;
    paintCubiesFromState(cubies, cubeStateRef.current, n);

    cameraStateRef.current.distance = Math.max(4, n * CELL_SPACING * 1.7);
    pinchStartDistanceRef.current = cameraStateRef.current.distance;
  }, []);

  // -----------------------------------------------------------------------
  // 毎フレーム更新(スナップアニメーション)
  // -----------------------------------------------------------------------

  const finishTurnAnim = useCallback((at: ActiveTurnAnim) => {
    const scene = sceneRef.current;
    const n = sizeRef.current;
    if (!scene) return;

    scene.updateMatrixWorld(true);
    for (const cubie of at.cubies) {
      scene.attach(cubie.group);
    }

    if (at.quarterSteps !== 0) {
      const angleSign: 1 | -1 = at.quarterSteps > 0 ? 1 : -1;
      const times: 1 | 2 = Math.abs(at.quarterSteps) === 2 ? 2 : 1;
      for (const cubie of at.cubies) {
        const newPos = rotateGridPosition(cubie.gridPos, at.axis, angleSign, times, n);
        cubie.gridPos = newPos;
        cubie.group.position.copy(gridToWorld(newPos, n));
      }
    }

    scene.remove(at.pivot);

    if (at.quarterSteps !== 0) {
      const angleSign: 1 | -1 = at.quarterSteps > 0 ? 1 : -1;
      const direction = directionForAngleSign(at.face, angleSign);
      const move: Move = { face: at.face, direction, wide: false, double: Math.abs(at.quarterSteps) === 2 };
      pendingSelfMoveRef.current = true;
      onMoveRef.current(move);
    }
  }, []);

  const tick = useCallback((dtMs: number) => {
    const at = activeTurnAnimRef.current;
    if (!at) return;
    const current = at.pivot.rotation[at.axis];
    const diff = at.targetAngle - current;
    if (Math.abs(diff) < 0.008) {
      at.pivot.rotation[at.axis] = at.targetAngle;
      finishTurnAnim(at);
      activeTurnAnimRef.current = null;
      return;
    }
    const step = diff * Math.min(1, dtMs / 80);
    at.pivot.rotation[at.axis] = current + step;
  }, [finishTurnAnim]);

  // -----------------------------------------------------------------------
  // GLコンテキスト初期化
  // -----------------------------------------------------------------------

  const onContextCreate = useCallback((gl: GLContext) => {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    // React Native環境には`document`が存在しないため、THREE.WebGLRendererが
    // 内部でcanvas要素を生成しようとして落ちる。最小限のcanvasスタブを渡して回避する
    // (expo-gl + three.jsの定番の組み合わせ方)。
    const canvasStub = {
      width,
      height,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      clientHeight: height,
      getContext: () => gl,
    };

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasStub as unknown as HTMLCanvasElement,
      context: gl as unknown as WebGLRenderingContext,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    // alpha=0(透明)だとexpo-glのフレームバッファ合成でRN側に何も表示されない
    // 既知の問題があるため、不透明クリアにする(アプリ背景は元々ほぼ黒なので見た目上の差はない)。
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-4, -2, -3);
    scene.add(fillLight);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    rebuildCubies(sizeRef.current);
    updateCameraTransform();

    // 既知の未解決の問題: requestAnimationFrame/setIntervalいずれのループでも、
    // onContextCreate内での初回同期描画より後のrender()呼び出しがこの環境
    // (Expo Go + expo-gl + react-native-reanimated併用)では画面に反映されない
    // (実測で複数パターンを切り分け済み、原因未特定)。
    // そのため現状は初回フレームのみ描画し、以降の更新(回転アニメーション・
    // カメラドラッグ)は反映されない。Expo Dev Client/実機での再検証が必要。
    renderer.render(scene, camera);
    gl.endFrameEXP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (renderIntervalRef.current !== null) clearInterval(renderIntervalRef.current);
    };
  }, []);

  // サイズ変更 -> 全面再構築(マウント直後はGLがまだ無いのでスキップされ、onContextCreate側の初回構築に任せる)
  useEffect(() => {
    if (!sceneRef.current) return;
    rebuildCubies(size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // cubeState変更(スクランブル/リセット/Undo等の外部要因) -> 再彩色。
  // 自分自身のonMoveがきっかけで変わった場合は、3D側は既に見た目が一致しているのでスキップする。
  useEffect(() => {
    if (!sceneRef.current) return;
    if (pendingSelfMoveRef.current) {
      pendingSelfMoveRef.current = false;
      return;
    }
    paintCubiesFromState(cubiesRef.current, cubeState, sizeRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cubeState]);

  // -----------------------------------------------------------------------
  // ジェスチャー: 開始(レイキャストでヒットテスト)
  // -----------------------------------------------------------------------

  const handleBegin = useCallback((x: number, y: number) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!scene || !camera) {
      dragKindRef.current = 'none';
      return;
    }

    if (!interactiveRef.current) {
      dragKindRef.current = 'orbit';
      orbitDragRef.current = {
        startAzimuth: cameraStateRef.current.azimuth,
        startPolar: cameraStateRef.current.polar,
      };
      return;
    }

    const ndc = new THREE.Vector2((x / viewSize) * 2 - 1, -(y / viewSize) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);
    scene.updateMatrixWorld(true);

    const groups = cubiesRef.current.map((c) => c.group);
    const hits = raycaster.intersectObjects(groups, true);
    const hit = hits.find((h) => h.object.userData.faceId !== undefined);

    if (!hit) {
      dragKindRef.current = 'orbit';
      orbitDragRef.current = {
        startAzimuth: cameraStateRef.current.azimuth,
        startPolar: cameraStateRef.current.polar,
      };
      return;
    }

    const cubieIndex = hit.object.userData.cubieIndex as number;
    const hitFace = hit.object.userData.faceId as FaceId;
    const cubie = cubiesRef.current[cubieIndex];
    const { axis: normalAxis } = axisForFace(hitFace);
    const allAxes: Axis[] = ['x', 'y', 'z'];
    const candidateAxes = allAxes.filter((a) => a !== normalAxis);

    const hitPointWorld = hit.point.clone();
    const screenVel: Partial<Record<Axis, { x: number; y: number }>> = {};
    for (const axis of candidateAxes) {
      screenVel[axis] = worldDirToScreenVel(hitPointWorld, axis, camera, viewSize, viewSize);
    }

    dragKindRef.current = 'turn';
    turnDragRef.current = { cubie, candidateAxes, screenVel, locked: false, liveAngle: 0 };
  }, [viewSize]);

  // -----------------------------------------------------------------------
  // ジェスチャー: 更新
  // -----------------------------------------------------------------------

  const handleUpdate = useCallback((translationX: number, translationY: number) => {
    if (dragKindRef.current === 'orbit') {
      const start = orbitDragRef.current;
      const nextAzimuth = start.startAzimuth - translationX * ORBIT_SENSITIVITY;
      let nextPolar = start.startPolar - translationY * ORBIT_SENSITIVITY;
      nextPolar = Math.min(POLAR_MAX, Math.max(POLAR_MIN, nextPolar));
      cameraStateRef.current.azimuth = nextAzimuth;
      cameraStateRef.current.polar = nextPolar;
      updateCameraTransform();
      return;
    }

    if (dragKindRef.current !== 'turn') return;
    const drag = turnDragRef.current;
    const scene = sceneRef.current;
    const n = sizeRef.current;
    if (!drag || !scene) return;

    if (!drag.locked) {
      const dist = Math.hypot(translationX, translationY);
      if (dist < DRAG_LOCK_THRESHOLD_PX) return;

      let bestAxis: Axis = drag.candidateAxes[0];
      let bestDot = -Infinity;
      for (const axis of drag.candidateAxes) {
        const v = drag.screenVel[axis];
        if (!v) continue;
        const dot = translationX * v.x + translationY * v.y;
        if (Math.abs(dot) > Math.abs(bestDot)) {
          bestDot = dot;
          bestAxis = axis;
        }
      }

      const rawLayer = drag.cubie.gridPos[bestAxis];
      const layerIndex = rawLayer >= (n - 1) / 2 ? n - 1 : 0;
      const face = faceForAxisLayer(bestAxis, layerIndex, n);
      const cubiesInLayer = cubiesRef.current.filter((c) => c.gridPos[bestAxis] === layerIndex);

      const pivot = new THREE.Group();
      scene.add(pivot);
      scene.updateMatrixWorld(true);
      for (const c of cubiesInLayer) {
        pivot.attach(c.group);
      }

      drag.locked = true;
      drag.lockedAxis = bestAxis;
      drag.layerIndex = layerIndex;
      drag.face = face;
      drag.pivot = pivot;
      drag.cubiesInLayer = cubiesInLayer;
    }

    if (!drag.lockedAxis || !drag.pivot) return;
    const v = drag.screenVel[drag.lockedAxis];
    if (!v) return;
    const along = translationX * v.x + translationY * v.y;
    const angle = along * TURN_SENSITIVITY;
    drag.liveAngle = angle;
    drag.pivot.rotation[drag.lockedAxis] = angle;
  }, [updateCameraTransform]);

  // -----------------------------------------------------------------------
  // ジェスチャー: 終了
  // -----------------------------------------------------------------------

  const handleEnd = useCallback(() => {
    if (dragKindRef.current === 'turn') {
      const drag = turnDragRef.current;
      if (
        drag && drag.locked && drag.pivot && drag.lockedAxis && drag.face &&
        drag.layerIndex !== undefined && drag.cubiesInLayer
      ) {
        const quarterSteps = Math.max(-2, Math.min(2, Math.round(drag.liveAngle / SNAP_QUARTER)));
        activeTurnAnimRef.current = {
          pivot: drag.pivot,
          axis: drag.lockedAxis,
          cubies: drag.cubiesInLayer,
          face: drag.face,
          targetAngle: quarterSteps * SNAP_QUARTER,
          quarterSteps,
        };
      }
    }
    dragKindRef.current = 'none';
    turnDragRef.current = null;
  }, []);

  // -----------------------------------------------------------------------
  // ジェスチャー定義
  // -----------------------------------------------------------------------

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minPointers(1)
        .maxPointers(1)
        .onBegin((e) => handleBegin(e.x, e.y))
        .onUpdate((e) => handleUpdate(e.translationX, e.translationY))
        .onEnd(() => handleEnd())
        .onFinalize(() => handleEnd()),
    [handleBegin, handleUpdate, handleEnd],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onBegin(() => {
          pinchStartDistanceRef.current = cameraStateRef.current.distance;
        })
        .onUpdate((e) => {
          const n = sizeRef.current;
          const minDist = Math.max(2.5, n * CELL_SPACING * 0.9);
          const maxDist = n * CELL_SPACING * 4;
          const next = pinchStartDistanceRef.current / e.scale;
          cameraStateRef.current.distance = Math.min(maxDist, Math.max(minDist, next));
          updateCameraTransform();
        }),
    [updateCameraTransform],
  );

  const composedGesture = useMemo(
    () => Gesture.Simultaneous(panGesture, pinchGesture),
    [panGesture, pinchGesture],
  );

  // -----------------------------------------------------------------------
  // レンダリング
  // -----------------------------------------------------------------------

  return (
    <View style={[styles.container, { width: viewSize, height: viewSize }]} collapsable={false}>
      <GestureDetector gesture={composedGesture}>
        <View style={{ width: viewSize, height: viewSize }}>
          <GLView
            style={{ width: viewSize, height: viewSize }}
            msaaSamples={0}
            onContextCreate={onContextCreate as unknown as (gl: WebGLRenderingContext) => void}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
