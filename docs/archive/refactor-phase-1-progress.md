# Refactor Phase 1 Progress

Date started: 2026-03-24
Status: Complete
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

## Completed in fourth slice

1. Remaining simple non-Garden game-state writes migrated:

- src/components/Equipment.tsx
- Free respec now uses centralized action path.

- src/components/Upgrades.tsx
- Upgrade purchases now use centralized action path.

2. Non-combat action groups expanded:

- src/game/actions.ts
- Added:
  - class/freeRespec
  - upgrade/buy

- src/game/useGameActions.ts
- Added helper methods for:
  - freeRespecClass
  - buyUpgrade

3. Expanded tests:

- src/game/actions.test.ts
- Added reducer coverage for:
  - class free respec
  - upgrade purchase

4. Validation:

- Test suite and build passing after fourth-slice migration.

## Architectural decisions (Phase 1)

- Decision: incremental migration instead of big-bang rewrite.
- Reason: reduce regression risk while preserving momentum.

- Decision: keep both dispatch and setState temporarily.
- Reason: allows vertical-slice migration and avoids large immediate edits.

- Decision: start with Main screen (debug/resource actions).
- Reason: low risk, high clarity, fast feedback for action API design.

## Phase 1 Completion Boundary

Phase 1 is considered complete when all of the following are true:

- Simple non-Garden gameplay state writes are routed through centralized actions.
- UI-facing helper methods exist for the migrated action groups.
- Existing combat runtime internals remain behaviorally unchanged, with only wrapper-level integration allowed.
- Tests cover each newly introduced reducer branch for migrated action groups.
- Build and full test suite pass after each migration slice.

Phase 1 explicitly includes:

- Resource/debug actions
- Class selection, class respec, class node upgrades, and spell slot assignment
- Inventory item actions and batch selling
- Upgrade purchases
- Thin helper layer for UI-to-action calls
- Wrapper-level combat interaction integration that does not alter combat simulation internals

Phase 1 explicitly excludes:

- Large-scale Garden action migration
- Combat simulation reducerization or event pipeline redesign
- Selector extraction
- Save migration redesign
- Visual/UI redesign work
- Balance changes
- Multi-file domain decomposition of garden, combat, engine, or upgrades

Garden boundary for Phase 1:

- Garden is not required for Phase 1 completion.
- Any Garden work before Phase 2 must be a separately declared vertical slice with its own scope and validation plan.
- Do not treat ad hoc Garden cleanup as Phase 1 continuation.

Operational stop rule:

- Once the non-Garden simple state writes and helper-backed action paths are complete, stop Phase 1 and reassess before touching Garden internals.

## Completion Summary

Phase 1 is complete against the boundary defined above.

Completed scope:

- Resource/debug actions
- Class selection, respec, node upgrades, and spell slot assignment
- Inventory item actions and batch selling
- Upgrade purchases
- Thin helper layer for UI-facing action calls
- Wrapper-level combat interaction integration without runtime combat redesign

Intentionally deferred to later phases:

- Garden migration
- Combat runtime reducerization
- Selector extraction
- Save/persistence redesign
- Large domain decomposition work

Phase 2 handoff:

- Start selector extraction with read-heavy screens.
- First targets: Fight, ResourcesDisplay, Inventory, and Upgrades.
- Keep selectors pure and behavior-preserving.
- Continue avoiding Garden scope expansion unless it is declared as its own slice.

## Safety guardrails

- Preserve external behavior and save compatibility.
- Use tests as characterization before each migration step.
- Avoid mixing architectural migration with gameplay rebalance.
