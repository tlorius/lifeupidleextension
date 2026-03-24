# Refactor Phase 1 Progress

Date started: 2026-03-24
Status: In progress
Goal: Introduce a centralized action layer for state writes without changing behavior.

## Scope for initial slice

- Add a typed game action reducer.
- Add a dispatch API to GameContext.
- Migrate one screen to dispatch-based writes.
- Keep existing setState API for backward compatibility during transition.

## Completed in this slice

1. Added centralized action module:

- src/game/actions.ts
- Introduced GameAction union and reduceGameAction reducer.
- Includes actions for:
  - add gold/gems/energy
  - add gold+gems
  - add class skill points
  - add debug items
  - reset state

2. Extended context API:

- src/game/GameContext.tsx now exposes dispatch(action).
- dispatch applies reducer and saves resulting state.
- Existing setState remains available for progressive migration.

3. Migrated first UI screen:

- src/components/Main.tsx now uses dispatch actions instead of inline setState mutations.

4. Added tests:

- src/game/actions.test.ts
- Covers all new reducer branches in this first action set.

5. Validation:

- Test suite passing after changes.

## Completed in second slice

1. Expanded centralized action module:

- src/game/actions.ts
- Added actions for class-system mutations:
  - class switch
  - class node upgrade
  - class spell slot assignment

2. Migrated class/skill/spell modals to dispatch:

- src/components/ClassSelectModal.tsx
- src/components/SkillTreeModal.tsx
- src/components/SpellSelectModal.tsx

3. Expanded reducer tests:

- src/game/actions.test.ts
- Added coverage for class switch, node upgrade, and spell slot actions.

4. Validation:

- Test suite passing after second-slice migration.

## Completed in third slice

1. Selected inventory actions moved to reducer/dispatch path:

- src/game/actions.ts
- Added inventory actions for:
  - equip item (including accessory slot override)
  - upgrade item
  - sell single item
  - use potion
  - sell selected items in batch

- src/components/Inventory.tsx
- Batch sell now calls reducer action via helper layer.

- src/components/ItemDetail.tsx
- Equip/upgrade/sell/potion handlers now use centralized action path.

2. Thin action helper layer introduced:

- src/game/useGameActions.ts
- Provides concise UI-facing methods that wrap dispatch actions.
- Used by Main, class/skill/spell modals, inventory-related handlers, and fight combat handlers.

3. Combat action wrappers introduced without changing simulation internals:

- src/components/Fight.tsx now uses helper wrappers:
  - combatClickAttack
  - combatUseConsumable
  - combatCastSpell

4. Expanded tests:

- src/game/actions.test.ts
- Added inventory action tests for equip/upgrade/sell/sellSelected/usePotion.

5. Validation:

- Test suite and build passing after third-slice migration.

## Architectural decisions (Phase 1)

- Decision: incremental migration instead of big-bang rewrite.
- Reason: reduce regression risk while preserving momentum.

- Decision: keep both dispatch and setState temporarily.
- Reason: allows vertical-slice migration and avoids large immediate edits.

- Decision: start with Main screen (debug/resource actions).
- Reason: low risk, high clarity, fast feedback for action API design.

## Next planned slices

1. Migrate simple action-heavy components to dispatch:

- selected inventory actions

Completed from this list:

- selected inventory actions

Completed from this list:

- class switch
- skill node upgrade
- spell slot updates

2. Expand action taxonomy:

- combat actions
- garden actions (carefully, due complexity)

Progress update:

- Combat wrappers in UI are in place; combat reducer actions are still intentionally deferred to avoid mixing architecture migration with runtime event-pipeline changes.

3. Add reducer-focused tests as each action group is introduced.

4. Once coverage is sufficient, deprecate direct setState usage from UI components.

## Safety guardrails

- Preserve external behavior and save compatibility.
- Use tests as characterization before each migration step.
- Avoid mixing architectural migration with gameplay rebalance.
