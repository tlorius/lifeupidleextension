# Refactor Phase 5 Plan: Upgrades Isolation

Date started: 2026-03-25
Status: Complete (2026-03-25)
Goal: Refactor the Upgrades screen and upgrade system by isolating derived read models, interaction orchestration, and upgrade domain units without changing progression mechanics or stat calculations.

## Why this phase exists

Phase 4 successfully isolated the Fight domain into 8 coherent modules. The Upgrades system has grown in similar complexity and would benefit from the same treatment.

Today, upgrade mechanics are spread across:

- UI orchestration in `src/components/Upgrades.tsx` (839 lines)
- Domain logic in `src/game/upgrades.ts` (965 lines) and shared stat calculations in `src/game/engine.ts`
- Presentation layer in `src/game/selectors/upgrades.ts` (409 lines)
- Legacy configuration in `src/game/gameConfig.ts`

This fragmentation makes it harder to reason about upgrade prerequisites, progression trees, and stat grants independently from UI concerns.

## Phase goals

- Consolidate upgrade domain logic into coherent modules (tree management, prerequisite validation, stat calculation, progression).
- Expand selector coverage to handle more presentation concerns before reaching UI components.
- Decompose the Upgrades UI into focused feature components (tree navigator, purchase panel, preview modal).
- Remove redundant configuration and duplicated calculations.
- Maintain behavioral compatibility with existing save data and prerequisites.
- Keep refactor slices incremental with continuous validation.

## In scope

1. **Upgrade domain modularization**
   - Extract tree/prerequisite logic from `src/game/upgrades.ts` into `upgradeTree.ts`
   - Extract stat granting and bonus aggregation into `upgradeBonuses.ts`
   - Consolidate upgrade configuration into a single source of truth
   - Maintain `upgrades.ts` as the public API and façade

2. **Selector expansion**
   - Add selectors for purchase readiness, cost values, prerequisite validation
   - Build view models for tree positions, unlock tooltips, tier calculations
   - Cache expensive calculations to avoid recalculation on every render
   - Add selector tests for edge cases (branching, convergence, circular prevention)

3. **Upgrades component decomposition**
   - Extract tree navigator UI into `UpgradesTreeNavigator.tsx`
   - Extract purchase panel into `UpgradesPurchasePanel.tsx`
   - Extract preview modal into `UpgradesPreviewModal.tsx`
   - Keep root component as screen-level orchestrator

4. **Validation hardening**
   - Add tests for prerequisite chains (linear, branching, convergence)
   - Add tests for stat calculations across tree paths
   - Add tests for purchase constraints and gating
   - Add integration tests for unlock sequences

## Explicit non-goals

- No change to upgrade trees, prerequisites, or stat grants.
- No rebalancing or tweaking of progression difficulty.
- No user-facing UI redesign beyond what naturally falls out of component extraction.
- No storage schema changes.
- No changes to Garden or Fight features unless a targeted bug fix is strictly required.

## Constraints and invariants to preserve

- Tree structure and prerequisite semantics remain unchanged.
- Stat calculations for all upgrade paths remain mathematically identical.
- Purchase constraints (cost, level, prerequisites) behave identically.
- Save file compatibility remains intact.
- Progression unlock order and values remain unchanged.
- Cross-tree dependency resolution remains stable.

## Proposed slice order

1. **Upgrade domain seam audit**
   - Catalog domain responsibilities in `src/game/upgrades.ts` and `src/game/engine.ts`
   - Define extraction seams for tree logic, stat calculations, and configuration
   - Establish characterization tests for each seam

2. **Domain consolidation (upgrades.ts refactor)**
   - Consolidate UPGRADE_CONFIG from gameConfig.ts into upgrades.ts
   - Remove redundant configuration sources
   - Extract tree prerequisite logic into focused helpers
   - Validate with focused tests and production build

3. **Stat calculation extraction (upgradeBonuses.ts)**
   - Extract bonus aggregation from `getUpgradeStats()` in engine.ts
   - Move stat granting logic out of `applyUpgrade()`
   - Preserve engine.ts API as a wrapper
   - Validate with upgrades.test.ts and full suite

4. **Selector expansion**
   - Add purchase readiness selectors (can afford, prerequisites met, level unlocked)
   - Add tier and unlock status view models
   - Add cache layer for expensive calculations
   - Add focused selector tests for edge cases

5. **Upgrades component decomposition**
   - Extract tree navigator into focused component
   - Extract purchase panel into focused component
   - Extract preview modal into focused component
   - Root component becomes orchestration glue
   - Validate with integration tests

6. **Final Upgrades root cleanup**
   - Minimize inline calculations and event handling
   - Verify all button state logic delegated to selectors
   - Assess remaining complexity as screen-level glue

## Progress

- Completed: Slice 1 extracted prerequisite/unlock domain logic into `src/game/upgradePrerequisites.ts` while preserving `src/game/upgrades.ts` as the public facade.
- Completed: Slice 2 removed legacy duplicate `UPGRADE_CONFIG` from `src/game/gameConfig.ts` and kept upgrade balance data centralized in `src/game/upgrades.ts`.
- Completed: Slice 3 extracted upgrade stat aggregation into `src/game/upgradeStats.ts` and preserved `engine.ts` API via delegation.
- Completed: Slice 4 expanded selector-driven purchase state in `src/game/selectors/upgrades.ts` and removed duplicated button decision logic from UI.
- Completed: Slice 5 decomposed `src/components/Upgrades.tsx` into focused view components in `src/components/UpgradesViews.tsx`.
- Completed: Slice 6 finalized root cleanup; `src/components/Upgrades.tsx` now acts as orchestration glue (currently 86 lines).
- Validation status: focused upgrade tests, full Vitest suite (186/186), and production build all passing after final slice.

## Implementation rules

- Prefer pure selectors and explicit view-model types over ad hoc calculations in UI.
- Reuse existing domain helpers as the source of truth rather than duplicating formulas.
- Keep file moves and renames incremental; avoid large rewrites.
- Preserve behavior first, then improve structure.
- If a proposed seam requires forwarding too many props, stop and re-evaluate.

## Validation

- Run focused upgrade tests after each slice.
- Run the full Vitest suite after each slice.
- Run production build after each slice.
- Add targeted tests for each newly extracted logic or selector with non-trivial branches.

## Exit criteria

Phase 5 is complete when:

- [x] `src/components/Upgrades.tsx` is materially smaller and primarily coordinates screen-level state and events (`src/components/Upgrades.tsx`: 86 lines).
- [x] Stat calculations live in tested domain modules rather than inline in component or scattered across engine.ts (`src/game/upgradeStats.ts`, `src/game/upgradeStats.test.ts`).
- [x] Upgrade domain logic is split into coherent units with clear ownership boundaries (`src/game/upgradePrerequisites.ts`, `src/game/upgradeStats.ts`, `src/game/upgrades.ts` facade).
- [x] Major upgrade presentation logic (readiness, prerequisites, tiers) lives in selectors with direct unit tests (`src/game/selectors/upgrades.ts`, `src/game/selectors/upgrades.test.ts`).
- [x] Critical upgrade behavior remains stable under unit and integration coverage (full suite passing).
- [x] Tests and build pass without regressions.
- [x] Zero duplicate configuration sources (`UPGRADE_CONFIG` removed from `src/game/gameConfig.ts`).

## Stop rule

- Do not turn this phase into an upgrade rebalance or progression redesign.
- If a desired change alters progression rates, tree structure, or save schema, stop and scope that as a separate phase.
