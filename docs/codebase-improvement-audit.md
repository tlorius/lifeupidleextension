# Codebase Improvement Audit (KISS, DRY, Testability, Expandability)

Date: 2026-03-24
Scope: full repository, with focus on runtime game logic and player-facing flows.

## 1. Executive Summary

The project already has strong foundations:

- Clear domain grouping under src/game.
- Meaningful tests for core game domains.
- Working class system, combat, garden automation, token rewards, and progression loops.

The main scalability risk is concentration of logic in a few very large files and direct state mutations from UI and domain modules. This currently works, but it increases change risk, onboarding time, and regression probability as new features are added.

Primary recommendation:

- Move toward a thin-UI, action-driven domain architecture with explicit boundaries and selectors.
- Keep rules deterministic and test-first.
- Split large modules by bounded context and by write responsibilities.

## 2. Baseline Snapshot

### Code size hotspots

- src/components/Garden.tsx: 5496 lines
- src/components/Fight.tsx: 1671 lines
- src/components/Upgrades.tsx: 1057 lines
- src/game/garden.ts: 1832 lines
- src/game/combat.ts: 1513 lines
- src/game/items.ts: 1092 lines
- src/game/upgrades.ts: 965 lines
- src/game/engine.ts: 946 lines

### Current testing baseline

- Test files exist for game domains (combat, engine, garden, progression, storage, upgrades, token rewards, number formatting).
- Coverage (from existing coverage-final.json):
  - Statements: 1194/1469 (81.28%)
  - Functions: 23/29 (79.31%)
  - Branches: 86/135 (63.70%)
- Coverage includes src/game only; UI components are currently outside coverage scope.

## 3. Priority Improvements

## P0 (high impact, low-to-medium risk)

### P0.1 Introduce a centralized action layer for state writes

Problem:

- Many components directly call setState and compose mutations inline.
- Domain writes are distributed across UI code and game modules.

Recommendation:

- Add an action dispatcher (for example, GameAction union + gameReducer or command handlers).
- Keep UI components as intent emitters only.

Why this matters:

- Reduces duplicated mutation logic.
- Improves testability (action-level tests).
- Makes future refactors safer.

### P0.2 Split oversized components into container + presentational units

Problem:

- Extremely large components combine rendering, local UX state, and domain orchestration.

Recommendation:

- Split by feature slices:
  - Garden screen into toolbar, grid renderer, modal controllers, automation panels.
  - Fight screen into HUD, combat log, spell bar, consumable bar, DPS panel.
- Keep only orchestration in top screen component.

Why this matters:

- Better maintainability and readability.
- Easier component-level testing.
- Reduced merge conflicts.

### P0.3 Standardize immutable update strategy

Problem:

- Mixed update styles exist (immutable spreads, structuredClone, and in-place mutation in domain functions that receive mutable state references).

Recommendation:

- Pick one rule for domain functions:
  - Preferred: pure functions returning new state.
- Explicitly separate pure evaluators from mutating procedures.

Why this matters:

- Predictable behavior.
- Fewer hidden side effects.
- Better debugging and time-travel potential.

### P0.4 Add deterministic dependency injection for time and randomness

Problem:

- Date.now and Math.random are used directly in many paths.

Recommendation:

- Introduce a lightweight runtime context for now/rng.
- Thread this context through simulation functions.

Why this matters:

- Stronger deterministic tests.
- Easier replay/debug of combat and automation edge cases.

## P1 (high impact, medium effort)

### P1.1 Decompose large domain modules by bounded context

Problem:

- garden.ts and combat.ts each contain many responsibilities.

Recommendation:

- Split modules by capability:
  - combat/spells.ts, combat/rewards.ts, combat/simulation.ts, combat/modifiers.ts
  - garden/automation.ts, garden/unlock.ts, garden/crops.ts, garden/sprinklers.ts, garden/rocks.ts

Why this matters:

- Smaller mental units.
- Better ownership and test targeting.
- Easier feature extension.

### P1.2 Add selector layer for derived state

Problem:

- Derived values are recalculated ad hoc across components.

Recommendation:

- Introduce selectors under src/game/selectors.
- Co-locate domain selectors with feature modules.

Why this matters:

- DRY for derived calculations.
- Single source of truth for display logic.
- Lower risk of inconsistent formulas.

### P1.3 Strengthen migration/versioning policy

Problem:

- Migration exists but currently uses broad recursive merge semantics.

Recommendation:

- Create explicit migration steps per version.
- Add migration tests per version transition.

Why this matters:

- Safer live-save evolution.
- Clear rollback/forward strategy.

### P1.4 Add UI flow tests for critical paths

Problem:

- Existing tests focus on game domain logic; key screen flows are untested.

Recommendation:

- Add React Testing Library tests for:
  - Class switch + tree upgrade flow.
  - Spell slot assignment flow.
  - Inventory equip/sell safety behavior.
  - Garden modal interaction flow.

Why this matters:

- Captures integration regressions from refactors.
- Protects player-facing behavior.

## P2 (medium impact, strategic)

### P2.1 Formal domain events and telemetry hooks

Recommendation:

- Emit typed domain events (enemy defeated, node upgraded, field unlocked, etc.).

Benefits:

- Observability and future analytics.
- Easier balancing instrumentation.

### P2.2 Design tokens and shared UI primitives

Recommendation:

- Create shared style tokens and reusable modal/card/button primitives.

Benefits:

- DRY UI style system.
- Faster visual iteration and consistency.

### P2.3 Content pipeline normalization

Recommendation:

- Normalize item, upgrade, class, and crop content into structured registries and validation checks.

Benefits:

- Easier content expansion.
- Lower risk of broken links between IDs and formulas.

## 4. Testing Strategy Upgrade

## Coverage targets for next refactor phases

- Statements: >= 90%
- Functions: >= 90%
- Branches: >= 80%

## Priority test additions

- Branch-focused tests for combat spell routing, cooldown edge cases, defeat/recovery boundaries.
- Branch-focused tests for garden automation timers and unlock costs.
- Save/load migration matrix tests.
- Screen-level integration tests for core loops.

## 5. Suggested Refactor Sequence (for next requests)

1. Introduce action layer without changing behavior.
2. Extract selectors and pure calculators.
3. Split Garden component and garden domain module.
4. Split Fight component and combat domain module.
5. Add UI integration tests for critical flows.
6. Tighten migration/versioning policy.
7. Raise coverage gates in CI.

## 6. Guardrails During Refactor

- Preserve save compatibility at every step.
- Keep old behavior via characterization tests before logic moves.
- Refactor in vertical slices (one flow at a time).
- Never combine mechanical moves and behavior changes in one PR-sized step.

## 7. Definition of Done for Architecture Modernization

- Core writes go through a single action layer.
- Domain modules are split into coherent, sub-500-line units where possible.
- Critical user flows have integration tests.
- Coverage goals met with branch growth, not just statement growth.
- Docs reflect new architecture and migration policy.
