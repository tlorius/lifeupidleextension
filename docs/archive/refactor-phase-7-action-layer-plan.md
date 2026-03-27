# Refactor Phase 7 Plan: Action Layer Completion and Mutation Boundaries

Date started: 2026-03-25
Status: Complete
Goal: Consolidate remaining write paths behind a single action boundary so state mutations become easier to test, reason about, and extend without spreading domain write logic across UI and provider code.

## Why this phase exists

Phase 6 completed the read side of the architecture:

- Selector-driven read models now cover the major game domains.
- Critical selector branches have direct tests.
- High-cost read paths have basic caching and lookup guardrails.

The main remaining architectural risk is now on the write side.

The codebase already has the start of an action layer:

- `src/game/actions.ts` defines a `GameAction` union and `reduceGameAction`.
- `src/game/useGameActions.ts` exposes a typed action facade to components.
- `GameContext` already dispatches many inventory, upgrade, resource, and class actions through that reducer.

But write paths are still split across multiple patterns:

- Some writes go through `dispatch` and `reduceGameAction`.
- Some writes still happen through ad hoc `setState` closures inside `GameContext`.
- Combat runtime actions currently bypass the reducer and write state through specialized provider wrappers.
- Tick-time simulation and reward application remain mixed into provider orchestration.

This phase completes the mutation boundary so the current architecture becomes more coherent end to end.

## Current starting point

Verified current seams:

- `src/game/actions.ts` already handles resources, class state, inventory actions, upgrade purchase, and reset.
- `src/game/useGameActions.ts` already gives components a typed intent API for those reducer-backed flows.
- `src/game/GameContext.tsx` still owns several direct mutation paths for:
  - combat click attack
  - combat consumable use
  - combat spell cast
  - 1-second tick simulation
  - token reward application

That means the repo is not starting from zero. The best next step is to expand and normalize the existing action model rather than replace it.

## Progress

- Completed: Slice 1 write-path audit and boundary map.
- Completed: Slice 2 inventory and upgrade handler consolidation.
- Completed: Slice 3 combat player-action migration.
- Completed: Slice 4 garden and token-reward write normalization.
- Completed: Slice 5 final pass and provider thinning.

## Slice 1 Output: Write-path audit and boundary map

Audit basis: current reducer coverage, provider-owned mutation closures, and direct component use of raw `setState`.

Verified findings:

- `src/game/actions.ts` already covers resources, classes, inventory, upgrades, and reset through `reduceGameAction`.
- `src/game/useGameActions.ts` already exposes a typed action facade for reducer-backed flows, but still routes combat writes through provider-local functions.
- `src/game/GameContext.tsx` still owns 6 direct mutation closures outside the reducer:
  - 1-second simulation tick
  - combat click attack
  - combat consumable use
  - combat spell cast
  - token reward application
  - initialization/offline progression remains provider-owned orchestration
- `src/components/Garden.tsx` is the only component still consuming raw `setState` from `useGame()`.
- `src/components/Garden.tsx` currently contains 26 direct `setState` write sites, making it the largest component-level bypass of the shared action boundary.

Boundary classification:

- Reducer-backed and already aligned:
  - resources
  - class state
  - inventory actions
  - upgrade purchase
  - reset
- Provider-owned and likely migrate later in this phase:
  - combat player actions
  - token reward application state transition
- Provider-owned and should likely remain orchestration-first for now:
  - initialization/offline progression
  - 1-second tick simulation
- Component-level bypass and highest remaining UI-side write concentration:
  - garden screen interactions

Refined execution order from audit:

1. Keep Slice 2 focused on `actions.ts` organization and direct tests for inventory and upgrades, since those flows are already reducer-backed.
2. Use that handler structure to migrate combat player actions in Slice 3 without touching the tick loop yet.
3. Tackle garden write normalization after combat, because it is the only screen still taking raw `setState` and has the highest UI-side write concentration.
4. Leave initialization and tick-time simulation as provider orchestration unless a clean handler seam emerges.

## Slice 2 Outcome: Inventory and upgrade handler consolidation

Implemented changes:

- Extracted reducer-backed inventory writes into `src/game/actionHandlers/inventory.ts`.
- Extracted reducer-backed upgrade purchase writes into `src/game/actionHandlers/upgrades.ts`.
- Simplified `src/game/actions.ts` so it now delegates inventory and upgrade mutations to domain handler modules instead of owning those implementations inline.
- Added direct handler tests for inventory batch-sell protection and empty-batch behavior, plus direct upgrade handler tests for success and insufficient-gold failure.

