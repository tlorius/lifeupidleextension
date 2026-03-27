# Refactor Phase 8 Plan: Runtime Determinism and Boundary Hardening

Date started: 2026-03-25
Status: Complete
Goal: Tighten deterministic runtime seams, remove generic mutation escape hatches, and establish the next multi-phase architecture roadmap after Phase 7 completion.

## Why this phase exists

Phases 1 through 7 completed the major architecture inversion:

- Reads are selector-driven for major surfaces.
- Writes are action-driven for critical player-facing flows.
- `GameContext` now exposes `dispatch` rather than public `setState` mutation.

The next architectural risk is no longer "where mutations happen"; it is "how predictable and evolvable core runtime behavior is":

- Time and randomness are still partly hardwired in core paths.
- A generic state replacement action currently exists as a compatibility seam.
- Large domain files (`garden.ts`, `engine.ts`, `items.ts`) still carry multi-responsibility load.
- Migration/version policy and UI integration safety nets are still lighter than ideal.

Phase 8 should focus on deterministic seams and strict mutation boundaries before the next large decomposition waves.

## Roadmap audit: completed vs remaining

## Completed phases

- Phase 1: action-layer foundation and first dispatch migrations.
- Phase 2: selector extraction for initial read-heavy screens.
- Phase 3: garden UI and selector decomposition.
- Phase 4: fight isolation and combat domain modularization.
- Phase 5: upgrades isolation and prerequisite/stat module extraction.
- Phase 6: selector hardening and performance guardrails.
- Phase 7: action-layer completion and provider thinning.

## Remaining architecture phases (proposed)

1. Phase 8: runtime determinism and boundary hardening.
   - Remove generic escape hatches and tighten domain-intent actions.
   - Introduce/normalize `now` and `rng` seams in core runtime paths.
   - Add targeted deterministic tests for newly injected seams.

2. Phase 9: core domain decomposition and module-size reduction.
   - Split `garden.ts`, `engine.ts`, and `items.ts` into bounded modules.
   - Keep public APIs stable with thin facades while moving internals.
   - Increase branch coverage where extracted logic has high fan-out.

3. Phase 10: persistence and migration hardening.
   - Move from broad merge-style migration to explicit version-step migrations.
   - Add migration matrix tests across representative saved versions.
   - Add invariant checks for schema normalization and backward compatibility.

4. Phase 11: UI integration coverage and quality gates.
   - Add React Testing Library flows for critical screens.
   - Raise coverage and regression gates (especially branch coverage).
   - Enforce CI checks aligned with the new architecture boundaries.

## Current hotspots informing this roadmap

Current size hotspots (lines):

- `src/game/garden.ts` ~1832
- `src/components/Garden.tsx` ~1692
- `src/components/GardenTileDetailModal.tsx` ~1122
- `src/game/items.ts` ~1092
- `src/game/engine.ts` ~924
- `src/game/upgrades.ts` ~921
- `src/components/Fight.tsx` ~947
- `src/game/combat.ts` ~804

Current deterministic seam gaps:

- Direct `Date.now()` usage remains across `engine.ts`, `garden.ts`, `state.ts`, `storage.ts`, class state, progression, and provider init/tick flow.
- Direct/random default behavior remains in some runtime paths (for example garden drops, item rolls, combat wrappers), though combat already exposes optional `rng` seams in key paths.
- `garden/replaceState` currently exists as a broad compatibility action and should be narrowed over time.

## Phase 8 goals

- Make runtime-critical rules deterministic by default in tests and controllable at integration seams.
- Reduce mutation-boundary looseness by replacing broad state replacement with explicit domain intents where feasible.
- Preserve gameplay behavior and save compatibility while tightening architecture.

## Phase 8 in scope

1. Deterministic seam normalization
   - Introduce a lightweight runtime context shape (`now`, `rng`) for targeted high-risk paths.
   - Thread explicit time/rng parameters through selected `engine` and `garden` write helpers where practical.
   - Keep default production behavior unchanged (fallback to real clock/random).

