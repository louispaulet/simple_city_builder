# AGENTS.md

- Always read `AGENTS.md` before starting any task in this repository.
- When a task is explicitly complete and the user asked for it, commit and push the work even if the current branch is `main`.
- Preferred commands:
  - `make up` starts the local Vite development server.
  - `make kill` stops the local Vite development server.
  - `make build` creates a production build.
  - `make test` runs the test suite.
  - `make deploy` builds and publishes the app to GitHub Pages with `gh-pages`.

## Refactor and Structure Rules

- Keep meaningful source modules focused and compact: target 70-100 lines for runtime, test, and CSS feature files.
- Tiny bootstrapping, barrel, setup, and low-level helper files may stay below 70 lines when padding would reduce clarity.
- If a file grows beyond 100 lines, split it by responsibility instead of compressing unrelated concerns together.
- Keep `App.tsx` as a composition shell; move game state orchestration into hooks and UI rendering into `src/ui`.
- Keep `CityScene.tsx` as the React/Babylon lifecycle shell; move mesh construction, materials, roads, population, and signatures into `src/components/scene`.
- Keep `src/game/types.ts` type-focused; put tunable constants and game balance values in `src/game/rules.ts`.
- Keep placement, save, and simulation code split by subsystem folders with short `index.ts` barrels for public imports.
- Keep the simulation loop light by using derived indexes, cached reachability/path checks, and bounded per-tick assignment batches.
- Preserve public gameplay behavior during refactors unless the task explicitly asks for a design change.
- Split tests by behavior area and share fixtures through `src/test/gameFixtures.ts`.
- Split CSS by feature under `src/styles`; preserve existing class names unless a UI change requires otherwise.
