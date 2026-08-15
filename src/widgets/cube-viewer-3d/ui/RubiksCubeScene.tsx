import * as THREE from 'three/webgpu';
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { CubeSize, CubeState, FaceId, Move } from '../../../shared/types';
import {
  axisForFace,
  buildGridPositions,
  directionForAngleSign,
  faceForAxisLayer,
  type GridPos,
} from '../lib/cubeGeometry';
import { getCubieColors } from '../lib/getCubieColors';
import { CubieMesh } from './CubieMesh';

type Axis = 'x' | 'y' | 'z';

export interface CubieRef {
  gridPos: GridPos;
  group: THREE.Group;
}

/** RubiksCubeSceneとその外側(Viewのタッチハンドラ)が共有する可変状態。 */
export interface CubeSceneRefs {
  camera: THREE.Camera | null;
  cubies: Map<string, CubieRef>;
  scene: THREE.Scene | null;
  turnAnim: {
    pivot: THREE.Group;
    axis: Axis;
    face: FaceId;
    cubies: CubieRef[];
    // ピボットにアタッチする直前(=回転が始まる前)の、各キュービーの本来の
    // グリッドスロット位置。回転アニメーション終了後にこの位置・恒等回転へ
    // 明示的に戻すために使う(colors propは常にcubeStateから再計算されるため、
    // ジオメトリ側は常にこの固定スロットに留まる設計になっている)。
    basePositions: Map<string, THREE.Vector3>;
    targetAngle: number;
    quarterSteps: number;
  } | null;
  // 実際に手が生じた回転の、ジオメトリのリセット待ち情報。onMove()を呼んだ直後は
  // まだcubeStateの更新(=色の再計算)がReact側に反映されていないため、ここで
  // ジオメトリのリセットを即座に行わず、cubeState変更後のuseEffectまで遅延させる。
  // そうしないと「ジオメトリは戻ったが色はまだ古いまま」の1フレームのズレが見える。
  pendingReset: { cubies: CubieRef[]; basePositions: Map<string, THREE.Vector3> } | null;
}

export function gridKey(pos: GridPos): string {
  return `${pos.x},${pos.y},${pos.z}`;
}

export function createSceneRefs(): CubeSceneRefs {
  return { camera: null, cubies: new Map(), scene: null, turnAnim: null, pendingReset: null };
}

function resetCubieGeometry(cubie: CubieRef, basePositions: Map<string, THREE.Vector3>) {
  const base = basePositions.get(gridKey(cubie.gridPos));
  if (base) {
    cubie.group.position.copy(base);
  }
  cubie.group.rotation.set(0, 0, 0);
  cubie.group.quaternion.identity();
  cubie.group.scale.set(1, 1, 1);
}

interface Props {
  cubeState: CubeState;
  size: CubeSize;
  refsBag: React.RefObject<CubeSceneRefs>;
  onMove: (move: Move) => void;
}

function CameraCapture({ refsBag }: { refsBag: React.RefObject<CubeSceneRefs> }) {
  const { camera, scene } = useThree();
  useEffect(() => {
    refsBag.current.camera = camera;
    refsBag.current.scene = scene;
  }, [camera, scene, refsBag]);
  return null;
}

function TurnAnimator({ refsBag, onMove }: { refsBag: React.RefObject<CubeSceneRefs>; onMove: (move: Move) => void }) {
  useFrame((_state, delta) => {
    const anim = refsBag.current.turnAnim;
    if (!anim) return;
    const dtMs = delta * 1000;
    const current = anim.pivot.rotation[anim.axis];
    const diff = anim.targetAngle - current;
    if (Math.abs(diff) < 0.01) {
      anim.pivot.rotation[anim.axis] = anim.targetAngle;
      finishTurn(refsBag, onMove);
      return;
    }
    const step = diff * Math.min(1, dtMs / 80);
    anim.pivot.rotation[anim.axis] = current + step;
  });
  return null;
}