2. Boundary strictness pass
   - Audit and reduce generic state replacement paths (starting with garden tile-detail interaction flow).
   - Replace broad mutation shortcuts with explicit actions where action semantics are clear.

3. Determinism-focused tests
   - Add direct tests that pin clock/random-dependent outcomes.
   - Add regression tests for any action-path narrowed from generic replacement.

4. Documentation and guardrails
   - Document accepted provider-orchestration responsibilities vs action-handler mutation responsibilities.
   - Add implementation rules for new runtime code to avoid reintroducing hardwired time/random calls in domain logic.

## Explicit non-goals

- No gameplay rebalance.
- No full garden or engine rewrite in this phase.
- No storage schema redesign (defer to Phase 10).
- No broad UI redesign.

## Constraints and invariants to preserve

- Save compatibility and existing state normalization behavior.
- Combat, garden, and progression outcomes remain behavior-compatible.
- Provider remains orchestration-first for initialization and periodic tick scheduling.
- Action handlers remain the only place for migrated domain state transitions.

## Proposed Phase 8 slices

1. Slice 1: Determinism seam audit and target selection
   - Map highest-value `Date.now` and random call sites by gameplay impact.
   - Select a narrow first batch (for example: garden timing and one engine random path).

2. Slice 2: Runtime context introduction (minimal surface)
   - Add shared runtime context type and pass-through defaults.
   - Migrate first target call paths with no behavior change.

3. Slice 3: Garden boundary tightening
   - Replace `garden/replaceState` call sites with explicit garden actions for tile-detail interactions where practical.
   - Keep modal UI behavior unchanged.

4. Slice 4: Determinism and regression tests
   - Add focused tests for migrated deterministic paths and narrowed actions.
   - Run full suite and production build.

5. Slice 5: Final pass and roadmap handoff
   - Summarize remaining decomposition targets for Phase 9.
   - Confirm Phase 8 exit criteria.

## Progress

- Completed: Slice 1 determinism seam audit and first-batch target selection.
- Completed: Slice 2 first-batch runtime seam introduction for selected engine and garden functions.
- Completed: Slice 3 garden boundary tightening (remove generic replace-state path).
- Completed: Slice 4 deterministic and boundary regression test expansion.
- Completed: Slice 5 final pass and Phase 9 handoff.

## Slice 1 Output: Determinism seam map and first migration batch

Audit basis: direct `Date.now()` and `Math.random` usage in runtime modules, plus boundary-loosening mutation seams.

### Determinism seam inventory (runtime-impacting)

High-priority (player-facing outcome timing/randomness):

- `src/game/engine.ts`
  - `getGoldIncome(...)` uses `Date.now()` for temporary effect expiry checks.
  - `usePotion(...)` uses `Date.now()` for potion-duration windows and `Math.random()` for chaos potion roll.
- `src/game/garden.ts`
  - `plantCrop(...)` stamps `plantedAt` with `Date.now()`.
  - `harvestCrop(...)` resets perennial `plantedAt` with `Date.now()`.
  - `reduceCropGrowthTime(...)` computes elapsed from `Date.now()`.
  - `rollSpecialHarvestDrop(...)` already accepts `rng` with default `Math.random` (good seam, unevenly threaded).

Medium-priority (progression/meta timestamps):

- `src/game/progression.ts` stores `lastLevelUpAt` via `Date.now()`.
- `src/game/classes/state.ts` uses `Date.now()` for class swap and daily-check keying.
- `src/game/state.ts` seeds initial timestamps via `Date.now()`.

Low-priority for Phase 8 (orchestration/persistence edge):

- `src/game/GameContext.tsx` initialization timestamp capture via `Date.now()`.
- `src/game/storage.ts` migration/load fallback timestamps via `Date.now()`.

