# Runtime Configuration Guide

This guide explains where game settings live, which modules consume them, and how to change them safely at runtime.

Agent policy:

- Any new feature implemented by an agent that adds or changes runtime-configurable behavior must include an update to this document in the same change set.

## 1. Configuration Architecture

Runtime config is implemented as a layered cascade:

1. Hardcoded defaults in `src/game/configLoader.ts`
2. JSON files in `public/config/*.config.json`
3. Environment overrides via `VITE_GAME_CONFIG_*`

Validation and typing are enforced by Zod schemas in `src/game/configSchema.ts`.

Access pattern:

- `src/game/configLoader.ts`: load/validate/cache config
- `src/game/config.ts`: typed getters (`getCombatConfig`, `getProgressionConfig`, ...)
- Domain modules (for example `src/game/combatConfig.ts`) read config through those getters

## 2. Where Each Setting Is Configured

## 2.1 Combat

- Authoritative runtime file: `public/config/combat.config.json`
- Schema: `CombatConfigSchema` in `src/game/configSchema.ts`
- Hardcoded fallback defaults: `HARDCODED_DEFAULTS.combat` in `src/game/configLoader.ts`
- Main consumers:
  - `src/game/combatConfig.ts`
  - `src/game/combatRewards.ts`
  - `src/game/combat.ts`

Important combat sub-sections:

- `player`: APS base/scaling, caps, offline/death behavior inputs
- `progression`: boss cadence and major spike cadence
- `damageFormula`, `crit`, `click`: damage behavior tuning
- `loot.fightModes`:
  - `dropRateMultiplier` and `levelBrackets` (all drop-rate scaling)
  - `chaseDropChanceMultiplier` (mode-specific chase chance)
  - `rubyDropChanceMultiplier` (mode-specific ruby chance)
- `loot.chaseDrop`, `loot.rubyDrop`, `loot.bossEquipmentLevels`: global combat reward controls

## 2.2 Progression

- Authoritative runtime file: `public/config/progression.config.json`
- Schema: `ProgressionConfigSchema` in `src/game/configSchema.ts`
- Fallback defaults: `HARDCODED_DEFAULTS.progression` in `src/game/configLoader.ts`
- Main consumers:
  - `src/game/progressionConfig.ts`
  - `src/game/progression.ts`

Important progression sections:

- `startingStats`
- `levelCaps`
- `xpFormula`
- `unlocks`
- `levelUpGains`

## 2.3 Garden and Upgrades

These domains have schema and JSON files:

- `public/config/garden.config.json`
- `public/config/upgrades.config.json`

And they are defined in:

- `GardenConfigSchema` and `UpgradeConfigSchema` in `src/game/configSchema.ts`
- `HARDCODED_DEFAULTS.garden` and `.upgrades` in `src/game/configLoader.ts`

Current status:

- These domains are prepared in the config system, but there are currently no active gameplay consumers reading `getGardenConfig()` or `getUpgradeConfig()` in domain logic.

## 3. Runtime Reload Workflow

Reload trigger path:

1. UI button in `src/components/Main.tsx` (`Reload Game Config`)
2. Calls `reloadConfig()` from `useGame()` (provided by `src/game/GameContext.tsx`)
3. Dispatches `config/reload`
4. `GameContext` handles that action and calls `reloadConfig()` from `src/game/configLoader.ts`
5. Config cache is replaced; future getter reads use new values

Reducer note:

- `src/game/actions.ts` treats `config/reload` as a side-effect trigger and does not mutate `GameState`.

## 4. How To Change Settings At Runtime

Recommended workflow:

1. Edit one of the JSON files under `public/config/`.
2. In the running app, open Main and click `Reload Game Config`.
3. Verify behavior in the affected feature flow.
4. Run validation:
   - `npm run test:run`
   - `npm run build`

When a restart/reset may still be needed:

- Values that are only used at initialization or state creation (for example default/new-save bootstrap values) may not retroactively apply to existing state without reset/migration.

## 5. Environment Overrides

The loader supports `VITE_GAME_CONFIG_*` keys (see `src/game/configLoader.ts`).

Example intent:

- `VITE_GAME_CONFIG_COMBAT_PLAYER_BASE_ATTACKS_PER_SECOND=2`

Practical guidance:

- Prefer JSON + reload for most balancing work.
- Use env overrides for controlled dev/CI scenarios where build-time injection is desired.

## 6. Safe Change Checklist

When adding or changing a config field:

1. Add/update the field in `src/game/configSchema.ts`.
2. Add/update hardcoded default in `src/game/configLoader.ts`.
3. Add/update runtime JSON in `public/config/*.config.json`.
4. Ensure the domain reads through config getters (not hardcoded constants).
5. Add or update tests near the affected logic.
6. Validate with `npm run test:run` and `npm run build`.
7. Update this guide with new keys, ownership, and reload behavior notes.

## 7. Common Pitfalls

- Updating JSON but forgetting to click `Reload Game Config`.
- Adding schema fields without updating loader defaults or JSON templates.
- Modifying legacy constants instead of runtime getter-backed paths.
- Assuming all domains are fully runtime-configurable today (garden/upgrades are partially prepared but not fully wired).