Validation run:

- Focused tests passed: `src/game/actions.test.ts`, `src/game/actionHandlers/inventory.test.ts`, `src/game/actionHandlers/upgrades.test.ts`.
- Full Vitest suite passed: 18 files, 200 tests.
- Production build passed: `tsc -b && vite build`.
- Build warning remains unchanged: bundle chunk exceeds 500 kB warning from Vite reporter.

## Slice 3 Outcome: Combat player-action migration

Implemented changes:

- Added `src/game/actionHandlers/combat.ts` to route click attack, consumable use, and spell cast through explicit combat action handlers.
- Expanded `GameAction` so combat player actions now use the shared action boundary instead of provider-local mutation wrappers.
- Added `applyGameAction` in `src/game/actions.ts` so event-producing actions can return both next state and combat events while preserving `reduceGameAction` as a state-only compatibility wrapper.
- Thinned `GameContext` by removing dedicated combat mutation wrappers and moving `useGameActions` to dispatch combat intents directly.
- Added direct combat action-handler tests for click attack, consumable use, and spell-cast no-op behavior.

Validation run:

- Focused tests passed: `src/game/actions.test.ts`, `src/game/actionHandlers/combat.test.ts`, `src/game/combat.test.ts`.
- Full Vitest suite passed: 19 files, 203 tests.
- Production build passed: `tsc -b && vite build`.
- Build warning remains unchanged: bundle chunk exceeds 500 kB warning from Vite reporter.

## Slice 4 Outcome: Garden and token-reward write normalization

Implemented changes:

- Added `src/game/actionHandlers/garden.ts` with explicit garden-domain actions and reducer logic.
- Expanded `GameAction` handling in `src/game/actions.ts` to include garden domain actions and a token rewards apply action.
- Migrated `src/components/Garden.tsx` write paths from direct provider `setState` usage to `dispatch(...)` actions.
- Routed `GardenTileDetailModal` state writes through the action boundary via `garden/replaceState` callback dispatching.
- Normalized token reward state transition in `src/game/GameContext.tsx` by dispatching `rewards/applyTokenRewards` while keeping async orchestration in the provider.
- Added direct tests for the garden action handler in `src/game/actionHandlers/garden.test.ts` and action-layer coverage for rewards application in `src/game/actions.test.ts`.

Validation run:

- Full Vitest suite passed: 20 files, 208 tests.
- Production build passed: `tsc -b && vite build`.
- Build warning remains unchanged: bundle chunk exceeds 500 kB warning from Vite reporter.

## Slice 5 Outcome: Final pass and provider thinning

Implemented changes:

- Removed `setState` from the public `GameContext` value and type so components consume `dispatch` rather than direct provider state mutation hooks.
- Kept provider-owned orchestration boundaries explicit for initialization/offline progression and 1-second simulation tick.
- Preserved garden detail modal compatibility by routing callback-driven state replacement through the action boundary.

Validation run:

- Full Vitest suite passed: 20 files, 208 tests.
- Production build passed: `tsc -b && vite build`.
- Build warning remains unchanged: bundle chunk exceeds 500 kB warning from Vite reporter.

## Phase goals

- Complete the action layer for critical player-facing writes.
- Make `GameContext` thinner and more orchestration-focused.
- Keep state-changing domain logic behind explicit handlers.
- Improve deterministic testability of writes without changing gameplay behavior.
- Preserve current save compatibility and runtime flows.

## In scope

1. Action boundary audit and normalization
   - Catalog all remaining direct write paths in `GameContext` and top-level screens.
   - Classify each write path as reducer-backed, provider-local, or mixed orchestration.
   - Normalize naming and grouping of actions by domain.

2. Provider write-path migration
   - Migrate remaining player-triggered provider mutations behind the action layer.
   - Reduce special-case write closures in `GameContext` where the action layer can safely own the state transition.
   - Preserve current event emission and modal behavior.

3. Action handler organization
   - Split `actions.ts` when it becomes too broad, likely by domain handler modules.
   - Keep the public action boundary stable while improving internal handler ownership.
   - Separate pure reducers/handlers from provider-only orchestration.