function finishTurn(refsBag: React.RefObject<CubeSceneRefs>, onMove: (move: Move) => void) {
  const anim = refsBag.current.turnAnim;
  const scene = refsBag.current.scene;
  if (!anim || !scene) return;

  // ピボットの回転を確定させ、キュービーを元の(固定)位置の親へ戻す。
  // colors propは常にcubeState由来で再計算される「固定スロット」設計のため、
  // ジオメトリ側もここで必ず元のスロット位置・恒等回転へ戻す必要がある
  // (scene.attach()はワールド変換=回転後の見た目をそのまま保持してしまうため、
  // 明示的にリセットしないと繰り返し回転するたびに位置と色がズレていく)。
  scene.updateMatrixWorld(true);
  for (const cubie of anim.cubies) {
    scene.attach(cubie.group);
  }
  scene.remove(anim.pivot);
  refsBag.current.turnAnim = null;

  if (anim.quarterSteps !== 0) {
    // 実際に手が生じる場合、ここでジオメトリを即座にリセットすると、cubeStateの
    // 更新(=色の再計算)がReactの再レンダリングで反映されるまでの1フレーム、
    // 「位置は戻ったが色はまだ古い」ズレが見えてしまう。そのためリセットは
    // cubeState変更後のuseEffect(下記)まで遅延させ、色とジオメトリを同じ
    // コミットで揃える。
    refsBag.current.pendingReset = { cubies: anim.cubies, basePositions: anim.basePositions };
    const angleSign: 1 | -1 = anim.quarterSteps > 0 ? 1 : -1;
    const direction = directionForAngleSign(anim.face, angleSign);
    const move: Move = {
      face: anim.face,
      direction,
      wide: false,
      double: Math.abs(anim.quarterSteps) === 2,
    };
    onMove(move);
  } else {
    // 手が生じない(ドラッグが閾値未満で0°へ戻った)場合は色は変わらないので、
    // 即座にジオメトリだけ元へ戻せばよい。
    for (const cubie of anim.cubies) {
      resetCubieGeometry(cubie, anim.basePositions);
    }
  }
}

export function RubiksCubeScene({ cubeState, size, refsBag, onMove }: Props) {
  const positions = useMemo(() => buildGridPositions(size), [size]);
  const registeredRef = useRef(new Map<string, CubieRef>());
  // registeredRefはこのコンポーネントインスタンスの寿命を通じて同一のMapを指し続ける。
  // サイズが変わればbuildGridPositions(size)の結果(=キュービーのkey集合)が変わり、
  // 古いキュービーはgroupRef(null)で自動的にMapから削除される(下記のCubieMesh側)ため、
  // ここで明示的にclear()すると、コミットフェーズで先に登録されたgroupRefの結果を
  // 後から実行されるuseEffectが毎回消してしまい、レイキャスト対象が常に空になるバグになる。
  refsBag.current.cubies = registeredRef.current;

  // colors prop(cubeState由来)がコミットされた直後、同じコミットのタイミングで
  // 回転済みレイヤーのジオメトリを固定スロット位置へ戻す。useEffect(非同期・paint後)
  // ではなくuseLayoutEffectを使うことで、「位置は戻ったが色はまだ古い」という
  // 1フレームの見た目のズレを防ぐ。
  useLayoutEffect(() => {
    const pending = refsBag.current.pendingReset;
    if (!pending) return;
    refsBag.current.pendingReset = null;
    for (const cubie of pending.cubies) {
      resetCubieGeometry(cubie, pending.basePositions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cubeState]);

  return (
    <>
      <CameraCapture refsBag={refsBag} />
      <TurnAnimator refsBag={refsBag} onMove={onMove} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} />
      {positions.map((pos) => {
        const key = gridKey(pos);
        return (
          <CubieMesh
            key={key}
            gridPos={pos}
            size={size}
            colors={getCubieColors(cubeState, pos, size)}
            groupRef={(group) => {
              if (group) {
                registeredRef.current.set(key, { gridPos: pos, group });
              } else {
                registeredRef.current.delete(key);
              }
            }}
          />
        );
      })}
    </>
  );
}

// axisForFace/faceForAxisLayerは外部(ジェスチャーハンドラ)でも使うため再エクスポート
export { axisForFace, faceForAxisLayer };
