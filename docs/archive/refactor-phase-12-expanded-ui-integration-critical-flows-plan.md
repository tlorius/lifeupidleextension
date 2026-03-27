# Refactor Phase 12 Plan: Expanded UI Integration for Critical Player Flows

Date started: 2026-03-26
Status: Complete
Goal: Expand app-level integration coverage for high-risk player-facing flows across class management, spell management entrypoints, and inventory sell-safety behavior.

## Why this phase exists

Phase 11 established the first integration layer and quality-gate command. Remaining architecture risk is still concentrated in cross-component UX pathways where state updates and modal orchestration interact.

This phase hardens the next highest-value UI flows identified in the audit roadmap.

## Scope

1. Add integration coverage for Character class-management modal flow.
2. Add integration coverage for Fight spell-management modal entry flow.
3. Add integration coverage for Inventory equip + mass-sell safety behavior.
4. Re-run integration gate, full suite, and build.

## Slices

1. Slice 1: Character flow integration tests
   - Navigate to Character screen with class system unlocked.
   - Verify class-select modal lifecycle (open/close).
   - Verify skill-tree modal lifecycle (open/close) after class selection.

2. Slice 2: Fight spell-management flow integration test
   - With active class, navigate to Fight screen.
   - Verify Manage Spells opens Spell Selection modal.

3. Slice 3: Inventory sell-safety flow integration test
   - Add debug items through Main.
   - Equip a gear item.
   - Enter mass-select mode and verify equipped item is protected from mass sell selection.

4. Slice 4: Validation and completion notes
   - Run `npm run test:integration`.
   - Run `npm run test:run`.
   - Run `npm run build`.

## Exit criteria

Phase 12 is complete when:

- [x] Character class/skill modal lifecycle is covered by integration tests.
- [x] Fight spell-management modal entry is covered by integration tests.
- [x] Inventory equipped-item mass-sell protection is covered by integration tests.
- [x] Integration gate, full suite, and build pass.

## Slice outcomes

### Slice 1: Character flow integration tests

Added coverage in `src/app.integration.test.tsx` for:

- navigating to Character with class system unlocked
- opening and closing class selection modal
- selecting a class
- opening and closing skill tree modal

### Slice 2: Fight spell-management flow integration test

Added coverage in `src/app.integration.test.tsx` for:

- navigating to Fight with spell system unlocked and an active class
- opening the Spell Selection modal from the fight spell panel

### Slice 3: Inventory sell-safety flow integration test

Added coverage in `src/app.integration.test.tsx` for:

- adding debug items through Main
- equipping an item via Inventory item detail
- entering mass-select mode and asserting equipped-item protection (disabled sell checkbox + protection message)

### Slice 4: Validation and completion notes

Validation run:

- Integration gate passed: `npm run test:integration` (4 tests).
- Full suite passed: `npm run test:run` (21 files, 227 tests).
- Build passed: `npm run build`.
- Existing warning unchanged: bundle chunk size > 500 kB.
