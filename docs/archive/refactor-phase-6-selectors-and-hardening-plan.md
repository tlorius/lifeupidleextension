# Refactor Phase 6 Plan: Selector Consolidation and Hardening

Date started: 2026-03-25
Status: Complete
Goal: Consolidate selector patterns across domains, improve selector test depth, and add performance guardrails so UI read-model changes remain fast, predictable, and safe.

## Why this phase exists

Phases 2 through 5 moved major read-heavy and UI-heavy flows behind selector-driven view models and thinner screen orchestrators.

The architecture is now much cleaner, but selector quality and depth are still uneven across domains:

- Some selectors have strong branch coverage, others have only happy-path tests.
- Some presentation models still bundle too many concerns in one object.
- Some expensive derivations are recomputed per render instead of being explicitly cached or memoized at stable boundaries.

This phase stabilizes the selector layer as a long-term foundation for future feature work and balance changes.

## Phase goals

- Standardize selector design patterns and naming across game domains.
- Add branch-complete selector tests for critical gating and edge cases.
- Reduce selector overreach by splitting oversized view-model builders.
- Add lightweight performance guardrails for expensive derivations.
- Preserve all gameplay, progression, and balance behavior.

## In scope

1. Selector inventory and normalization
   - Audit selector modules under `src/game/selectors` for consistency.
   - Normalize return-shape conventions (`ViewModel`, `Summary`, `Panel`) where needed.
   - Reduce mixed responsibilities in oversized selectors by extracting focused helpers.

2. Test hardening
   - Add branch-oriented tests for lock states, gating reasons, empty states, and fallback paths.
   - Add deterministic fixtures for cross-domain edge cases (e.g., prerequisites + low resources + modal selection).
   - Ensure selectors with derived labels/messages are directly asserted in tests.

3. Performance guardrails
   - Identify selectors with recursive or n-squared derivations.
   - Introduce explicit memoized helper boundaries where complexity is measurable.
   - Avoid UI-level recalculation churn by preferring stable computed models.

4. Readability and maintainability cleanup
   - Keep screen components focused on orchestration and event wiring.
   - Keep selector modules focused on pure read-model construction.
   - Minimize duplicated derived-state logic across components.

## Explicit non-goals

- No gameplay rebalance (costs, scaling, drop rates, XP curves, combat numbers).
- No storage schema changes.
- No reducer/action architecture redesign.
- No broad visual redesign.
- No large domain rewrites outside selector/read-model boundaries.

## Constraints and invariants to preserve

- Selector outputs that feed current UI flows remain behavior-compatible unless explicitly migrated with component updates.
- Purchase gating, prerequisite semantics, and unlock ordering remain unchanged.
- Combat, garden, inventory, and resources behavior remains unchanged.
- Save compatibility remains intact.

## Proposed slice order

1. Selector seam audit and risk map
   - Catalog selector modules and classify by complexity/risk.
   - Identify top candidates for branch test expansion and decomposition.
   - Define expected view-model invariants for each critical selector.

2. High-risk selector hardening (Upgrades + Fight)
   - Strengthen tests around lock reasons, gating labels, modal and panel states.
   - Extract helper functions where single selectors encode too many concerns.

3. Medium-risk selector hardening (Garden + Resources)
   - Expand coverage for empty/fallback states and derived summary labels.
   - Verify consistency of totals/breakdowns against engine/domain functions.

4. Low-risk selector cleanup (Inventory + misc)
   - Normalize naming/shape conventions.
   - Remove duplicated derivations from components where still present.

5. Performance and final pass
   - Add memoization/caching where high-cost derivations are proven.
   - Run full validation and close with an architecture checklist.

## Slice 1 Output: Selector Risk Map

Audit basis: selector source size, branch density, recursive/graph derivation, and current test depth.

| Module                            | Source lines | Test lines | Risk   | Why                                                                                                                        |
| --------------------------------- | -----------: | ---------: | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `src/game/selectors/fight.ts`     |          611 |        213 | High   | Broad surface area with many view-model builders and branch-heavy combat UI projections.                                   |
| `src/game/selectors/upgrades.ts`  |          422 |         74 | High   | Unlock/purchase gating, rich action messaging, recursive tier derivation, and relatively lighter direct branch assertions. |
| `src/game/selectors/garden.ts`    |          468 |        202 | Medium | Large data assembly and automation projections, but better relative test coverage for core flows.                          |
| `src/game/selectors/inventory.ts` |          204 |         87 | Medium | Grouping and selection behavior with moderate branch surface.                                                              |
| `src/game/selectors/resources.ts` |           91 |         37 | Low    | Compact derivation logic with straightforward branches.                                                                    |

### Immediate execution order derived from risk map

1. Start with `upgrades.ts` and `fight.ts` for branch-hardening and decomposition.
2. Continue with `garden.ts` for fallback/edge-path hardening and consistency checks.
3. Finish with `inventory.ts` and `resources.ts` normalization/perf guardrails.

## Progress

