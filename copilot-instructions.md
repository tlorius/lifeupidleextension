# Life Up Idle Refactor-Aligned Coding Instructions

These instructions define how new code should align with the completed refactor phases documented in the docs folder.

## Purpose

Use this guidance when implementing features, fixing bugs, writing tests, or refactoring game logic so new work stays consistent with the architecture introduced across phases 1-18.

## Source of Truth

When unsure, consult these docs first:

- docs/REFACTOR-HISTORY.md
- docs/current-architecture-and-flows.md
- docs/codebase-improvement-audit.md
- docs/DEVELOPER-SETUP.md
- docs/archive/refactor-phase-8-runtime-determinism-and-hardening-plan.md
- docs/archive/refactor-phase-10-persistence-and-migration-hardening-plan.md
- docs/archive/refactor-phase-14-token-flow-code-splitting-and-coverage-gates-plan.md
- docs/archive/refactor-phase-15-action-handler-decomposition-and-determinism-plan.md
- docs/archive/refactor-phase-16-remaining-handler-decomposition-and-consistency-plan.md

## Enforcement Language

- MUST: Correctness, architectural safety, or persistence integrity requirement.
- SHOULD: Strongly preferred pattern with rare exceptions.
- MAY: Optional improvement.

## Architecture Rules

1. Action-handler state flow

- MUST route game-state mutations through action handlers under src/game/actionHandlers.
- MUST keep components free of inline domain mutation logic.
- SHOULD trigger state changes through existing game action APIs/hooks.

2. Selector-first derived state

- MUST place derived computations in pure selectors under src/game/selectors or clear domain selector modules.
- MUST keep selectors side-effect free, mutation free, and I/O free.
- SHOULD reuse selectors instead of duplicating derived formulas in UI files.

3. Deterministic simulation contract

- MUST support injectable time/random dependencies in deterministic core logic where relevant.
- MUST NOT hardwire Date.now or Math.random into core simulation paths when injection is feasible.
- SHOULD preserve backward-compatible defaults for optional dependencies.

4. Immutable updates

- MUST return new state objects from domain logic.
- MUST NOT mutate input state objects in place.
- SHOULD use clear immutable patterns for nested updates.

5. Bounded-context module boundaries

- MUST keep garden, combat, progression, upgrades, inventory, and class responsibilities separated.
- SHOULD extract pure helpers by capability as files grow.
- MUST avoid cross-domain mutation behavior.

6. Handler decomposition

- SHOULD split complex handlers into focused pure helpers with stable behavior.
- MUST preserve public action contracts while refactoring internals.

7. Screen-level code splitting

- SHOULD add new major screens/heavy views with lazy loading patterns consistent with current App structure.
- MUST keep shared state/orchestration centralized rather than duplicated per lazy screen.

## Testing and Validation

1. Determinism regression tests

- MUST add determinism tests for nontrivial action-handler/simulation changes.
- SHOULD run equivalent action flows multiple times and assert equivalent resulting state.
- SHOULD cover edge flows such as depletion, cooldown boundaries, repeated actions, and automation ticks.

2. Unit and integration behavior coverage

- MUST add focused unit tests for new domain logic and selectors.
- SHOULD add/extend integration tests for user-facing flow changes across component boundaries.

3. Validation command sequence before completion

- npm run test:integration
- npm run test:run
- npm run test:coverage
- npm run build

4. Coverage and quality posture

- SHOULD maintain the post-refactor coverage posture and avoid untested logic branches.

## Persistence and Migration Guardrails

When changing persisted GameState shape or semantics:

- MUST use explicit version-aware migration logic.
- MUST avoid broad merge behavior that can hide schema mismatches.
- SHOULD add migration tests for representative prior versions.
- MUST update version metadata in a controlled and reviewable way.

## Anti-Patterns to Avoid

- Direct component-level domain mutation for complex game logic.
- Re-deriving complex state in multiple UI files instead of selectors.
- In-place mutation of state objects passed to domain functions.
- Large all-in-one handler functions that mix unrelated responsibilities.
- Non-deterministic behavior in core simulation paths without injectable dependencies.
- Persistence shape changes without explicit migration coverage.

## Quick Templates

1. Action handler extension checklist

- Define or extend action type.
- Implement mutation path in domain action handler.
- Keep update immutable.
- Add/adjust selector output if derived state changes.
- Add unit tests and determinism test coverage where applicable.

2. Selector extension checklist

- Keep selector pure and deterministic.
- Accept only required state input.
- Return derived value without side effects.
- Add selector-focused tests for edge cases.

3. Determinism test checklist

- Build equivalent action sequences from same initial state.
- Execute flow at least twice with pinned dependencies where needed.
- Assert resulting states are deeply equivalent.

4. Migration checklist

- Increment version metadata intentionally.
- Add migration step from prior schema.
- Verify backward compatibility with representative persisted snapshots.
- Add migration-focused tests.

## Trigger Phrases This Guidance Covers

Apply these rules when responding to requests like:

- add feature
- add action
- add selector
- refactor handler
- write tests
- add integration test
- fix determinism
- add migration
- optimize bundle
- split screen

## Completion Checklist

Before considering a game-logic change complete, confirm:

- Architecture alignment: action handlers, selectors, and module boundaries are respected.
- Determinism and immutability are preserved in core logic.
- Tests reflect new behavior and edge cases.
- Validation commands pass.
- Migration safety is handled for persisted-state changes.
