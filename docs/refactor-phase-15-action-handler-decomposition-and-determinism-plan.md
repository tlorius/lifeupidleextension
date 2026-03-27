# Refactor Phase 15 Plan: Action-Handler Decomposition and Deterministic State Updates

Date started: 2026-03-27
Status: In progress
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
   - Run `npm run test:coverage`.
   - Run `npm run build`.

## Exit criteria

Phase 15 is complete when:

- [ ] One high-complexity handler group is decomposed into smaller pure helpers.
- [ ] Update/mutation style in touched handler paths is consistent.
- [ ] New deterministic edge-flow tests pass and guard the refactor.
- [ ] Integration, full tests, coverage, and build all pass.
