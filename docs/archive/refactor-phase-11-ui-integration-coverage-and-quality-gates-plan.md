# Refactor Phase 11 Plan: UI Integration Coverage and Quality Gates

Date started: 2026-03-26
Status: Complete
Goal: Add React UI integration coverage for critical player flows and define practical quality-gate commands aligned with the refactored architecture.

## Why this phase exists

After Phases 8-10, core domain logic and persistence pathways are hardened. The remaining architecture risk is integration drift between UI interactions and action-layer state updates.

Phase 11 closes that gap with end-to-end UI behavior checks and explicit test commands for repeatable validation.

## Scope

1. Add jsdom-based integration tests for key UI flows.
2. Keep existing node-based domain tests unchanged.
3. Add a dedicated command for UI integration tests.
4. Validate full suite and build after additions.

## Implemented slices

### Slice 1: Critical flow integration tests

Added `src/app.integration.test.tsx` with jsdom environment and React Testing Library coverage for:

- Screen navigation flow:
  - Main -> Inventory -> Main
- Idle earnings modal lifecycle:
  - modal appears for away-time saves
  - modal dismisses on collect

### Slice 2: Quality-gate command

Added `test:integration` script in `package.json`:

- `vitest --run src/app.integration.test.tsx`

This provides a fast, non-watch UI-focused gate without changing existing node test behavior.

The integration test file also installs a local `localStorage` mock per test to avoid cross-file test-environment leakage from node-based suites.

### Slice 3: Validation

Validation run:

- Focused UI integration tests passed: `npm run test:integration`.
- Full suite passed: `npm run test:run`.
- Build passed: `npm run build`.
- Existing warning unchanged: bundle chunk size > 500 kB.

## Exit criteria

Phase 11 is complete when:

- [x] At least one critical cross-component UI flow is covered with integration tests.
- [x] UI integration checks can run independently via explicit command.
- [x] Full repository test suite and build pass.
