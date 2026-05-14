import { useEffect, useRef } from 'react';
import { Scene, TransformNode } from '@babylonjs/core';
import type { GameState, Position } from '../game/types';
import { createLayoutContent } from './scene/layout';
import { createSceneEngine, wirePointers } from './scene/lifecycle';
import { createPopulationContent } from './scene/population';
import { getLayoutSignature, getPopulationSignature } from './scene/signatures';

interface CitySceneProps {
  game: GameState;
  isRoadTool: boolean;
  onTileSelected: (position: Position) => void;
  onRoadLineSelected: (start: Position, end: Position) => void;
}

export function CityScene({ game, isRoadTool, onTileSelected, onRoadLineSelected }: CitySceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const layoutRef = useRef<TransformNode | null>(null);
  const populationRef = useRef<TransformNode | null>(null);
  const onTileSelectedRef = useRef(onTileSelected);
  const onRoadLineSelectedRef = useRef(onRoadLineSelected);
  const isRoadToolRef = useRef(isRoadTool);
  const roadDragStartRef = useRef<Position | null>(null);
  const layoutSignature = getLayoutSignature(game);
  const populationSignature = getPopulationSignature(game);

  useEffect(() => {
    onTileSelectedRef.current = onTileSelected;
    onRoadLineSelectedRef.current = onRoadLineSelected;
    isRoadToolRef.current = isRoadTool;
  }, [isRoadTool, onRoadLineSelected, onTileSelected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    const { engine, scene, camera } = createSceneEngine(canvas);
    sceneRef.current = scene;
    layoutRef.current = new TransformNode('city-layout-placeholder', scene);
    populationRef.current = new TransformNode('city-population-placeholder', scene);
    wirePointers(scene, canvas, camera, roadDragStartRef, isRoadToolRef, onTileSelectedRef, onRoadLineSelectedRef);
    engine.runRenderLoop(() => scene.render());
    const resize = () => engine.resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      engine.dispose();
      sceneRef.current = null;
      layoutRef.current = null;
      populationRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const oldLayout = layoutRef.current;
    if (!scene || !oldLayout) {
      return;
    }
    const nextLayout = createLayoutContent(scene, game);
    nextLayout.setEnabled(true);
    layoutRef.current = nextLayout;
    oldLayout.dispose(false, true);
  }, [layoutSignature]);

  useEffect(() => {
    const scene = sceneRef.current;
    const oldPopulation = populationRef.current;
    if (!scene || !oldPopulation) {
      return;
    }
    const nextPopulation = createPopulationContent(scene, game);
    nextPopulation.setEnabled(true);
    populationRef.current = nextPopulation;
    oldPopulation.dispose(false, true);
  }, [layoutSignature, populationSignature]);

  return <canvas ref={canvasRef} className="h-full w-full touch-none" aria-label="3D city map" />;
}
