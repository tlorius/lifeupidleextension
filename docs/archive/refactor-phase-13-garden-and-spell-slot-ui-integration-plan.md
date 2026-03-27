# Refactor Phase 13 Plan: Garden and Spell-Slot UI Integration Coverage

Date started: 2026-03-26
Status: Complete
Goal: Extend UI integration coverage for remaining critical player-facing interactions in Garden management and spell-slot assignment flow.

## Why this phase exists

After Phase 12, key class and inventory safety paths are covered, but two important interaction clusters remain high-risk for regressions:

- Garden modal workflows (toolbar + tile detail mode transitions)
- Spell assignment behavior from fight-adjacent management UI

This phase closes those gaps with deterministic app-level tests.

## Scope

1. Add integration coverage for Garden toolbar + field-option modal flow.
2. Add integration coverage for assigning a spell in Spell Selection and verifying fight-panel availability.
3. Re-run integration gate, full suite, and build.

## Slices

1. Slice 1: Garden interaction flow
   - Navigate to Garden.
   - Open and close Crop Silos modal.
   - Open empty-field options, switch to Automation mode, and back.

2. Slice 2: Spell-slot assignment flow
   - Unlock class/spell systems in seeded state.
   - Select a class.
   - Open Spell Selection from Fight, assign a spell, close modal.
   - Verify assigned spell appears in fight spell actions.

3. Slice 3: Validation and completion
   - Run `npm run test:integration`.
   - Run `npm run test:run`.
   - Run `npm run build`.

## Exit criteria

Phase 13 is complete when:

- [x] Garden toolbar and empty-field modal flow is covered by integration tests.
- [x] Spell selection assignment to fight panel is covered by integration tests.
- [x] Integration gate, full suite, and build pass.

## Slice outcomes

### Slice 1: Garden interaction flow

Added integration coverage in `src/app.integration.test.tsx` for:

- navigating to Garden screen
- opening and closing Crop Silos modal from toolbar
- opening empty-field options and switching between Field Options and Automation modes

### Slice 2: Spell-slot assignment flow

Added integration coverage in `src/app.integration.test.tsx` for:

- selecting a class
- opening Spell Selection from Fight
- assigning `Arcane Bolt` to a slot
- closing Spell Selection and verifying the spell appears in fight spell actions

### Slice 3: Validation and completion

Validation run:

- Integration gate passed: `npm run test:integration` (6 tests).
- Full suite passed: `npm run test:run` (21 files, 229 tests).
- Build passed: `npm run build`.
- Existing warning unchanged: bundle chunk size > 500 kB.

Additional hardening done:

- Fixed Garden grid render key warning by adding keyed fragments in `src/components/GardenGrid.tsx`.
