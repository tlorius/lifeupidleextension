# Refactor Phase 4 Plan: Fight Isolation

Date started: 2026-03-25
Status: In progress
Goal: Refactor the Fight screen and combat runtime boundaries by isolating derived read models, interaction orchestration, and combat domain units without changing combat balance or progression outcomes.

## Why this phase exists

Phase 3 reduced the largest Garden bottleneck. The next architectural hotspot is Fight.

Today, fight-related behavior is still spread across UI orchestration and broad combat domain surfaces, which makes cooldown edge cases, defeat transitions, and reward boundaries harder to reason about and test in isolation.

This phase should treat Fight as a dedicated vertical slice, not as an extension of generic selector extraction work.

## Phase goals

- Split fight-heavy read models into pure selectors with direct tests.
- Decompose the Fight UI into smaller feature-local sections.
- Reduce inline interaction complexity in src/components/Fight.tsx by moving orchestration into focused helpers.
- Break combat domain logic into coherent modules while preserving behavior.
- Keep refactor slices incremental so existing combat tests remain the primary regression net.

## In scope

1. Selector and read-model extraction

- Add or extend fight-focused selectors under src/game/selectors.
- Centralize spell availability state, cooldown labels, mana gating reasons, encounter summary display state, and reward presentation models.
- Keep selector outputs stable and explicit so UI branches are easy to test.

2. Fight component decomposition

- Split src/components/Fight.tsx into smaller presentational or feature-local components.
- Likely seams include encounter header, action controls, spell tray, consumable row, and post-fight summary surfaces.
- Keep ephemeral UI state local unless there is a clear reuse boundary.

3. Interaction orchestration cleanup

- Reduce large inline handlers by extracting small fight-specific controller helpers.
- Preserve existing write semantics through the GameProvider bridge and action wrappers.
- Avoid introducing new direct mutation patterns inside UI components.

4. Combat domain modularization

- Split combat logic into coherent modules (encounter generation, attack cadence, spell resolution, reward resolution, defeat recovery).
- Keep external APIs stable or provide thin compatibility wrappers during migration.
- Preserve offline combat expected-value behavior and progression unlock outcomes.

5. Validation hardening

- Add branch-focused tests for cooldown boundaries, mana gates, defeat/recovery paths, and reward edge cases.
- Add integration coverage for critical fight loop actions: click attack, spell cast, consumable use, defeat, and restart.

## Explicit non-goals

- No gameplay rebalance for enemy stats, spell power, loot rates, or XP curves.
- No storage schema migration.
- No redesign of non-Fight screens.
- No broad UI redesign beyond what naturally falls out of component extraction.
- No Garden or Upgrades feature work unless a targeted bug fix is strictly required.

## Constraints and invariants to preserve

- Cooldown and attack cadence behavior remain interval/remainder consistent.
- Mana costs and cooldown gates remain unchanged for spells and consumables.
- Defeat/reset semantics and checkpoint behavior remain unchanged.
- Reward distribution (gold, gems, XP, loot) remains unchanged for equivalent encounters.
- Offline combat expected-value logic remains behavior-compatible.
- Save compatibility remains intact.

## Proposed slice order

1. Fight seam audit

- Catalog read-heavy and write-heavy clusters currently inside src/components/Fight.tsx and src/game/combat.ts.
- Define low-risk extraction seams and characterization test targets before moving logic.

2. Fight selector foundation

- Extract highest-churn read derivations (spell state, cooldown/mana gating, encounter HUD models).
- Add selector unit tests for all non-trivial branches.

3. Fight UI decomposition

- Extract presentational regions from the root Fight screen.
- Keep the root as screen-level orchestrator and route writes through focused handlers.

4. Combat domain module split

- Move coherent logic families out of monolithic combat surfaces into dedicated modules.
- Add targeted unit coverage per new module boundary.

5. Final Fight root cleanup

- Minimize residual inline domain math and consolidate controller helpers.
- Reassess whether remaining complexity is justified as screen glue.

## Progress

