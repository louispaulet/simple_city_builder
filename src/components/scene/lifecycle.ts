import { ArcRotateCamera, Color4, Engine, HemisphericLight, PointerEventTypes, Scene, Vector3 } from '@babylonjs/core';
import type { MutableRefObject } from 'react';
import type { Position } from '../../game/types';

export const createSceneEngine = (canvas: HTMLCanvasElement) => {
  const engine = new Engine(canvas, true, { stencil: true }, true);
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.64, 0.78, 0.88, 1);
  const camera = new ArcRotateCamera('camera', -Math.PI / 3, Math.PI / 3.2, 34, Vector3.Zero(), scene);
  camera.lowerBetaLimit = 0.45;
  camera.upperBetaLimit = 1.35;
  camera.lowerRadiusLimit = 16;
  camera.upperRadiusLimit = 48;
  camera.attachControl(canvas, true);
  const light = new HemisphericLight('sun', new Vector3(0.3, 1, 0.2), scene);
  light.intensity = 0.92;
  return { engine, scene, camera };
};

const pickedTile = (scene: Scene): Position | undefined => {
  const metadata = scene.pick(scene.pointerX, scene.pointerY)?.pickedMesh?.metadata as { tile?: Position } | undefined;
  return metadata?.tile;
};

export const wirePointers = (
  scene: Scene,
  canvas: HTMLCanvasElement,
  camera: ArcRotateCamera,
  dragStart: MutableRefObject<Position | null>,
  isRoadTool: MutableRefObject<boolean>,
  onTileSelected: MutableRefObject<(position: Position) => void>,
  onRoadLineSelected: MutableRefObject<(start: Position, end: Position) => void>,
): void => {
  let cameraSuspended = false;
  const suspendCamera = () => {
    if (!cameraSuspended) {
      camera.detachControl();
      cameraSuspended = true;
    }
  };
  const resumeCamera = () => {
    if (cameraSuspended) {
      camera.attachControl(canvas, true);
      cameraSuspended = false;
    }
  };

  scene.onPointerObservable.add((event) => {
    const tile = pickedTile(scene);
    if (event.type === PointerEventTypes.POINTERDOWN && isRoadTool.current) {
      dragStart.current = tile ?? null;
      if (tile) {
        suspendCamera();
      }
      return;
    }
    if (event.type === PointerEventTypes.POINTERUP && (isRoadTool.current || dragStart.current || cameraSuspended)) {
      if (isRoadTool.current && tile && dragStart.current) {
        onRoadLineSelected.current(dragStart.current, tile);
      }
      dragStart.current = null;
      resumeCamera();
      return;
    }
    if (tile && event.type === PointerEventTypes.POINTERPICK && !isRoadTool.current) {
      onTileSelected.current(tile);
    }
  });
};
