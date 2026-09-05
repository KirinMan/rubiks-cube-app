import * as THREE from 'three/webgpu';
import { useRef, useCallback, useMemo } from 'react';
import type { GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import type { CubeSize, FaceId, Move } from '../../../shared/types';
import { axisForFace, faceForAxisLayer } from '../lib/cubeGeometry';
import { gridKey, type CubeSceneRefs, type CubieRef } from './RubiksCubeScene';
import useOrbitControls from '../../../shared/lib/webgpu/orbitControls';

type Axis = 'x' | 'y' | 'z';

const TURN_SENSITIVITY = 0.012;
const SNAP_QUARTER = Math.PI / 2;
const DRAG_LOCK_THRESHOLD = 6;

interface TurnDragState {
  cubie: CubieRef;
  candidateAxes: Axis[];
  screenVel: Partial<Record<Axis, { x: number; y: number }>>;
  locked: boolean;
  lockedAxis?: Axis;
  layerIndex?: number;
  face?: FaceId;
  cubiesInLayer?: CubieRef[];
  liveAngle: number;
  startX: number;
  startY: number;
}

function axisVector(axis: Axis): THREE.Vector3 {
  switch (axis) {
    case 'x': return new THREE.Vector3(1, 0, 0);
    case 'y': return new THREE.Vector3(0, 1, 0);
    case 'z': return new THREE.Vector3(0, 0, 1);
  }
}

function projectToScreen(point: THREE.Vector3, camera: THREE.Camera, w: number, h: number) {
  const ndc = point.clone().project(camera);
  return { x: ((ndc.x + 1) / 2) * w, y: ((1 - ndc.y) / 2) * h };
}

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

export function useCubeGestures(
  refsBag: React.RefObject<CubeSceneRefs>,
  n: CubeSize,
  interactive: boolean,
  onMove: (move: Move) => void,
) {
  const [OrbitControls, orbitEvents] = useOrbitControls();
  const layoutRef = useRef({ width: 300, height: 300 });
  const turnDragRef = useRef<TurnDragState | null>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  const raycastSticker = useCallback(
    (x: number, y: number) => {
      const camera = refsBag.current.camera;
      if (!camera) return null;
      const { width, height } = layoutRef.current;
      const ndc = new THREE.Vector2((x / width) * 2 - 1, -(y / height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);

      const groups = Array.from(refsBag.current.cubies.values()).map((c) => c.group);
      const hits = raycaster.intersectObjects(groups, true);
      const hit = hits.find((h) => h.object.userData.faceId !== undefined);
      if (!hit) return null;

      const gridPos = hit.object.userData.gridPos as { x: number; y: number; z: number };
      const key = `${gridPos.x},${gridPos.y},${gridPos.z}`;
      const cubie = refsBag.current.cubies.get(key);
      if (!cubie) return null;
      return { cubie, hitFace: hit.object.userData.faceId as FaceId, point: hit.point };
    },
    [refsBag, raycaster],
  );

  const beginTurn = useCallback(
    (x: number, y: number) => {
      const camera = refsBag.current.camera;
      const hit = raycastSticker(x, y);
      if (!hit || !camera) return false;

      const { axis: normalAxis } = axisForFace(hit.hitFace);
      const allAxes: Axis[] = ['x', 'y', 'z'];
      const candidateAxes = allAxes.filter((a) => a !== normalAxis);
      const { width, height } = layoutRef.current;
      const screenVel: Partial<Record<Axis, { x: number; y: number }>> = {};
      for (const axis of candidateAxes) {
        screenVel[axis] = worldDirToScreenVel(hit.point.clone(), axis, camera, width, height);
      }

      turnDragRef.current = {
        cubie: hit.cubie,
        candidateAxes,
        screenVel,
        locked: false,
        liveAngle: 0,
        startX: x,
        startY: y,
      };
      return true;
    },
    [raycastSticker, refsBag],
  );

  const updateTurn = useCallback(
    (x: number, y: number) => {
      const drag = turnDragRef.current;
      const scene = refsBag.current.scene;
      const camera = refsBag.current.camera;
      if (!drag || !scene || !camera) return;

      const translationX = x - drag.startX;
      const translationY = y - drag.startY;

      if (!drag.locked) {
        const dist = Math.hypot(translationX, translationY);
        if (dist < DRAG_LOCK_THRESHOLD) return;

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
        // つまんだキュービーがbestAxis方向の端(0またはn-1)ならそのまま採用できるが、
        // 奇数サイズの中央層(例: 3x3ならy=1)をつまんだ場合はどちらの外層を回したいのか
        // グリッド座標だけでは判定できない。その場合はカメラに近い側の外層を採用する
        // (常にn-1に倒すと、狙った層と逆の層が回ってしまうことがあった)。
        const layerIndex =
          rawLayer <= 0 ? 0 : rawLayer >= n - 1 ? n - 1 : camera.position[bestAxis] >= 0 ? n - 1 : 0;
        const face = faceForAxisLayer(bestAxis, layerIndex, n);
        const cubiesInLayer = Array.from(refsBag.current.cubies.values()).filter(
          (c) => c.gridPos[bestAxis] === layerIndex,
        );

        const pivot = new THREE.Group();
        scene.add(pivot);
        scene.updateMatrixWorld(true);
        // ピボットに繋ぎ替える前(=元のグリッドスロットに正しく居る状態)の位置を
        // 保存しておく。回転アニメーション終了後、この位置へ確実に戻す。
        const basePositions = new Map<string, THREE.Vector3>();
        for (const c of cubiesInLayer) {
          basePositions.set(gridKey(c.gridPos), c.group.position.clone());
          pivot.attach(c.group);
        }

        drag.locked = true;
        drag.lockedAxis = bestAxis;
        drag.layerIndex = layerIndex;
        drag.face = face;
        drag.cubiesInLayer = cubiesInLayer;
        refsBag.current.turnAnim = {
          pivot,
          axis: bestAxis,
          face,
          cubies: cubiesInLayer,
          basePositions,
          targetAngle: 0,
          quarterSteps: 0,
        };
      }

      if (!drag.lockedAxis) return;
      const v = drag.screenVel[drag.lockedAxis];
      if (!v) return;
      const along = translationX * v.x + translationY * v.y;
      const angle = along * TURN_SENSITIVITY;
      drag.liveAngle = angle;

      const anim = refsBag.current.turnAnim;
      if (anim) {
        anim.pivot.rotation[drag.lockedAxis] = angle;
      }
    },
    [n, refsBag],
  );

  const endTurn = useCallback(() => {
    const drag = turnDragRef.current;
    turnDragRef.current = null;
    if (!drag || !drag.locked || !drag.lockedAxis) {
      // ドラッグが閾値未満で終わった場合、ピボットが作られていれば片付ける
      const anim = refsBag.current.turnAnim;
      if (anim && anim.cubies.length > 0 && drag && !drag.locked) {
        // ピボット未作成のケースなので何もしない
      }
      return;
    }

    const anim = refsBag.current.turnAnim;
    if (!anim) return;
    const quarterSteps = Math.max(-2, Math.min(2, Math.round(drag.liveAngle / SNAP_QUARTER)));
    anim.targetAngle = quarterSteps * SNAP_QUARTER;
    anim.quarterSteps = quarterSteps;
  }, [refsBag]);

  const events = useMemo(
    () => ({
      onLayout: (e: LayoutChangeEvent) => {
        layoutRef.current = {
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        };
        orbitEvents.onLayout(e);
      },
      onStartShouldSetResponder: (e: GestureResponderEvent) => {
        if (interactive) {
          const { locationX, locationY } = e.nativeEvent;
          if (beginTurn(locationX, locationY)) return true;
        }
        return orbitEvents.onStartShouldSetResponder(e);
      },
      onMoveShouldSetResponder: (e: GestureResponderEvent) => {
        if (turnDragRef.current) return true;
        return orbitEvents.onMoveShouldSetResponder(e);
      },
      onResponderMove: (e: GestureResponderEvent) => {
        if (turnDragRef.current) {
          const { locationX, locationY } = e.nativeEvent;
          updateTurn(locationX, locationY);
          return;
        }
        orbitEvents.onResponderMove(e);
      },
      onResponderRelease: (e: GestureResponderEvent) => {
        if (turnDragRef.current) {
          endTurn();
          return;
        }
        orbitEvents.onResponderRelease();
      },
    }),
    [interactive, beginTurn, updateTurn, endTurn, orbitEvents],
  );

  return [OrbitControls, events] as const;
}