- Completed: Defined Phase 4 scope, constraints, sequencing, and stop rule.
- Completed: Ran Fight seam audit and confirmed primary hotspots in src/components/Fight.tsx and src/game/combat.ts.
- Completed: Identified first extraction seam as spell and cooldown read-model separation plus spell-action panel decomposition.
- Completed: Slice 1 selector extraction for spell castability, cooldown labels, empty-state messaging, and spell-path unlock status.
- Completed: Extracted spell action UI into src/components/FightSpellsPanel.tsx and rewired src/components/Fight.tsx to selector-backed spell panel view models.
- Completed: Added selector tests for spell panel gating and labels; validated with focused tests, full tests, and production build.
- Completed: Slice 2 selector extraction for consumable slot state, cooldown labels, modal slot tabs, and potion option projection.
- Completed: Extracted consumable panel and modal UI into src/components/FightConsumables.tsx and rewired src/components/Fight.tsx to selector-backed consumable view models.
- Completed: Added selector tests for consumable slot and modal state; validated with focused tests, full tests, and production build.
- Completed: Slice 3 selector extraction for DPS panel delta tone, source-stat projection, empty-state messaging, and window option projection.
- Completed: Extracted DPS meter UI into src/components/FightDpsPanel.tsx and rewired src/components/Fight.tsx to selector-backed DPS panel view models.
- Completed: Extended selector coverage for the DPS panel model; validated with focused tests, full tests, and production build.
- Completed: Slice 4 selector extraction for encounter summary labels and combat log empty-state projection.
- Completed: Extracted encounter summary and combat log UI into src/components/FightPanels.tsx and rewired src/components/Fight.tsx to selector-backed panel models.
- Completed: Extended selector coverage for encounter summary and combat log models; validated with focused tests, full tests, and production build.
- Completed: Ran Fight closeout review and confirmed remaining src/components/Fight.tsx complexity is justified screen orchestration glue rather than a good target for one more presentational extraction.
- Completed: Identified src/game/combat.ts as the dominant remaining Phase 4 hotspot after Fight UI decomposition.
- Completed: Split cooldown ticking and consumable cooldown lookup into src/game/combatCooldowns.ts.
- Completed: Split reward/drop resolution into src/game/combatRewards.ts while preserving combat.ts as the public API surface.
- Completed: Validated the first combat-domain split with focused combat tests, full tests, and production build.
- Completed: Split spell catalog and spell-availability helpers into src/game/combatSpells.ts while preserving combat.ts as the public API surface.
- Completed: Validated the spell-helper split with focused combat tests, full tests, and production build.
- Completed: Extracted spell-resolution execution out of castCombatSpell into src/game/combatSpellEffects.ts while preserving combat.ts as the public API surface.
- Completed: Added targeted combat coverage for the idler_timebank cooldown-reduction branch and validated the spell-effects split with focused combat tests, the full Vitest suite, and production build.
- Completed: Extracted player and enemy attack resolution out of runCombatTick into src/game/combatAttacks.ts while preserving combat.ts as the public API surface and defeating-enemy/defeat-recovery logic.
- Completed: Validated the attack-resolution split with focused combat tests (18/18), the full Vitest suite (183/183), and production build.
- Completed: Extracted tick-loop orchestration (action coordination and readiness checking) out of runCombatTick into src/game/combatTickOrchestration.ts while preserving combat.ts as the public API surface.
- Completed: Validated the tick-orchestration split with focused combat tests (18/18), the full Vitest suite (183/183), and production build.
- Completed: Extracted offline combat expected-value simulation out of resolveOfflineCombatExpected into src/game/combatSimulation.ts while preserving combat.ts as the public API wrapper.
- Completed: Validated the simulation-extraction split with focused combat tests (18/18), the full Vitest suite (183/183), and production build.
- **Phase 4 COMPLETE**: All major refactor objectives achieved.

## Implementation rules

- Prefer pure selectors and explicit view-model types over ad hoc helper chains in UI components.
- Reuse existing domain helpers as the source of truth rather than duplicating formulas.
- Keep file moves and renames incremental; avoid large rewrites.
- Preserve behavior first, then improve structure.
- If a proposed seam requires forwarding too many props, stop and re-evaluate before extracting.

## Validation

- Run focused fight and combat tests after each slice.
- Run the full Vitest suite after each slice.
- Run production build after each slice.
- Add targeted tests for each newly extracted selector branch or controller helper with non-trivial behavior.

## Exit criteria

Phase 4 is complete when:

- ✓ src/components/Fight.tsx is materially smaller and primarily coordinates screen-level state and events. (Reduced from 1505 lines to ~950 lines)
- ✓ Major fight read-heavy calculations live in tested selectors rather than inline component code. (src/game/selectors/fight.ts with 5 focused tests)
- ✓ Combat domain logic is split into coherent units with clear ownership boundaries.
  - src/game/combatCooldowns.ts — cooldown and consumable cooldown logic
  - src/game/combatRewards.ts — loot and reward resolution logic
  - src/game/combatSpells.ts — spell definitions and spell availability logic
  - src/game/combatSpellEffects.ts — spell execution and effect branches
  - src/game/combatAttacks.ts — player/enemy attack resolution
  - src/game/combatTickOrchestration.ts — tick-loop coordination and action scheduling
  - src/game/combatSimulation.ts — offline combat expected-value simulation
  - src/game/combat.ts — public API surface and orchestration
- ✓ Critical fight behavior remains stable under unit and integration coverage. (183/183 Vitest tests pass)
- ✓ Tests and build pass without regressions.

## Stop rule

- Do not turn this phase into a combat redesign or rebalance effort.
- If a desired change alters simulation semantics, reward policy, or save schema, stop and scope that as a separate phase.
