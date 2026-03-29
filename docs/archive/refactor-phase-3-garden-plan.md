# Refactor Phase 3 Plan: Garden Isolation

Date started: 2026-03-25
Status: Complete
Goal: Refactor the Garden screen as its own phase by isolating derived read models, interaction orchestration, and UI structure without rewriting the underlying garden simulation rules.

## Why this phase exists

Garden is now the largest remaining mixed-responsibility surface in the app.

Today, src/components/Garden.tsx combines:

- large amounts of derived UI state
- modal and tool interaction state
- responsive layout decisions
- direct orchestration of planting, harvesting, automation placement, and previews
- rule lookups from src/game/garden.ts, upgrades, items, and number formatting

That makes Garden harder to change safely than the other major screens. It also means the remaining complexity is concentrated in one place rather than spread across the codebase.

This phase should treat Garden as a dedicated vertical slice, not as a continuation of the generic selector pass from Phase 2.

## Phase goals

- Extract pure Garden selectors for the major read-heavy screen models.
- Break the Garden screen into smaller presentational or feature-local components.
- Reduce the amount of domain logic and cross-system plumbing owned directly by src/components/Garden.tsx.
- Preserve current gameplay rules, automation behavior, and save compatibility.
- Keep the refactor incremental enough that existing Garden tests remain useful as the primary regression net.

## In scope

1. Selector extraction

- Add Garden-focused selectors under src/game/selectors.
- Centralize tile read models, tool availability, seed bag state, automation summaries, crop mastery summaries, and seed maker presentation.
- Move preview calculations and other pure display derivations out of the component where practical.

2. Component decomposition

- Split src/components/Garden.tsx into smaller subcomponents or feature sections.
- Likely seams include the tile grid, toolbars, modals, storage/mastery panels, and automation panels.
- Keep local UI state close to the subcomponents that actually own it when that reduces churn.

3. Interaction orchestration cleanup

- Reduce inline handler complexity by extracting small Garden-specific controller helpers or hooks where needed.
- If Garden still performs writes outside the Phase 1 action layer, add focused action wrappers rather than leaving new direct state mutation patterns in the component.

4. Validation hardening

- Add selector tests for new pure view-model logic.
- Extend Garden integration coverage when a refactor changes interaction boundaries that are not already protected.

## Explicit non-goals

- No gameplay rebalance for crops, watering, prestige, automation timings, or drop rates.
- No storage schema migration.
- No rewrite of applyGardenIdle or the lower-level simulation engine unless a targeted bug fix is strictly required.
- No generic full-app component decomposition effort outside Garden.
- No visual redesign beyond what naturally falls out of component extraction.

## Constraints and invariants to preserve

- Automation tool occupancy remains mutually exclusive per tile.
- Harvester and planter cycles keep their interval-driven remainder behavior.
- Planter seed selection precedence stays unchanged: per-tile override, then global selected planter seed.
- Seed maker cost and duration rules remain unchanged.
- Field unlock and rock-break requirements remain unchanged.
- Existing crop mastery, prestige, and harvest reward behavior must remain intact.

## Proposed slice order

1. Garden seam audit

- Catalog the main read-model clusters inside src/components/Garden.tsx.
- Mark the first extraction seams with the best payoff and lowest mutation risk.
- Do not start moving logic until those seams are written down.

2. Garden selector foundation

- Introduce one or more selector modules for the Garden screen.
- First targets should be the largest pure derivations: tile view models, seed bag options, tool availability, and seed maker display state.
- Keep selectors pure and composed from src/game/garden.ts helpers where possible.

3. Tile and modal decomposition

- Extract the grid or tile rendering layer from the main screen component.
- Move modal-specific read assembly out of the root component.
- Keep transient modal open or close state local unless there is a clear reuse case.

4. Automation and progression panels

- Extract storage, crop mastery, and seed maker sections.
- Isolate automation placement and preview UI into clearer boundaries.

5. Final Garden root cleanup

- Reduce src/components/Garden.tsx to a screen-level orchestrator.
- Reassess whether any remaining complexity is justified as screen glue.

## Progress

- Completed: Defined Phase 3 scope, constraints, and stop rule.
- Completed: Added the first Garden selector slice for seed resolution, seed bag presentation, and seed maker recipe state.
- Completed: Rewired src/components/Garden.tsx to consume the selector-backed seed and seed maker view model.
- Completed: Extracted the seed maker modal into a dedicated Garden component file.
- Completed: Extracted crop tile-detail and empty-field automation modal read models into tested Garden selectors.
- Completed: Extracted the tile-detail modal UI into a dedicated Garden component with smaller crop, rock, and empty-field sections.
- Completed: Extracted the Garden grid rendering into a dedicated presentation component boundary.
- Completed: Extracted tile-cell presentation into dedicated Garden tile components and rewired `renderField` to use them.
- Completed: Extracted shovel-mode and crop-storage panels into dedicated Garden component files.
- Completed: Extracted the top Garden toolbar into a dedicated component with callback-driven orchestration.
- Completed: Extracted the tool-wheel modal into a dedicated Garden component with callback-driven orchestration.
- Completed: Extracted the seed-bag modal into a dedicated Garden component with callback-driven orchestration.
- Completed: Extracted the crop-mastery modal into a dedicated Garden component with callback-driven orchestration.
- Completed: Extracted harvest and rock-break modals into dedicated Garden components with callback-driven orchestration.
- Completed: Extracted the planting modal into a dedicated Garden component with callback-driven orchestration.
- Completed: Performed final Garden root cleanup pass for shared seed mappings, owned-tool counts, and modal close-handler consolidation.
- Completed: Ran final Phase 3 closeout review and confirmed remaining Garden root complexity is justified screen orchestration glue.
- Completed: Phase 3 exit criteria met with clean diagnostics and passing Garden-focused tests.

## Implementation rules

- Prefer pure selectors and explicit view-model types over ad hoc helper chains in the component.
- Reuse existing domain helpers from src/game/garden.ts instead of duplicating rule math.
- Keep file moves and renames incremental; avoid a single large rewrite.
- Preserve behavior first, then improve structure.
- If a subcomponent would just forward dozens of props, stop and re-evaluate the seam before proceeding.

## Validation

- Run focused Garden unit and integration tests after each slice.
- Run the full Vitest suite after each slice.
- Run the production build after each slice.
- Add targeted tests for any newly extracted selector branch or controller helper with non-trivial behavior.

## Exit criteria

Phase 3 is complete when:

- src/components/Garden.tsx is materially smaller and primarily coordinates screen-level state and events.
- The biggest Garden read-heavy calculations live in tested selectors rather than inline component code.
- Major Garden UI sections are split into smaller files with clear ownership boundaries.
- Existing Garden behavior remains stable under unit and integration coverage.
- Tests and build pass without regressions.

## Stop rule

- Do not turn this phase into a garden engine rewrite.
- If a desired change would alter simulation rules, storage shape, or automation semantics, stop and scope that as a separate phase.
