import { deleteAt, placeBuilding, placeRoadLine } from '../game/placement';
import type { GameState, Position, ToolKind } from '../game/types';

export const placementResult = (game: GameState, tool: ToolKind, position: Position) =>
  tool === 'road'
    ? placeRoadLine(game, position, position)
    : tool === 'delete'
      ? deleteAt(game, position)
      : tool === 'inspect'
        ? { state: game, ok: true, message: `Tile ${position.x}, ${position.z}` }
        : placeBuilding(game, tool, position);
