---
name: refactor-implementation
description: "Use when: add feature, add action handler, add selector, refactor handler, write tests, fix determinism, add migration, optimize bundle, split screen in Life Up Idle refactor-aligned code."
---

# Refactor Implementation Skill (Life Up Idle)

Use this skill to implement new game logic and tests while preserving the refactored architecture.

## Scope

This skill applies to:

- action-handler additions and refactors
- selector additions and derived-state cleanup
- deterministic simulation behavior
- migration-safe persistence updates
- integration and determinism testing
- screen-level lazy loading updates

## Architecture Workflow

1. Classify the change

- Domain behavior: action handler + selector + tests
- UI-only behavior: component + integration tests (+ selector only if derived logic needed)
- Persistence shape change: migration update + migration tests

2. Pick extension points

- Action handler: src/game/actionHandlers/\*
- Selector: src/game/selectors/\*
- Domain logic: src/game/\*
- Integration tests: src/\*.integration.test.tsx
- Persistence and migrations: src/game/storage\* modules

3. Implement with refactor constraints

- Keep mutations in handlers/domain modules.
- Keep selectors pure and reusable.
- Keep state updates immutable.
- Keep deterministic paths injectable for time/random.

## Guardrails (Do/Do Not)

Do:

- Route game-state changes through action handlers.
- Reuse selectors for derived values.
- Add tests for domain logic and user flows.
- Preserve public contracts while decomposing internals.

Do not:

- Put complex domain mutation logic directly in components.
- Mutate state inputs in-place.
- Hardcode non-deterministic dependencies in deterministic core paths.
- Change persisted schema without versioned migration logic.

## Implementation Templates

### Template A: Add a new action

1. Define/extend action type.
2. Add handler logic in the relevant action handler module.
3. Use immutable updates only.
4. Add selector updates if derived state surface changes.
5. Add unit tests for success and edge cases.
6. Add determinism test if the flow is nontrivial.

### Template B: Add a selector

1. Create selector in selector module for the domain.
2. Keep function pure and deterministic.
3. Replace duplicated inline derivation call sites.
4. Add selector tests for edge inputs.

### Template C: Determinism test

1. Create two identical initial states.
2. Run equivalent action sequence on both.
3. Inject deterministic time/random dependencies where required.
4. Assert deep equality of resulting states.

### Template D: Migration update

1. Increment persisted version metadata.
2. Add targeted migration step from previous version.
3. Keep migration explicit and reviewable.
4. Add migration tests with representative legacy snapshots.

## Module-Mapped Examples

Use these as concrete extension patterns:

1. Garden action + selector flow

- Action handler: src/game/actionHandlers/garden.ts
- Domain logic: src/game/garden.ts
- Selector surface: src/game/selectors/garden.ts
- Tests to mirror: src/game/garden.test.ts
- Integration touchpoint: src/app.integration.test.tsx

2. Combat action + deterministic tick flow

- Action handler: src/game/actionHandlers/combat.ts
- Domain logic: src/game/combat.ts and src/game/combatTickOrchestration.ts
- Selector surface: src/game/selectors/fight.ts
- Tests to mirror: src/game/combat.test.ts
- Determinism pattern: run equivalent combat flows with pinned time/random dependencies

3. Inventory/equipment update flow

- Action handler: src/game/actionHandlers/inventory.ts
- Domain logic: src/game/items.ts and src/game/engine.ts
- Selector surface: src/game/selectors/inventory.ts
- Tests to mirror: src/game/items.test.ts or relevant inventory-focused suites

4. Upgrade/progression update flow

- Action handler: src/game/actionHandlers/upgrades.ts
- Domain logic: src/game/upgrades.ts and src/game/progression.ts
- Selector surface: src/game/selectors/upgrades.ts
- Tests to mirror: src/game/upgrades.test.ts and src/game/progression.test.ts

5. Persistence migration flow

- Storage/migration modules: src/game/storage.ts and src/game/storageMigrations.ts
- Tests to mirror: src/game/storage.test.ts
- Rule: any persisted schema change requires explicit versioned migration coverage

## Validation Sequence

Run before completion:

- npm run test:integration
- npm run test:run
- npm run test:coverage
- npm run build

## Quality Notes

- Prefer toBeCloseTo for floating-point math assertions.
- Keep tests non-watch for automated validation runs.
- Treat integration warnings (for example unstable React keys) as regression signals.

## Authoritative References

- docs/REFACTOR-HISTORY.md
- docs/current-architecture-and-flows.md
- docs/codebase-improvement-audit.md
- docs/archive/refactor-phase-8-runtime-determinism-and-hardening-plan.md
- docs/archive/refactor-phase-10-persistence-and-migration-hardening-plan.md
- docs/archive/refactor-phase-14-token-flow-code-splitting-and-coverage-gates-plan.md
- docs/archive/refactor-phase-15-action-handler-decomposition-and-determinism-plan.md
- docs/archive/refactor-phase-16-remaining-handler-decomposition-and-consistency-plan.md
