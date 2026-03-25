# Refactor Phase 2 Plan: Selector Extraction

Date started: 2026-03-24
Status: Complete
Goal: Extract pure, reusable selectors for read-heavy UI state so components stop owning domain calculations.

## Why this phase exists

Phase 1 centralized writes. The next bottleneck is reads.

Several UI components still mix rendering with domain-heavy calculations such as:

- stat aggregation and potion-effect composition
- combat HUD calculations and spell-slot resolution
- DPS summaries and chart data
- grouped inventory summaries and derived upgrade visibility

That makes components harder to test, harder to extend, and easier to break when rules change.

## Phase goals

- Move pure derived-state logic into selector modules under src/game/selectors.
- Keep selectors framework-agnostic and test them directly.
- Leave transient UI state, modal state, animation state, and event side effects inside components.
- Preserve runtime behavior and save compatibility.

## Initial target components

1. Fight

- Extract combat HUD selectors.
- Extract spell-slot and consumable-summary selectors.
- Extract DPS/read-model calculations that are currently embedded in the component.
- Do not redesign combat event handling in this phase.

2. ResourcesDisplay

- Extract stat-breakdown and potion-bonus selectors.
- Centralize gold-income breakdown calculations.

3. Inventory

- Extract grouped/filterable inventory read models.
- Prepare the screen for later presentational decomposition.

4. Upgrades

- Extract upgrade visibility, affordability, and prerequisite read models.

## Explicit non-goals

- No Garden selector wave in this phase unless separately scoped.
- No reducer or action redesign.
- No combat runtime redesign.
- No UI redesign.
- No storage migration work.

## Slice order

1. Fight + ResourcesDisplay
2. Inventory
3. Upgrades
4. Reassess remaining read hot spots

## Progress

- Completed: Fight + ResourcesDisplay selector extraction.
- Completed: Inventory selector extraction.
- Completed: Upgrades selector extraction.
- Completed: Reassessed remaining read hot spots and closed Phase 2.

## Reassessment Outcome

Phase 2 is complete.

Why it is complete:

- The originally targeted read-heavy components now consume selector-backed view models.
- New selector modules have direct unit-test coverage.
- The remaining non-Garden read logic is relatively small, component-local, and not a strong candidate for another dedicated selector slice.

Residual read hotspots kept in components for now:

- SpellSelectModal: small spell-list filtering and slot projection.
- ItemDetail: item-comparison display assembly and potion toast messaging.
- Equipment: local equipped-item slot rendering.
- PlayerProgressTile: lightweight progression preview and progress-bar math.

Why these were not pulled into Phase 2:

- They are materially smaller than the Fight, Inventory, and Upgrades hotspots.
- Extracting them now would add churn without a proportional architectural gain.
- Garden remains the only major read-heavy area, and it is still explicitly out of scope for this phase.

Phase 2 stop rule:

- Do not continue selector extraction in Phase 2 unless a newly identified hotspot is comparable in complexity to the slices already completed.
- Treat any future Garden selector work as a separate, explicitly scoped phase or vertical slice.

Phase 3 handoff:

- Garden is the next major candidate, but only as a dedicated phase with its own scope, validation gates, and stop conditions.
- See docs/refactor-phase-3-garden-plan.md.

## Implementation rules

- Selectors must be pure functions.
- Prefer returning stable, named view-model objects over scattered helper functions.
- Keep existing domain helpers as the source of truth; selectors should compose them rather than duplicate formulas.
- Add focused selector tests for each new branch or calculation family.
- Keep component edits minimal and behavior-preserving.

## Validation

- Add unit tests for selector modules.
- Run the full Vitest suite after each selector slice.
- Run production build after each selector slice.

## Exit criteria

Phase 2 is complete when:

- The targeted read-heavy components no longer own substantial domain calculations.
- New selector modules have direct unit-test coverage.
- Component code is visibly thinner and easier to scan.
- Tests and build pass without behavior regressions.