### Boundary strictness inventory

- `src/game/actionHandlers/garden.ts` includes `garden/replaceState` (generic state replacement action).
- `src/components/Garden.tsx` routes tile-detail modal updates through `garden/replaceState` callback.
- `src/components/GardenTileDetailModal.tsx` still produces next-state objects directly via `onStateChange(nextState)` for automation/sprinkler/harvest/speed-up operations.

### First low-risk migration batch (selected)

Batch objective: introduce deterministic seams where behavior impact is high and change surface is small, without changing gameplay logic.

1. Engine deterministic seam injection
   - Add optional `now` to `getGoldIncome(state, now?)` (default `Date.now()`).
   - Add optional context to `usePotion(state, itemUid, options?)`:
     - `options.now` for duration math
     - `options.rng` for chaos potion roll
   - Keep existing call signatures behavior-compatible through defaults.

2. Garden deterministic timestamp seam injection
   - Add optional `now` param to:
     - `plantCrop(state, cropId, row, col, now?)`
     - `harvestCrop(state, cropId, cropIndex, now?)` (perennial reset path)
     - `reduceCropGrowthTime(state, cropId, cropIndex, minutes, gemCost, now?)`
   - Preserve default behavior by falling back to `Date.now()`.

3. Test hardening for this batch
   - Add deterministic unit tests asserting fixed-time outputs for:
     - potion duration end timestamps
     - chaos potion branch selection with seeded rng
     - crop planted/reset timestamps
     - growth-time reduction math with fixed `now`

### Explicitly deferred from first batch

- Removing `garden/replaceState` (target Slice 3 after deterministic seam work lands).
- Provider/storage timestamp policy redesign (Phase 10 scope).
- Broad runtime context threading across every domain function in one pass.

## Slice 2 Outcome: First deterministic seam migration batch

Implemented changes:

- `src/game/engine.ts`
  - Added optional deterministic-time seam to `getGoldIncome(state, now?)`.
  - Added optional deterministic context seam to `usePotion(state, itemUid, options?)` with:
    - `options.now` for duration handling
    - `options.rng` for chaos-potion branch roll
- `src/game/garden.ts`
  - Added optional `now` seam to:
    - `plantCrop(state, cropId, row, col, now?)`
    - `harvestCrop(state, cropId, cropIndex, now?)`
    - `reduceCropGrowthTime(state, cropId, cropIndex, minutes, gemCost, now?)`
  - Preserved default behavior through `Date.now()` fallbacks.
- Added deterministic branch tests:
  - `src/game/engine.test.ts`: explicit `now` for gold income expiry behavior; deterministic `rng` branch for chaos potion.
  - `src/game/garden.test.ts`: explicit `now` for plant timestamp, perennial reset timestamp, and growth-time reduction math.

Validation run:

- Focused tests passed: `src/game/engine.test.ts`, `src/game/garden.test.ts`.
- Full Vitest suite passed: 20 files, 213 tests.
- Production build passed: `tsc -b && vite build`.
- Build warning remains unchanged: bundle chunk exceeds 500 kB warning from Vite reporter.

## Slice 3 Outcome: Garden boundary tightening

Implemented changes:

- Removed generic `garden/replaceState` action from the garden action union and reducer handling.
- Added explicit garden actions for tile-detail modal operations that previously flowed through generic state replacement:
  - `garden/reduceCropGrowthTime`
  - `garden/setCropSprinkler`
  - `garden/placeSprinkler`
  - `garden/removeSprinkler`
- Reworked `GardenTileDetailModal` to emit explicit `GardenAction` intents via `onGardenAction` instead of emitting precomputed `nextState` objects.
- Updated `Garden` root wiring to pass `dispatch` directly as `onGardenAction`.
- Updated action routing and handler tests to align with explicit action boundaries.

Validation run:

