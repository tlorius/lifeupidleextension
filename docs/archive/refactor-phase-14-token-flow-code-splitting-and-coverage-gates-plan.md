# Refactor Phase 14 Plan: Token Flow, Code Splitting, and Coverage Gates

Date started: 2026-03-26
Status: Complete
Goal: Reduce app bundle risk with tab-level code splitting, expand critical UI integration coverage for token and spell-system edges, and enforce baseline coverage thresholds for CI.

## Why this phase exists

After Phase 13, integration coverage is broader, but the next practical quality gaps are:

- persistent bundle-size warning from single large client chunk
- missing app-level token reward URL flow coverage
- no enforced coverage threshold gate in test config

Phase 14 addresses these with minimal behavior change and explicit validation gates.

## Scope

1. Add tab-level lazy loading in app shell to improve chunking.
2. Add integration tests for reward-token URL processing and spell-system locked behavior.
3. Add enforceable coverage thresholds and CI-oriented test script.
4. Re-run integration, full tests, coverage, and build.

## Slices

1. Slice 1: App-shell code splitting
   - Convert non-main screen imports in App to `React.lazy` + `Suspense`.

2. Slice 2: Integration edge coverage
   - Add token reward modal lifecycle + URL cleanup test.
   - Add fight spell-management hidden-state test when spell system is locked.

3. Slice 3: Quality gates
   - Set baseline coverage thresholds in Vitest config.
   - Add a `test:ci` script to run non-watch tests + coverage.

4. Slice 4: Validation and completion
   - Run `npm run test:integration`.
   - Run `npm run test:run`.
   - Run `npm run test:coverage`.
   - Run `npm run build`.

## Exit criteria

Phase 14 is complete when:

- [x] App tab loading is chunked through lazy imports.
- [x] Token reward URL flow is covered by integration tests.
- [x] Spell-system locked edge is covered by integration tests.
- [x] Coverage thresholds are enforced by config.
- [x] Integration, full tests, coverage, and build all pass.

## Final validation

Validation rerun (one command at a time):

- `npm run test:integration` passed (8 tests).
- `npm run test:run` passed (21 files, 231 tests).
- `npm run test:coverage -- --run --reporter=dot` passed.
- `npm run build` passed.

Additional hardening:

- Updated `test:coverage` in `package.json` to `vitest --coverage --run` so coverage checks do not enter watch mode during local phase validation.
