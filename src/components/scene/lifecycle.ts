import {
  ArcRotateCamera,
  Color4,
  Engine,
  HemisphericLight,
  PointerEventTypes,
  Scene,
  Vector3,
} from '@babylonjs/core';
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
  return { engine, scene };
};

const pickedTile = (scene: Scene): Position | undefined => {
  const metadata = scene.pick(scene.pointerX, scene.pointerY)?.pickedMesh?.metadata as { tile?: Position } | undefined;
  return metadata?.tile;
};

export const wirePointers = (
  scene: Scene,
  dragStart: MutableRefObject<Position | null>,
  isRoadTool: MutableRefObject<boolean>,
  onTileSelected: MutableRefObject<(position: Position) => void>,
  onRoadLineSelected: MutableRefObject<(start: Position, end: Position) => void>,
): void => {
  scene.onPointerObservable.add((event) => {
    const tile = pickedTile(scene);
    if (!tile) {
      return;
    }
    if (event.type === PointerEventTypes.POINTERDOWN && isRoadTool.current) {
      dragStart.current = tile;
      return;
    }
    if (event.type === PointerEventTypes.POINTERUP && isRoadTool.current && dragStart.current) {
      onRoadLineSelected.current(dragStart.current, tile);
      dragStart.current = null;
      return;
    }
    if (event.type === PointerEventTypes.POINTERPICK && !isRoadTool.current) {
      onTileSelected.current(tile);
    }
  });
};
