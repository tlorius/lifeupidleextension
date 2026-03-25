# Refactor Phase 8 Plan: Runtime Determinism and Boundary Hardening

Date started: 2026-03-25
Status: Planned
Goal: Tighten deterministic runtime seams, remove generic mutation escape hatches, and establish the next multi-phase architecture roadmap after Phase 7 completion.

## Why this phase exists

Phases 1 through 7 completed the major architecture inversion:

- Reads are selector-driven for major surfaces.
- Writes are action-driven for critical player-facing flows.
- `GameContext` now exposes `dispatch` rather than public `setState` mutation.

The next architectural risk is no longer "where mutations happen"; it is "how predictable and evolvable core runtime behavior is":

- Time and randomness are still partly hardwired in core paths.
- A generic state replacement action currently exists as a compatibility seam.
- Large domain files (`garden.ts`, `engine.ts`, `items.ts`) still carry multi-responsibility load.
- Migration/version policy and UI integration safety nets are still lighter than ideal.

Phase 8 should focus on deterministic seams and strict mutation boundaries before the next large decomposition waves.

## Roadmap audit: completed vs remaining

## Completed phases

- Phase 1: action-layer foundation and first dispatch migrations.
- Phase 2: selector extraction for initial read-heavy screens.
- Phase 3: garden UI and selector decomposition.
- Phase 4: fight isolation and combat domain modularization.
- Phase 5: upgrades isolation and prerequisite/stat module extraction.
- Phase 6: selector hardening and performance guardrails.
- Phase 7: action-layer completion and provider thinning.

## Remaining architecture phases (proposed)

1. Phase 8: runtime determinism and boundary hardening.
   - Remove generic escape hatches and tighten domain-intent actions.
   - Introduce/normalize `now` and `rng` seams in core runtime paths.
   - Add targeted deterministic tests for newly injected seams.

2. Phase 9: core domain decomposition and module-size reduction.
   - Split `garden.ts`, `engine.ts`, and `items.ts` into bounded modules.
   - Keep public APIs stable with thin facades while moving internals.
   - Increase branch coverage where extracted logic has high fan-out.

3. Phase 10: persistence and migration hardening.
   - Move from broad merge-style migration to explicit version-step migrations.
   - Add migration matrix tests across representative saved versions.
   - Add invariant checks for schema normalization and backward compatibility.

4. Phase 11: UI integration coverage and quality gates.
   - Add React Testing Library flows for critical screens.
   - Raise coverage and regression gates (especially branch coverage).
   - Enforce CI checks aligned with the new architecture boundaries.

## Current hotspots informing this roadmap

Current size hotspots (lines):

- `src/game/garden.ts` ~1832
- `src/components/Garden.tsx` ~1692
- `src/components/GardenTileDetailModal.tsx` ~1122
- `src/game/items.ts` ~1092
- `src/game/engine.ts` ~924
- `src/game/upgrades.ts` ~921
- `src/components/Fight.tsx` ~947
- `src/game/combat.ts` ~804

Current deterministic seam gaps:

- Direct `Date.now()` usage remains across `engine.ts`, `garden.ts`, `state.ts`, `storage.ts`, class state, progression, and provider init/tick flow.
- Direct/random default behavior remains in some runtime paths (for example garden drops, item rolls, combat wrappers), though combat already exposes optional `rng` seams in key paths.
- `garden/replaceState` currently exists as a broad compatibility action and should be narrowed over time.

## Phase 8 goals

- Make runtime-critical rules deterministic by default in tests and controllable at integration seams.
- Reduce mutation-boundary looseness by replacing broad state replacement with explicit domain intents where feasible.
- Preserve gameplay behavior and save compatibility while tightening architecture.

## Phase 8 in scope

1. Deterministic seam normalization
   - Introduce a lightweight runtime context shape (`now`, `rng`) for targeted high-risk paths.
   - Thread explicit time/rng parameters through selected `engine` and `garden` write helpers where practical.
   - Keep default production behavior unchanged (fallback to real clock/random).

2. Boundary strictness pass
   - Audit and reduce generic state replacement paths (starting with garden tile-detail interaction flow).
   - Replace broad mutation shortcuts with explicit actions where action semantics are clear.

3. Determinism-focused tests
   - Add direct tests that pin clock/random-dependent outcomes.
   - Add regression tests for any action-path narrowed from generic replacement.

4. Documentation and guardrails
   - Document accepted provider-orchestration responsibilities vs action-handler mutation responsibilities.
   - Add implementation rules for new runtime code to avoid reintroducing hardwired time/random calls in domain logic.

## Explicit non-goals

- No gameplay rebalance.
- No full garden or engine rewrite in this phase.
- No storage schema redesign (defer to Phase 10).
- No broad UI redesign.

## Constraints and invariants to preserve

- Save compatibility and existing state normalization behavior.
- Combat, garden, and progression outcomes remain behavior-compatible.
- Provider remains orchestration-first for initialization and periodic tick scheduling.
- Action handlers remain the only place for migrated domain state transitions.

## Proposed Phase 8 slices

1. Slice 1: Determinism seam audit and target selection
   - Map highest-value `Date.now` and random call sites by gameplay impact.
   - Select a narrow first batch (for example: garden timing and one engine random path).

2. Slice 2: Runtime context introduction (minimal surface)
   - Add shared runtime context type and pass-through defaults.
   - Migrate first target call paths with no behavior change.

3. Slice 3: Garden boundary tightening
   - Replace `garden/replaceState` call sites with explicit garden actions for tile-detail interactions where practical.
   - Keep modal UI behavior unchanged.

4. Slice 4: Determinism and regression tests
   - Add focused tests for migrated deterministic paths and narrowed actions.
   - Run full suite and production build.

5. Slice 5: Final pass and roadmap handoff
   - Summarize remaining decomposition targets for Phase 9.
   - Confirm Phase 8 exit criteria.

## Validation

- Focused tests per migrated deterministic seam.
- Full Vitest suite after each slice.
- Production build after each slice.
- No behavior regressions in combat/garden/progression characterization tests.

## Exit criteria

Phase 8 is complete when:

- [ ] A first meaningful set of clock/random-dependent runtime paths uses explicit deterministic seams.
- [ ] The primary generic garden replacement path is narrowed or materially reduced.
- [ ] New deterministic and regression tests cover migrated seams.
- [ ] Full tests and build pass without regressions.
- [ ] A clear, evidence-backed handoff to Phase 9 decomposition is documented.

## Stop rule

- Do not expand Phase 8 into a full core-domain rewrite.
- If a change requires broad schema redesign or progression/balance changes, defer to dedicated later phases.
