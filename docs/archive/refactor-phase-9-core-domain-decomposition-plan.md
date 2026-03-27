# Refactor Phase 9 Plan: Core Domain Decomposition and Module-Size Reduction

Date started: 2026-03-26
Status: Complete
Goal: Reduce large core-domain file responsibility by extracting bounded internal modules behind stable facades, without gameplay or API behavior changes.

## Scope

1. Split high-cohesion internals from `src/game/garden.ts` while preserving existing exports and call sites.
2. Split progression-neutral item stat/cost math from `src/game/engine.ts`.
3. Split static item definition catalog from runtime item helpers in `src/game/items.ts`.

## Completed decomposition work

### Garden domain

Extracted modules:

- `src/game/gardenSeedMaker.ts`
  - Seed maker costs, duration rules, affordability checks, and craft mutation.
- `src/game/gardenTerrainPattern.ts`
  - Deterministic terrain/rock pattern helpers and rock grid generation.
- `src/game/gardenTerrainActions.ts`
  - Field unlock cost evaluation, unlock mutation, and rock-break mutation.

Facade strategy:

- `src/game/garden.ts` retains public exports and delegates to extracted modules.
- Shared local helpers remain in `garden.ts` where needed and are passed into extracted modules through narrow helper callbacks.
- Existing call sites in action handlers, selectors, and UI remain unchanged.

### Engine domain

Extracted module:

- `src/game/engineItemMath.ts`
  - `calculateItemStat`
  - `getItemStats`
  - `calculateUpgradeCost`

Facade strategy:

- `src/game/engine.ts` preserves existing exported signatures and delegates to module implementations.

### Items domain

Extracted module:

- `src/game/itemsCatalog.ts`
  - Static `itemDefinitions` catalog only.

Facade strategy:

- `src/game/items.ts` now contains runtime helpers (`getItemDefSafe`, `addDebugItems`) and imports `itemDefinitions` from the catalog module.
- Existing external API and item IDs remain unchanged.

## Validation evidence

Focused checks run:

- `npm run test:run -- src/game/engine.test.ts src/game/actions.test.ts src/game/garden.test.ts src/game/storage.test.ts`
- Result: 4 files passed, 103 tests passed.

Full checks run:

- `npm run test:run`
- Result: 20 files passed, 219 tests passed.

Build check:

- `npm run build`
- Result: success.
- Existing warning unchanged: bundle chunk size > 500 kB.

## Exit criteria

Phase 9 is complete when:

- [x] `garden.ts` internals are decomposed into bounded modules behind a stable facade.
- [x] `engine.ts` separates item stat/cost computation logic into a dedicated module.
- [x] `items.ts` separates static catalog data from runtime helper functions.
- [x] Public APIs and gameplay behavior remain compatible.
- [x] Focused tests, full tests, and production build pass.

## Notes for next phase

- Phase 10 can proceed on persistence and migration hardening without blocking on additional domain-file extraction.
- Additional optional decomposition of remaining garden internals (crop lifecycle and automation cycles) can be treated as iterative hardening, not a blocker for Phase 10.
