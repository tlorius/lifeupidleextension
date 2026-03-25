import { classDefinitions, type ClassId } from "./classes";
import type { GameState } from "./types";

export interface CombatSpellDefinition {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldownMs: number;
  requiredLevel: number;
  source: "general" | "class";
  classId?: ClassId;
}

const GENERAL_COMBAT_SPELL_DEFINITIONS: CombatSpellDefinition[] = [
  {
    id: "arcane_bolt",
    name: "Arcane Bolt",
    description:
      "Fire a focused bolt that scales with attack and intelligence.",
    manaCost: 25,
    cooldownMs: 6000,
    requiredLevel: 8,
    source: "general",
  },
  {
    id: "second_wind",
    name: "Second Wind",
    description: "Restore a chunk of combat HP using mana.",
    manaCost: 35,
    cooldownMs: 12000,
    requiredLevel: 10,
    source: "general",
  },
  {
    id: "mana_surge",
    name: "Mana Surge",
    description: "Replenish mana to sustain longer spell chains.",
    manaCost: 18,
    cooldownMs: 14000,
    requiredLevel: 14,
    source: "general",
  },
  {
    id: "ember_lance",
    name: "Ember Lance",
    description: "Launch a burning lance that scales with intelligence.",
    manaCost: 30,
    cooldownMs: 9000,
    requiredLevel: 18,
    source: "general",
  },
] as const;

export const COMBAT_SPELL_DEFINITIONS: CombatSpellDefinition[] =
  GENERAL_COMBAT_SPELL_DEFINITIONS;

const CLASS_COMBAT_SPELL_DEFINITIONS: CombatSpellDefinition[] = Object.values(
  classDefinitions,
).flatMap((classDef) =>
  classDef.classSpells.map((spell) => ({
    id: spell.id,
    name: spell.name,
    description: spell.description,
    manaCost: spell.manaCost,
    cooldownMs: spell.cooldownMs,
    requiredLevel: spell.requiredLevel,
    source: "class" as const,
    classId: classDef.id,
  })),
);

const ALL_COMBAT_SPELL_DEFINITIONS: CombatSpellDefinition[] = [
  ...GENERAL_COMBAT_SPELL_DEFINITIONS,
  ...CLASS_COMBAT_SPELL_DEFINITIONS,
];

export function getCombatSpellDefinition(
  spellId: string,
): CombatSpellDefinition | null {
  return (
    ALL_COMBAT_SPELL_DEFINITIONS.find((spell) => spell.id === spellId) ?? null
  );
}

export function getGeneralCombatSpellPath(): CombatSpellDefinition[] {
  return [...GENERAL_COMBAT_SPELL_DEFINITIONS].sort(
    (left, right) => left.requiredLevel - right.requiredLevel,
  );
}

export function getAvailableGeneralCombatSpells(
  level: number,
): CombatSpellDefinition[] {
  return GENERAL_COMBAT_SPELL_DEFINITIONS.filter(
    (spell) => level >= spell.requiredLevel,
  );
}

export function getClassCombatSpellsForClass(
  classId: ClassId,
): CombatSpellDefinition[] {
  return CLASS_COMBAT_SPELL_DEFINITIONS.filter(
    (spell) => spell.classId === classId,
  );
}

export function getAvailableCombatSpellsForState(
  state: GameState,
): CombatSpellDefinition[] {
  if (!state.playerProgress.unlockedSystems?.spells) return [];

  const level = state.playerProgress.level;
  const general = getAvailableGeneralCombatSpells(level);
  const activeClassId = state.character.activeClassId;
  if (!activeClassId) return general;

  const classSpells = getClassCombatSpellsForClass(activeClassId).filter(
    (spell) => level >= spell.requiredLevel,
  );
  return [...general, ...classSpells];
}
