export type ClassId =
  | "berserker"
  | "sorceress"
  | "farmer"
  | "archer"
  | "idler"
  | "tamer";

export interface ClassNodeBonus {
  stat?: "attack" | "defense" | "agility" | "intelligence" | "hp";
  percent?: number;
  flat?: number;
  key?: string;
  value?: number;
}

export interface ClassSkillNodeDefinition {
  id: string;
  name: string;
  description: string;
  maxRank: number;
  prerequisites?: string[];
  bonuses?: ClassNodeBonus[];
}

export interface ClassSpellDefinition {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldownMs: number;
  requiredLevel: number;
}

export interface CharacterClassDefinition {
  id: ClassId;
  name: string;
  summary: string;
  fantasy: string;
  portraitAsset: string;
  nodes: ClassSkillNodeDefinition[];
  classSpells: ClassSpellDefinition[];
}

export interface CharacterClassProgress {
  unlockedNodeRanks: Record<string, number>;
  spentPoints: number;
  selectedSpellIds: Array<string | null>;
}

export interface CharacterState {
  activeClassId: ClassId | null;
  availableSkillPoints: number;
  classProgress: Record<ClassId, CharacterClassProgress>;
  lastClassSwapAt?: number;
  idleCheckIn?: {
    streakDays: number;
    lastCheckInDayKey: string | null;
  };
}

export const CLASS_UNLOCK_LEVEL = 10;
export const CLASS_SWITCH_GEM_COST = 100;
export const CLASS_TREE_NODE_TARGET = 22;
export const CLASS_MAX_SPELL_SLOTS = 8;

export function getSpellSlotsForLevel(level: number): number {
  if (level < 10) return 0;
  if (level < 20) return 4;
  if (level < 30) return 5;
  if (level < 40) return 6;
  if (level < 50) return 7;
  return 8;
}

export function createEmptyClassProgress(): CharacterClassProgress {
  return {
    unlockedNodeRanks: {},
    spentPoints: 0,
    selectedSpellIds: Array.from({ length: CLASS_MAX_SPELL_SLOTS }, () => null),
  };
}
