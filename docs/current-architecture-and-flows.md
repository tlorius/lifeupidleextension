# Current Architecture, Use Cases, and Runtime Flows

Date: 2026-03-24 (Updated 2026-03-27)
Purpose: persistent source of truth for current game behavior and architecture.

**Note:** This document reflects the architecture **after** 18 coordinated refactoring phases (completed 2026-03-27). For context on how this architecture was built, see [REFACTOR-HISTORY.md](REFACTOR-HISTORY.md). For detailed historical information on specific architectural decisions, see `archive/refactor-phase-*.md`.

## 1. System Overview

Application type:

- Single-page React + TypeScript game app (Vite).

Core runtime model:

- A central GameProvider owns GameState.
- UI screens consume state through useGame.
- A 1-second interval advances idle, garden, and combat simulations.
- State is persisted to localStorage on tick and before page unload.

Top-level navigation screens:

- Main
- Inventory
- Character
- Upgrades
- Garden
- Fight

Global overlays:

- Idle earnings modal
- Token reward modal

## 2. Entry and Composition

Startup chain:

1. main.tsx mounts StrictMode.
2. GameProvider wraps App.
3. App renders tabbed screen navigation and global overlays.

Context responsibilities:

- Initialize state from storage with migration fallback.
- Apply offline gains on load (idle, garden, offline combat expected-value).
- Run recurring tick loop.
- Expose mutators for combat click, spell cast, and consumable use.
- Handle token-based reward links and processed-token deduping.

## 3. Domain Model Summary

Primary state object:

- GameState

Key subdomains:

- meta: versioning and last update timestamp.
- resources: gold, gems, energy.
- stats: combat and economy stats.
- playerProgress: level, xp, unlock flags.
- combat: runtime encounter state and cooldown maps.
- inventory/equipment: item ownership and equipped slots.
- character: class system state (active class, points, nodes, spell slots, idler check-in).
- upgrades: purchased upgrade levels and tree progression.
- garden: fields, crops, automation tools, storage, unlocks, rocks.

## 4. Module Map

### UI layer (src/components)

- App shell and tab navigation.
- Feature screens for each major system.
- Modals for class selection, skill tree, spell selection, idle rewards, token rewards.

### Runtime/context layer (src/game/GameContext.tsx)

- Initialization and rehydration.
- Global ticking and persistence.
- Combat action bridge.
- Reward token workflow.

### Simulation and rules (src/game)

- engine.ts: stats aggregation, idle economy, item ops, potion effects.
- combat.ts: enemy generation, DPS cadence, rewards, spells, expected offline combat.
- garden.ts: crop lifecycle, automation, field unlocking, sprinklers/harvesters/planters, seedmaker, rocks.
- progression.ts: XP curve and level-based gains/unlocks.
- upgrades.ts: tree definitions and purchase/unlock rules.
- classes/\*: class data, class state transitions, node upgrades, spell slots, daily check-in.
- storage.ts: persistence and migration.
- tokenRewards.ts: token extraction, mock reward resolution, apply rewards.

## 5. Player Use Cases and Flows

## 5.1 Boot and Resume Flow

1. Game loads saved state from localStorage.
2. State is migrated against default schema.
3. Class state shape is normalized.
4. Idler daily check-in reward may be applied if active class is idler.
5. Offline progression is applied:
   - idle gold and mana regen
   - garden idle automation/decay
   - offline combat expected-value simulation
6. Idle summary modal appears if earnings/progress occurred.

## 5.2 Main Screen (debug/resource utility actions)

Primary actions:

- Grant resource increments (gold, gems, mana).
- Grant skill points.
- Add debug items.
- Reset game state.

Current role:

- Works as quick utility/debug entrypoint.

## 5.3 Inventory Flow

Capabilities:

- Filter by item type.
- View item details.
- Equip, upgrade, sell.
- Mass-select selling with protection for equipped items.
- Seed grouping behavior in display list.

Dependencies:

- engine item operations.
- item definition lookup.
- item set metadata.

## 5.4 Character (formerly equipment) Flow

Capabilities:

- Show equipped slots and selected item detail.
- Display current class and available class points.
- Open class switch modal.
- Open skill tree modal.
- Respec active class for free.

Class switch rules:

