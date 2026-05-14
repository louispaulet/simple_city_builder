import type { BuildingKind, BuildingVariant } from '../../game/types';

export interface BuildingDimensions {
  width: number;
  depth: number;
  height: number;
}

export const dimensionsFor = (kind: BuildingKind, variant: BuildingVariant): BuildingDimensions => ({
  house: [
    { width: 1.2, depth: 1.05, height: 1.0 },
    { width: 1.34, depth: 0.92, height: 1.25 },
    { width: 0.96, depth: 1.34, height: 1.1 },
    { width: 1.42, depth: 1.12, height: 1.0 },
  ],
  workplace: [
    { width: 1.22, depth: 1.22, height: 2.3 },
    { width: 1.36, depth: 1.05, height: 2.7 },
    { width: 1.1, depth: 1.34, height: 2.05 },
    { width: 1.46, depth: 1.18, height: 1.85 },
  ],
  restaurant: [
    { width: 1.32, depth: 1.08, height: 1.12 },
    { width: 1.12, depth: 1.34, height: 1.24 },
    { width: 1.48, depth: 1.0, height: 1.0 },
    { width: 1.22, depth: 1.22, height: 1.38 },
  ],
  bar: [
    { width: 1.24, depth: 1.18, height: 1.18 },
    { width: 1.42, depth: 1.0, height: 1.04 },
    { width: 1.04, depth: 1.42, height: 1.34 },
    { width: 1.34, depth: 1.16, height: 1.48 },
  ],
  park: [{ width: 1, depth: 1, height: 1 }],
}[kind][variant]);
