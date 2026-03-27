# Refactor Phase 10 Plan: Persistence and Migration Hardening

Date started: 2026-03-26
Status: Complete
Goal: Replace broad merge-style save migration with explicit version-step migrations, strengthen schema normalization guards, and add migration matrix coverage.

## Why this phase exists

Current persistence behavior in `src/game/storage.ts` is functional but risk-prone for future schema evolution:

- Migration is largely recursive merge with defaults rather than explicit version-to-version steps.
- Version stamping is centralized but migration intent/history is implicit.
- Regression coverage exists for partial saves but not a versioned migration matrix.

Phase 9 reduced domain module complexity, so persistence hardening can now become the next architecture safety layer.

## Scope

1. Introduce explicit migration pipeline
   - Add versioned migration step functions (e.g. `0->1`, `1->2`, `2->3`).
   - Keep current save compatibility and behavior intact.

2. Add schema normalization guards
   - Centralize known compatibility rewrites (for example `cereal` -> `grains`).
   - Ensure required runtime invariants after migration (meta timestamps, character shape).

3. Expand migration testing
   - Add matrix-style tests for representative legacy payloads.
   - Validate no-op behavior for current-version saves.

4. Keep non-goals explicit
   - No save-key changes.
   - No gameplay rebalance.
   - No breaking state shape redesign beyond migration safety.

## Slices

1. Slice 1: Migration framework extraction
   - Create dedicated migration module for storage.
   - Move merge/default bootstrap + compatibility rewrites into module with explicit pipeline.

2. Slice 2: Version-step definitions and wiring
   - Add explicit migration step map for historical versions up to current `meta.version`.
   - Wire storage load path through step runner.

3. Slice 3: Migration matrix tests
   - Add tests for versioned legacy payloads and malformed metadata.
   - Verify output invariants and compatibility rewrites.

4. Slice 4: Final validation and handoff
   - Run focused tests, full suite, build.
   - Document completion and Phase 11 handoff notes.

## Exit criteria

Phase 10 is complete when:

- [x] Storage migration runs through explicit version steps.
- [x] Compatibility rewrites and post-migration normalization are centralized.
- [x] Migration matrix tests cover representative legacy versions and invalid metadata.
- [x] Full tests and build pass.

## Slice outcomes

### Slice 1-2: Migration framework extraction and version-step wiring

Implemented:

- Added dedicated migration module: `src/game/storageMigrations.ts`.
- Introduced explicit migration step runner with centralized step map:
  - `0 -> 1` no-op compatibility placeholder
  - `1 -> 2` no-op compatibility placeholder
  - `2 -> 3` crop storage category normalization (`cereal` -> `grains`)
- Centralized compatibility rewrites and post-migration normalization:
  - crop storage key normalization
  - invalid timestamp fallback (`meta.lastUpdate`)
  - character state shape normalization (`ensureCharacterStateShape`)
- Wired `src/game/storage.ts` to migration module and added safe JSON parse handling with error logging.

### Slice 3: Migration matrix tests

Expanded `src/game/storage.test.ts` with matrix-style coverage for:

- malformed JSON handling (load returns null and logs)
- legacy v0 payload migration with `cereal` storage keys
- v1 payload preserving explicit `grains` values
- unexpected future-version payload normalization to current schema version

### Slice 4: Final validation and handoff

Validation run:

- Focused migration tests passed: `npm run test:run -- src/game/storage.test.ts`.
- Full suite passed: `npm run test:run` (20 files, 223 tests).
- Build passed: `npm run build`.
- Existing warning unchanged: bundle chunk size > 500 kB.

## Notes for next phase

- Phase 11 can focus on UI integration coverage and stronger quality gates using the now-explicit persistence migration boundary.