- Focused tests passed: `src/game/actionHandlers/garden.test.ts`, `src/game/garden.test.ts`, `src/game/actions.test.ts`.
- Full Vitest suite passed: 20 files, 214 tests.
- Production build passed: `tsc -b && vite build`.
- Build warning remains unchanged: bundle chunk exceeds 500 kB warning from Vite reporter.

## Slice 4 Outcome: Deterministic and boundary regression test expansion

Implemented changes:

- Expanded explicit-action regression coverage in `src/game/actionHandlers/garden.test.ts` for:
  - insufficient-gems no-op path for `garden/reduceCropGrowthTime`
  - place/remove sprinkler actions on empty fields
  - occupancy no-op behavior when placing sprinkler on a tile with another automation tool
- Expanded reducer-routing coverage in `src/game/actions.test.ts` for:
  - `garden/placeSprinkler` and `garden/removeSprinkler`
  - `garden/reduceCropGrowthTime`
- Preserved behavior while tightening confidence around the newly narrowed garden mutation boundary.

Validation run:

- Focused tests passed: `src/game/actionHandlers/garden.test.ts`, `src/game/actions.test.ts`.
- Full Vitest suite passed: 20 files, 219 tests.
- Production build passed: `tsc -b && vite build`.
- Build warning remains unchanged: bundle chunk exceeds 500 kB warning from Vite reporter.

## Slice 5 Outcome: Final pass and Phase 9 handoff

Final pass decisions:

- Kept Phase 8 deterministic seam migration intentionally narrow to avoid schema, balance, or broad runtime rewrites.
- Confirmed the highest-risk garden mutation escape hatch was removed in favor of explicit domain-intent actions.
- Consolidated remaining decomposition work into a concrete Phase 9 handoff list.

Phase 9 decomposition handoff targets:

1. `src/game/garden.ts`
   - Extract bounded modules behind a stable facade:
     - crop lifecycle (`plant`, `grow`, `harvest`, prestige)
     - automation tools (sprinkler/harvester/planter placement + ticks)
     - terrain systems (rocks, field unlock expansion rules)
     - seed maker queue and crafting helpers
   - Keep existing public call signatures stable while moving internals.

2. `src/game/engine.ts`
   - Separate progression-neutral stat/economy computations from inventory and potion mutation flows.
   - Isolate effect-duration and randomness-sensitive logic into test-focused helpers.

3. `src/game/items.ts`
   - Split static item definition catalogs from runtime lookup/derivation helpers.
   - Preserve current item IDs, rarity semantics, and lookup behavior.

4. Integration boundaries
   - Keep `src/game/actions.ts` as the top-level intent router.
   - Keep action handlers as mutation boundaries and avoid moving state writes back into UI components.

Runtime guardrails going forward:

- Domain logic should accept injected `now`/`rng` seams where runtime outcomes depend on time or randomness.
- Default fallbacks to `Date.now()`/`Math.random()` are acceptable only at function boundaries, not scattered through nested logic.
- New UI flows should dispatch explicit action intents rather than passing full next-state objects.
- Provider logic remains orchestration-only (init/tick/offline scheduling), while state mutation stays in action handlers/domain helpers.

## Validation

- Focused tests per migrated deterministic seam.
- Full Vitest suite after each slice.
- Production build after each slice.
- No behavior regressions in combat/garden/progression characterization tests.

## Exit criteria

Phase 8 is complete when:

- [x] A first meaningful set of clock/random-dependent runtime paths uses explicit deterministic seams.
- [x] The primary generic garden replacement path is narrowed or materially reduced.
- [x] New deterministic and regression tests cover migrated seams.
- [x] Full tests and build pass without regressions.
- [x] A clear, evidence-backed handoff to Phase 9 decomposition is documented.

## Stop rule

- Do not expand Phase 8 into a full core-domain rewrite.
- If a change requires broad schema redesign or progression/balance changes, defer to dedicated later phases.
