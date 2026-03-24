# Class System Plan (Draft)

## Goal

Introduce a class system where the player selects exactly one active class at a time, with strong playstyle specialization.

Classes in scope:

- Berserker
- Sorceress
- Farmer
- Archer
- Idler
- Tamer

## Requirements Captured

- Only one class can be active at any time.
- Class can be swapped in the current Equipment menu.
- Equipment menu will be rebranded to Character and acts as class selection entrypoint.
- Class logic should live in its own module(s).
- Prefer separate files per class.
- Each class has a skill tree with meaningful choices, but not overwhelming complexity.
- Class choice should feel powerful and rewarding.

## Proposed Architecture

### File layout

- src/game/classes/types.ts
  - Shared class data types and enums.
- src/game/classes/state.ts
  - Class state helpers (active class, unlocked nodes, respec/swap helpers).
- src/game/classes/index.ts
  - Public API and registry exports.
- src/game/classes/effects.ts
  - Runtime effect aggregation to apply class passives/actives onto core systems.
- src/game/classes/classes/berserker.ts
- src/game/classes/classes/sorceress.ts
- src/game/classes/classes/farmer.ts
- src/game/classes/classes/archer.ts
- src/game/classes/classes/idler.ts
- src/game/classes/classes/tamer.ts

### Core data model (draft)

Add to GameState:

- character:
  - activeClassId: ClassId | null
  - classProgress: Record<ClassId, ClassProgress>
  - lastClassSwapAt?: number

ClassProgress (per class):

- unlockedNodeIds: string[]
- spentPoints: number
- classLevel?: number
- classXp?: number

### Class definition model (draft)

Each class file exports:

- metadata: id, name, fantasy, role tags
- passive modifiers
- class skill nodes (small branching tree)
- optional active spells list
- optional unlock hooks (for future expansions)

### Integration points

- UI:
  - Rebrand screen label from Equipment to Character.
  - Extend Character screen with class selection + class tree panel.
- Combat:
  - Hook class passives/actives into damage, APS, crit, survivability, DOT, pet scaling.
- Garden:
  - Farmer bonuses and special harvest outcomes.
- Idle:
  - Idler offline reward multipliers and daily check-in rules.
- Pets:
  - Tamer passive multipliers now; companion combat later behind feature flag/data model extension.

## Design Guardrails

- Keep class systems additive, not invasive: avoid rewriting combat core where possible.
- Use data-driven class definitions to keep balancing edits localized.
- Keep first iteration deterministic and testable.
- Preserve existing save compatibility with migration path.

## Suggested Implementation Phases

1. State and schema foundation
   - Add class state to GameState and default state.
   - Add migration logic for existing saves.
2. Class registry and data model
   - Implement shared types and per-class definition files.
3. Character screen integration
   - Rename Equipment to Character.
   - Add active class selector and class summary card.
4. Passive effects integration
   - Apply class passive modifiers in combat/idle/garden/pet formulas.
5. Skill tree implementation
   - Add node unlock logic and point spending rules.
6. Active class spells
   - Add class-specific spells and cooldown handling in current spell framework.
7. Tests and balancing pass
   - Unit tests for state, unlocks, swaps, and representative class effects.

## Initial Balancing Direction (Draft)

- Berserker: lower hit frequency, high burst windows.
- Sorceress: expanded spell bar/cooldowns + burst + stacking DOT.
- Farmer: sustain, HOT, garden production and special crop/high-tier harvest hooks.
- Archer: extreme APS + on-hit scaling, can exceed standard APS cap.
- Idler: offline gain scaling and daily-return incentives.
- Tamer: heavy pet stat amplification; future pet-companion combat support.

## Confirmed Decisions (2026-03-24)

1. Class unlock timing

- Class system unlocks at player level 10.

2. Class switching

- Players can preview all classes and trees for free.
- Switching active class costs a significant gem amount.
- Launch gem switch cost set to 100 (for testing).

3. Skill points and progression

- Grant 1 class skill point per player level-up.
- Points spent are tracked per class.
- Nodes are multilevel.
- At level 10 unlock, player receives only 1 class skill point (no retroactive points).

4. Respec

- Free respec at all times.

5. Tree persistence across swaps

- Per-class tree progress persists when switching away and back.
- Only the active class applies gameplay effects.

6. Spell model

- Keep general spells.
- Add class-specific spells alongside general spells.
- Add a visible default spell path/progression for general spells unlocked by XP progression.

7. Spell slots

- 4 slots at level 10.
- +1 slot at levels 20, 30, 40, and 50.
- 8 total slots by level 50.
- Selected spells are stored per slot per class.
- On class switch, auto-load the saved spell bar for that class.

8. Archer APS safety limit

- Hard safety cap at 100 attacks per second.

9. Idler design

- Combine offline-duration scaling with daily check-in streak rewards.

10. Farmer special drops

- Only special-category seeds/plants are eligible.
- Initial rare drop chance: 1% per harvest.
- Skill tree progression scales chance/tier upward.
- Unique drop chance must never exceed 1% per harvest.
- Initial content should be added now (not deferred).

11. Tamer v1 combat scope

- Include simple pet sprite in combat.
- Include distinct-color pet attack events.

12. Skill tree size target

- 12 nodes per class for v1.

13. Balance philosophy

- Prefer niche dominance and strong fantasy; tune down later if needed.

14. Character selection UX

- Use class cards with representative images.

## Remaining Open Questions (Blocking For No-Assumptions Implementation)

None. Implementation can start with confirmed constraints.

## Decisions Log

- 2026-03-24: Create dedicated class architecture notes in docs/class-system-plan.md before implementation.
- 2026-03-24: Keep class logic modular, with separate files per class and shared core in src/game/classes.
- 2026-03-24: Character screen (currently Equipment) will be entrypoint for class selection and management.
- 2026-03-24: Class unlock level set to 10.
- 2026-03-24: Class switch costs gems; free preview remains available.
- 2026-03-24: Free respec confirmed; per-class tree progress persists.
- 2026-03-24: Class spells added alongside general spells; per-class slot selection is persisted.
- 2026-03-24: Spell slot progression set to 4 at level 10, then +1 at 20/30/40/50 (max 8).
- 2026-03-24: Archer hard safety APS cap set to 100.
- 2026-03-24: Idler rewards combine offline scaling and daily streak incentives.
- 2026-03-24: Farmer special-drop eligibility restricted to special seeds/plants; unique drop chance capped at 1% per harvest.
- 2026-03-24: Tamer v1 includes pet sprite and colored pet attack events in combat.
- 2026-03-24: Target 12 nodes per class; design intentionally favors niche dominance and high-impact playstyles.
- 2026-03-24: Class switch gem cost fixed at 100 for initial test iteration.
- 2026-03-24: Class nodes confirmed multilevel; class unlock grants only 1 point at level 10.
- 2026-03-24: Class switch should auto-load class-specific saved spell slots.
- 2026-03-24: General spells are unlocked through XP/default progression path.
- 2026-03-24: Initial special seed/plant content should be implemented in the first delivery.
