---
name: refactor-testing
description: "Use when: write tests, add integration test, add determinism test, validate refactor safety, improve coverage, add migration test in Life Up Idle."
---

# Refactor Testing Skill (Life Up Idle)

Use this skill for test-only implementation aligned with the refactored architecture.

## Scope

This skill applies to:

- domain unit tests
- determinism regression tests
- UI integration flow tests
- migration/version compatibility tests
- coverage-driven test hardening

## Testing Rules

1. Determinism is required for nontrivial simulation/action flows

- Run equivalent flows from equivalent initial state.
- Pin time/random dependencies where behavior depends on clock/rng.
- Assert deep equality of resulting state.

2. Keep tests at the right layer

- Unit tests for pure domain logic/selectors.
- Integration tests for user flows across UI + state boundaries.
- Migration tests for persisted schema/version transitions.

3. Prefer stable assertions

- Use toBeCloseTo for floating-point multiplier/percentage math.
- Use toEqual for object/state comparisons.
- Avoid brittle assertions tied to non-deterministic ordering unless ordering is part of behavior.

4. Avoid watch-mode in automated validation

- Use npm run test:run for non-interactive checks.

## Determinism Test Template

1. Build two equivalent initial states.
2. Execute the same action sequence against both states.
3. Inject deterministic now/rng dependencies where applicable.
4. Assert final states are deeply equal.

## Integration Flow Template

1. Render full app boundary.
2. Execute user flow in sequence (clicks/inputs/navigation).
3. Assert state-relevant UI outcomes.
4. Verify no unstable-key or structural warnings are introduced.

## Migration Test Template

1. Construct representative legacy persisted snapshot.
2. Load through migration path.
3. Assert migrated shape/version and key invariants.
4. Assert no data-loss in expected persisted domains.

## Suggested Targets by Domain

- Garden: src/game/garden.test.ts and src/app.integration.test.tsx
- Combat: src/game/combat.test.ts and src/app.integration.test.tsx
- Upgrades/Progression: src/game/upgrades.test.ts and src/game/progression.test.ts
- Storage/Migrations: src/game/storage.test.ts

## Validation Sequence

Run before completion:

- npm run test:integration
- npm run test:run
- npm run test:coverage
- npm run build

## References

- docs/REFACTOR-HISTORY.md
- docs/archive/refactor-phase-8-runtime-determinism-and-hardening-plan.md
- docs/archive/refactor-phase-10-persistence-and-migration-hardening-plan.md
- docs/archive/refactor-phase-14-token-flow-code-splitting-and-coverage-gates-plan.md