4. Deterministic seams for write-heavy logic
   - Introduce lightweight `now` and `rng` seams where action-driven writes depend on time or randomness.
   - Prefer optional runtime context injection over broad architectural rewrites.

5. Test hardening for migrated writes
   - Add direct tests for migrated action handlers.
   - Preserve existing behavior through characterization-style assertions before moving logic.
   - Validate that reducer-backed flows and provider-backed flows remain behavior-compatible.

## Explicit non-goals

- No gameplay rebalance.
- No storage schema redesign.
- No full reducer rewrite for every simulation path in one step.
- No broad UI redesign.
- No component decomposition unless required to remove direct write logic from a migrated flow.

## Constraints and invariants to preserve

- Save compatibility remains intact.
- Current combat, garden, inventory, upgrade, and class behavior remains unchanged.
- Existing selectors remain the source of truth for read models.
- `GameContext` may still orchestrate ticking, persistence, and async token workflows, but state mutation rules should become more explicit.
- Event-producing flows must preserve current event payloads and ordering unless explicitly tested and migrated.

## Proposed slice order

1. Write-path audit and boundary map
   - Identify which writes are already reducer-backed and which still bypass the action layer.
   - Define the migration sequence with the least entangled domain first.
   - Record provider responsibilities that should stay orchestration-only.

2. Inventory and upgrade handler consolidation
   - Tighten the existing reducer-backed domains first.
   - Extract helper handlers from `actions.ts` if needed.
   - Add action-level tests for multi-item sell, item use, equip/upgrade, and upgrade purchase.

3. Combat player-action migration
   - Move click attack, consumable use, and spell cast behind explicit action handlers.
   - Preserve combat events and cooldown behavior.
   - Keep the runtime tick loop unchanged unless a clean seam emerges.

4. Garden and token-reward write normalization
   - Migrate garden UI-triggered writes that still bypass the shared action path.
   - Normalize token reward application boundaries so provider code remains orchestration-only.
   - Keep async/network-facing control flow in the provider, but move state transitions into explicit handlers.

5. Final pass and provider thinning
   - Reduce leftover inline mutation closures in `GameContext` where possible.
   - Document the final mutation boundary rules.
   - Run full validation and close the phase with an architecture checklist.

## Recommended first migration targets

Priority order for lowest-risk structural gain:

1. Inventory and upgrade actions
   - Already reducer-backed.
   - Good place to extract action-domain helpers and define handler patterns.

2. Combat player actions
   - Highest-value gap because they still bypass the reducer.
   - User-triggered and testable independently from the 1-second simulation tick.

3. Garden UI-triggered writes
   - Valuable after combat, but likely broader due to the size of the garden module and screen.

4. Token reward application
   - Useful cleanup target after the core player-triggered writes are normalized.

## Risks to manage

- Combat actions may be tightly coupled to runtime event emission and current provider flow.
- Garden writes may reveal broader component/orchestration debt than this phase should absorb.
- Moving async reward writes behind handlers can blur the line between orchestration and state transition if not kept narrow.
- Over-expanding this phase into a full reducer architecture would slow progress and create unnecessary churn.

## Implementation rules

- Keep migrations vertical and behavior-preserving.
- Prefer explicit domain handlers over one large reducer file.
- Keep provider code responsible for orchestration, not mutation rules.
- Add tests before or alongside each migrated write boundary.
- Do not combine structural write-path refactors with feature work.

## Validation

- Run focused tests after each migrated slice.
- Add direct action-handler tests for newly migrated flows.
- Run full Vitest suite after each slice.
- Run production build after each slice.
- Re-verify save/load behavior for any path that changes persisted state semantics.

## Exit criteria

Phase 7 is complete when:

- [x] Critical player-facing writes go through a single explicit action boundary.
- [x] `GameContext` no longer owns avoidable inline mutation logic for migrated flows.
- [x] Reducer/handler modules have clearer domain ownership than the current single-file action implementation.
- [x] Migrated write paths have direct tests at the action/handler layer.
- [x] Full tests and build pass without regressions.
- [x] No gameplay, save, or event-behavior regressions were introduced.

## Stop rule

- Do not turn this phase into a full runtime engine rewrite.
- If a migration would require redesigning combat simulation, garden simulation, or persistence semantics, stop and scope that work separately.
