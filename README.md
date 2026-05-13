# Simple City Builder

A 3D browser city-builder proof of concept built with Vite, React, TypeScript, TailwindCSS, Babylon.js, and Vitest.

## Gameplay

- Place houses to create room for new people.
- Place workplaces so people can commute and earn wages.
- Place restaurants so people can eat, drink, and spend money.
- Place roads to connect buildings to each other and to the regional map connection point.
- Roads placed over water become bridges.
- Buildings can only be placed on land.
- Saves are stored in browser local storage and can be resumed from the main menu.

## Controls

- Use the toolbar to choose House, Workplace, Road, Restaurant, or Delete.
- Click a tile in the 3D map to build or remove the selected item.
- Drag the map to orbit the camera and scroll to zoom.
- Use Save, Load, and Menu from the HUD.

## Development

```bash
make up
```

The app runs at [http://localhost:5173](http://localhost:5173).

```bash
make test
make build
make kill
```

## Deployment

```bash
make deploy
```

Deployment uses `gh-pages` and publishes the Vite `dist` folder to GitHub Pages. The Vite base path is configured for `https://louispaulet.github.io/simple_city_builder/`.

## Architecture

- React owns menus, HUD, selected tool state, and save/load flow.
- Babylon.js owns the 3D scene, camera, terrain meshes, buildings, roads, bridges, and pointer picking.
- Pure game modules under `src/game` own deterministic terrain, placement rules, pathfinding, save serialization, and simulation so they can be unit-tested without WebGL.