- Completed: Slice 1 selector seam audit and risk map.
- Completed: Slice 2 high-risk hardening (Upgrades + Fight).
- Completed: Slice 3 medium-risk hardening (Garden + Resources).
- Completed: Slice 4 low-risk cleanup (Inventory + misc).
- Completed: Slice 5 performance and final pass.

## Slice 2 Outcome: Upgrades + Fight hardening

Implemented changes:

- Extracted focused helper boundaries in `src/game/selectors/upgrades.ts` for upgrade tier resolution and lock-reason/action-title derivation.
- Corrected upgrade lock messaging so linked-level gating is surfaced distinctly from unmet prerequisite gating.
- Added branch-oriented upgrade selector tests for linked-level gating, insufficient-gold gating, and missing selected-upgrade modal fallback.
- Added fight selector tests for hidden spell panel state, empty consumable modal state, and negative DPS delta presentation.

Validation run:

- Focused selector tests passed: `src/game/selectors/upgrades.test.ts`, `src/game/selectors/fight.test.ts`.
- Full Vitest suite passed: 16 files, 190 tests.
- Production build passed: `tsc -b && vite build`.
- Build warning remains unchanged: bundle chunk exceeds 500 kB warning from Vite reporter.

## Slice 3 Outcome: Garden + Resources hardening

Implemented changes:

- Added Garden selector tests for seed-maker fallback state, missing crop-detail fallback, empty automation-tile fallback, and direct consistency checks against garden yield and gold domain helpers.
- Added Resources selector tests for expired temporary potion state, default permanent-stat delta handling, and direct consistency with engine gold-income calculations.
- Updated floating-point multiplier assertions in resource selector tests to use tolerant comparisons.

Validation run:

- Focused selector tests passed: `src/game/selectors/garden.test.ts`, `src/game/selectors/resources.test.ts`.
- Full Vitest suite passed: 16 files, 195 tests.
- Production build passed: `tsc -b && vite build`.
- Build warning remains unchanged: bundle chunk exceeds 500 kB warning from Vite reporter.

## Slice 4 Outcome: Inventory + misc cleanup

Implemented changes:

- Normalized Inventory selector outputs with explicit empty-state metadata and mass-sell summary fields.
- Moved sell-confirmation text and selection summary derivation out of the Inventory component and behind the selector read model.
- Added Inventory selector tests for filter-specific empty states and missing selected-item/sell-id fallbacks.

Validation run:

- Focused selector tests passed: `src/game/selectors/inventory.test.ts`.
- Full Vitest suite passed: 16 files, 196 tests.
- Production build passed: `tsc -b && vite build`.
- Build warning remains unchanged: bundle chunk exceeds 500 kB warning from Vite reporter.

## Slice 5 Outcome: Performance and final pass

Implemented changes:

- Added indexed inventory UID and equipped-item lookups in `src/game/selectors/inventory.ts` so selected-item, sell-summary, and entry-selection state avoid repeated linear scans.
- Added cached garden seed resolution and presentation lookups in `src/game/selectors/garden.ts` so repeated selector calls reuse stable crop-id and presentation derivations.
- Preserved the existing selector API and behavior while tightening the cost of repeated read-model construction.

Validation run:

- Focused selector tests passed: `src/game/selectors/garden.test.ts`, `src/game/selectors/inventory.test.ts`.
- Full Vitest suite passed: 16 files, 196 tests.
- Production build passed: `tsc -b && vite build`.
- Build warning remains unchanged: bundle chunk exceeds 500 kB warning from Vite reporter.

## Final architecture checklist

- Critical selectors now have direct branch assertions for gating, empty, and fallback states across upgrades, fight, garden, inventory, and resources.
- Oversized read-model builders were split or supported by focused helpers where branch density was highest.
- Recursive and repeated lookup paths now have explicit caching or indexed lookup guardrails.
- Screen components rely on selector-derived UI metadata for critical paths instead of rebuilding it inline.
- Full validation is green and gameplay behavior remains unchanged.

## Implementation rules

- Keep selectors pure and deterministic.
- Prefer small, composable helpers over monolithic selector functions.
- Preserve existing domain helpers as source of truth; do not duplicate formulas.
- Add tests with explicit branch intent (not only snapshot-like broad assertions).
- Favor minimal, behavior-preserving diffs.

## Validation

- Run focused selector tests after each slice.
- Run full Vitest suite after each slice.
- Run production build after each slice.
- Add targeted regression tests whenever selector branches are added or split.

## Exit criteria

Phase 6 is complete when:

- [x] Critical selector modules have branch-complete tests for gating/empty/fallback paths.
- [x] Oversized selector functions are decomposed into focused helpers with clear ownership.
- [x] High-cost selector derivations have explicit performance guardrails.
- [x] Screen components no longer duplicate selector-derived logic in critical paths.
- [x] Tests and build pass without regressions.
- [x] No gameplay/balance behavior changes were introduced.

## Stop rule

- Do not let this phase become feature expansion or gameplay redesign.
- If a desired change alters progression/balance/storage semantics, stop and scope it as a separate phase.