- Class system unlocks at level 10.
- First selected class is effectively free (no active class yet).
- Switching when already classed spends gems.

## 5.5 Skill Tree Flow

Capabilities:

- Show active-class nodes and ranks.
- Expand node details and prerequisites.
- Upgrade node if prerequisites and points allow.

Behavior:

- Node upgrades consume available class skill points.
- Passive effects are always active for active class.

## 5.6 Spell Selection Flow

Capabilities:

- Show unlocked slots based on player level.
- Assign/clear spells per slot for active class.
- Merge general spells and class spells gated by level.

Behavior:

- Spell slot assignments are stored per class.
- Duplicate spell assignment across slots is visually allowed but indicated.

## 5.7 Fight Flow

Runtime loop:

- Combat simulation advances on provider tick.
- Player auto-attacks and enemy attacks operate on remainder-based intervals.

Manual interactions:

- Click attack.
- Cast spell (mana + cooldown gate).
- Use consumable (inventory + cooldown gate).
- Open spell selection from fight screen.

Outcomes:

- Enemy defeat grants gold, gems, XP, and loot (boss weighted tables).
- Player defeat resets encounter to last boss checkpoint.
- Level-up events and system unlock events are emitted.

Offline fight behavior:

- Expected-value simulation estimates progression during downtime.

## 5.8 Upgrades Flow

Capabilities:

- Tree list and per-tree detail.
- Normal list mode and tree graph mode.
- Buy upgrades based on gold, prerequisites, and linked unlock levels.

Behavior:

- Upgrades are defined data-first in a large registry.
- Unlocking can depend on both prerequisite ownership and parent level thresholds.

## 5.9 Garden Flow

Capabilities:

- Planting/harvesting crops.
- Watering and water decay.
- Sprinkler, harvester, planter, seedmaker automation.
- Rock break and field unlock progression.
- Crop mastery and prestige loops.
- Tool-driven area move behavior.

Important rules:

- Automation tool occupancy is mutually exclusive per tile.
- Harvester and planter run on interval cycles with remainder carry-over.
- Seedmaker runs while enabled and checks recipe cost constraints.
- Special-category harvest can trigger farmer-special drops with rarity tiers.

## 5.10 Token Reward Flow

1. Token is extracted from URL query.
2. Already-processed tokens are ignored.
3. Rewards are resolved (currently mock resolver).
4. Valid rewards are normalized and applied to inventory.
5. Token reward modal lists granted items.
6. Token is removed from URL and saved as processed.

## 6. Data and Rule Invariants

Observed invariants:

- Combat level is at least 1.
- Player HP is clamped to at least 1 max and non-negative current.
- Mana is treated as capped resource for combat actions.
- Class node upgrade requires prerequisites and available points.
- Upgrade purchase requires unlock checks and sufficient gold.
- Garden unlock requires adjacency and resource/rock constraints.
- Automation placement enforces one automation type per tile.

## 7. Persistence and Migration

Storage key:

- idle_save

Save behavior:

- Updates lastUpdate timestamp and writes full GameState JSON.

Load behavior:

- Parses JSON and merges with latest default schema recursively.
- Applies category key migration for cereal -> grains.
- Forces meta.version to current default version.
- Normalizes character/class shape.

## 8. Testing and Coverage Posture

Current tests:

- Game domain tests exist for major systems.
- Garden has both unit and integration test suites.

Coverage baseline from existing report:

- Statements: 81.28%
- Functions: 79.31%
- Branches: 63.70%

Coverage scope limitation:

- Coverage config includes src/game only.
- UI/component behavior is not currently part of coverage targets.

## 9. Current Architectural Constraints

1. A few files are very large and multi-responsibility.
2. UI and domain mutation responsibilities are mixed.
3. Mutation style is mixed (immutable and in-place mutation patterns).
4. Time and randomness are partly hardwired, reducing deterministic testability.
5. README is still template-level and does not describe game architecture.

## 10. Refactor Readiness Notes

This document is intended as the behavioral baseline for upcoming refactors.

Refactor safety approach:

- Preserve behavior first.
- Add characterization tests for high-risk flows.
- Move code in thin slices (one flow/module at a time).
- Keep this document synchronized with behavior changes in future requests.
