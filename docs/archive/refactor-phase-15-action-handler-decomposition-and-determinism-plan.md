# Refactor Phase 15 Plan: Action-Handler Decomposition and Deterministic State Updates

Date started: 2026-03-27
Status: Complete
Goal: Reduce complexity in action execution paths by tightening action-handler boundaries, standardizing state mutation style, and adding targeted tests for deterministic behavior.

## Why this phase exists

After Phase 14, quality gates and integration coverage are in a good state. Remaining medium-risk debt is concentrated in large action/state mutation surfaces, where regressions can slip in through inconsistent update patterns.

Phase 15 focuses on behavior-preserving decomposition and determinism hardening.

## Scope

1. Audit current action handler modules and identify high-complexity mutation paths.
2. Standardize mutation/update patterns for selected handlers (no gameplay behavior change).
3. Add focused tests for deterministic outcomes in edge cases.
4. Re-run full validation gates.

## Slices

1. Slice 1: Handler complexity audit
   - Review action handler files for branch-heavy and shared-mutation paths.
   - Pick one highest-value handler group for refactor first (garden or combat).

2. Slice 2: Behavior-preserving decomposition
   - Extract pure helper functions for complex branching.
   - Keep existing external APIs stable.

3. Slice 3: Determinism tests
   - Add tests that run equivalent action sequences and assert identical final state.
   - Cover at least one edge flow where unlocks/resources can diverge.

4. Slice 4: Validation and completion
   - Run `npm run test:integration`.
   - Run `npm run test:run`.
   - Run `npm run build`.

## Exit criteria

Phase 15 is complete when:

- [x] One high-complexity handler group is decomposed into smaller pure helpers.
- [x] Update/mutation style in touched handler paths is consistent.
- [x] New deterministic edge-flow tests pass and guard the refactor.
- [x] Integration, full tests, coverage, and build all pass.

## Slice 1 audit outcome

Audit date: 2026-03-27

Measured action-handler complexity snapshot:

- `src/game/actionHandlers/garden.ts`: 651 lines, branch-heavy (`if`: 30, `case`: 27, `for`: 10).
- `src/game/actionHandlers/combat.ts`: 69 lines, low branch density.
- `src/game/actionHandlers/inventory.ts`: 71 lines, low branch density.
- `src/game/actionHandlers/upgrades.ts`: 14 lines, trivial.

Selected first refactor target:

- `src/game/actionHandlers/garden.ts`

Reason:

- It concentrates most branching and multi-step state transitions.
- It combines area-tool computations, inventory/energy consumption, and action-dispatch mapping in one module.
- It offers clean decomposition seams without public API changes (e.g., extraction of per-action case handlers and shared state-update helpers).

## Slice 2 and Slice 3 outcomes

Implemented in `src/game/actionHandlers/garden.ts`:

- Extracted grouped pure helpers for seed-maker actions, planter seed selection actions, crop planting flow, and tool equip/unequip flow.
- Kept the external API unchanged: `applyGardenAction(state, action)` signature and `GardenAction` union remain stable.

Added deterministic regression guard in `src/game/actionHandlers/garden.test.ts`:

- New test executes the same deterministic sequence twice on cloned input state and asserts deep-equal final state.

## Slice 4 validation

Validation rerun after decomposition and new test:

- `npm run test:integration` passed (8 tests).
- `npm run test:run -- --reporter=dot` passed (21 files, 232 tests).
- `npm run build` passed.
