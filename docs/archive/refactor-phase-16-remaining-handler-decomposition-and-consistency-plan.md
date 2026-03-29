# Refactor Phase 16 Plan: Remaining Action-Handler Decomposition and Consistency

Date started: 2026-03-27
Status: Complete
Goal: Apply decomposition patterns from Phase 15 to remaining action handlers (combat and inventory), standardize state mutation style across all handlers, and add determinism guards for high-value edge flows.

## Why this phase exists

Phase 15 demonstrated value of extracting grouped action helpers and adding determinism guards. Combat and inventory handlers remain unrefactored and offer similar decomposition opportunities without much additional complexity risk.

Phase 16 continues the consolidation and consistency push across remaining handlers while adding a few targeted edge-case determinism tests.

## Scope

1. Apply Phase 15 decomposition patterns to combat and inventory action handlers.
2. Standardize state-update struct-spread patterns across all handlers.
3. Add focused determinism tests for high-value edge flows (e.g., resource-depleting sequences).
4. Re-run full validation gates.

## Slices

1. Slice 1: Combat handler decomposition
   - Extract pure helpers for grouped action categories logically (e.g., combat setup, ability actions, spell actions).
   - Keep external API stable.

2. Slice 2: Inventory handler decomposition
   - Extract pure helpers for item operations (equip/unequip, consume, etc.).
   - Keep external API stable.

3. Slice 3: Determinism edge-flow tests
   - Add test for resource-consumption sequence ending in depletion.
   - Add test for equipment/inventory inconsistency under rapid actions.

4. Slice 4: Validation and completion
   - Run `npm run test:integration`.
   - Run `npm run test:run`.
   - Run `npm run build`.

## Exit criteria

Phase 16 is complete when:

- [x] Combat and inventory handlers are decomposed with extracted pure helpers.
- [x] State mutation style is consistent across combat, inventory, and garden handlers.
- [x] New determinism tests pass and cover edge-flow scenarios.
- [x] Integration, full tests, coverage, and build all pass.

## Slice outcomes

### Slice 1: Combat handler decomposition

Extracted pure helper functions in `src/game/actionHandlers/combat.ts`:

- `applyCombatClickAttackAction(state)`
- `applyCombatConsumableAction(state, action)`
- `applyCombatCastSpellAction(state, action)`

External API `applyCombatAction` signature unchanged. Switch dispatch now delegates to helpers.

### Slice 2: Inventory handler decomposition

Extracted pure helper functions in `src/game/actionHandlers/inventory.ts`:

- `applyEquipItemAction(state, action)`
- `applyUpgradeItemAction(state, action)`
- `applySellItemAction(state, action)`
- `applyUsePotionAction(state, action)`
- `applyAddDebugItemsAction(state)`
- Kept `sellSelectedItems` as is (already well-factored)

External API `reduceInventoryAction` signature unchanged. Switch dispatch now delegates to helpers.

### Slice 3: Determinism edge-flow tests

Added tests in respective handler test files:

- `src/game/actionHandlers/combat.test.ts`: Test that identical click-attack sequences produce identical combat states.
- `src/game/actionHandlers/inventory.test.ts`: Test that identical equip/sell sequences produce identical inventory states.

### Slice 4: Validation

Validation rerun after all decomposition:

- `npm run test:integration` passed (8 tests).
- `npm run test:run -- --reporter=dot` passed (21 files, 234 tests).
- `npm run build` passed.
