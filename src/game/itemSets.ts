import type { ClassId } from "./classes/types";
import { itemDefinitions } from "./itemsCatalog";
import type { GameState, Stats } from "./types";

export interface UniqueSetDefinition {
  id: string;
  name: string;
  classId: ClassId;
  twoPiece: Partial<Stats>;
  fourPiece: Partial<Stats>;
  fivePiece: Partial<Stats>;
  fivePieceSpellBonus?: {
    spellId: string;
    damageMultiplier: number;
    description: string;
  };
}

export const uniqueSetDefinitions: Record<string, UniqueSetDefinition> = {
  voidborn: {
    id: "voidborn",
    name: "Voidborn Eclipse [Idler]",
    classId: "idler",
    twoPiece: {
      attack: 4200,
      goldIncome: 3200,
      energyRegeneration: 520,
    },
    fourPiece: {
      attack: 18500,
      intelligence: 9200,
      goldIncome: 14000,
      hp: 42000,
    },
    fivePiece: {
      attack: 68000,
      intelligence: 26000,
      goldIncome: 40000,
      energyRegeneration: 4200,
    },
  },
  arcaneforge: {
    id: "arcaneforge",
    name: "Arcaneforge Dominion [Sorceress]",
    classId: "sorceress",
    twoPiece: {
      intelligence: 6200,
      energyRegeneration: 3600,
      attack: 2200,
    },
    fourPiece: {
      attack: 17000,
      intelligence: 32000,
      energyRegeneration: 13500,
      critChance: 140,
    },
    fivePiece: {
      attack: 62000,
      intelligence: 90000,
      energyRegeneration: 42000,
      critChance: 260,
    },
  },
  verdant: {
    id: "verdant",
    name: "Verdant Sovereign [Farmer]",
    classId: "farmer",
    twoPiece: {
      plantGrowth: 3200,
      wateringDuration: 2600,
      goldIncome: 2800,
      hp: 18000,
    },
    fourPiece: {
      attack: 14000,
      plantGrowth: 18000,
      wateringDuration: 14000,
      petStrength: 8200,
    },
    fivePiece: {
      attack: 54000,
      plantGrowth: 54000,
      wateringDuration: 42000,
      hp: 140000,
    },
  },
  beastlord: {
    id: "beastlord",
    name: "Beastlord Ascension [Tamer]",
    classId: "tamer",
    twoPiece: {
      attack: 5200,
      agility: 2600,
      petStrength: 6800,
    },
    fourPiece: {
      attack: 24000,
      hp: 62000,
      petStrength: 30000,
      critChance: 120,
    },
    fivePiece: {
      attack: 84000,
      hp: 220000,
      petStrength: 110000,
      agility: 21000,
    },
  },
  bloodletter: {
    id: "bloodletter",
    name: "Bloodletter Volley [Berserker]",
    classId: "berserker",
    twoPiece: {
      critChance: 120,
      attack: 7600,
      agility: 2200,
    },
    fourPiece: {
      critChance: 260,
      attack: 34000,
      agility: 12000,
      hp: 68000,
    },
    fivePiece: {
      critChance: 420,
      attack: 120000,
      agility: 36000,
      hp: 220000,
    },
  },
  windrazor: {
    id: "windrazor",
    name: "Windrazor Tempest [Archer]",
    classId: "archer",
    twoPiece: {
      agility: 5200,
      attack: 6200,
      critChance: 90,
    },
    fourPiece: {
      agility: 26000,
      attack: 30000,
      critChance: 240,
    },
    fivePiece: {
      agility: 92000,
      attack: 100000,
      critChance: 460,
      hp: 90000,
    },
  },
  gorelord: {
    id: "gorelord",
    name: "Gorelord Cataclysm [Berserker]",
    classId: "berserker",
    twoPiece: {
      attack: 9000,
      hp: 42000,
      critChance: 160,
    },
    fourPiece: {
      attack: 52000,
      hp: 180000,
      defense: 22000,
      agility: 14000,
    },
    fivePiece: {
      attack: 210000,
      hp: 620000,
      defense: 82000,
      critChance: 520,
    },
    fivePieceSpellBonus: {
      spellId: "berserker_doom_feast",
      damageMultiplier: 8,
      description: "Berserker only: Doom Feast damage multiplied by 8x.",
    },
  },
  nightstar: {
    id: "nightstar",
    name: "Nightstar Covenant [Sorceress]",
    classId: "sorceress",
    twoPiece: {
      attack: 7000,
      intelligence: 18000,
      energyRegeneration: 6200,
    },
    fourPiece: {
      attack: 38000,
      intelligence: 90000,
      energyRegeneration: 36000,
      critChance: 210,
    },
    fivePiece: {
      attack: 160000,
      intelligence: 340000,
      energyRegeneration: 140000,
      critChance: 560,
    },
    fivePieceSpellBonus: {
      spellId: "sorceress_eclipse_verdict",
      damageMultiplier: 9,
      description: "Sorceress only: Eclipse Verdict damage multiplied by 9x.",
    },
  },
  rootcrown: {
    id: "rootcrown",
    name: "Rootcrown Ascendancy [Farmer]",
    classId: "farmer",
    twoPiece: {
      attack: 6200,
      hp: 52000,
      plantGrowth: 7200,
      wateringDuration: 6200,
    },
    fourPiece: {
      attack: 32000,
      hp: 240000,
      plantGrowth: 42000,
      wateringDuration: 32000,
    },
    fivePiece: {
      attack: 140000,
      hp: 820000,
      plantGrowth: 180000,
      wateringDuration: 140000,
    },
    fivePieceSpellBonus: {
      spellId: "farmer_verdant_end",
      damageMultiplier: 8,
      description: "Farmer only: Verdant End damage multiplied by 8x.",
    },
  },
  skyhunter: {
    id: "skyhunter",
    name: "Skyhunter Dominion [Archer]",
    classId: "archer",
    twoPiece: {
      attack: 8200,
      agility: 9000,
      critChance: 180,
    },
    fourPiece: {
      attack: 46000,
      agility: 52000,
      critChance: 360,
      hp: 120000,
    },
    fivePiece: {
      attack: 180000,
      agility: 220000,
      critChance: 760,
      hp: 420000,
    },
    fivePieceSpellBonus: {
      spellId: "archer_zenith_barrage",
      damageMultiplier: 8,
      description: "Archer only: Zenith Barrage damage multiplied by 8x.",
    },
  },
  epochveil: {
    id: "epochveil",
    name: "Epochveil Treasury [Idler]",
    classId: "idler",
    twoPiece: {
      attack: 5600,
      goldIncome: 11000,
      energyRegeneration: 4200,
    },
    fourPiece: {
      attack: 30000,
      goldIncome: 72000,
      energyRegeneration: 22000,
      hp: 130000,
    },
    fivePiece: {
      attack: 130000,
      goldIncome: 280000,
      energyRegeneration: 90000,
      hp: 520000,
    },
    fivePieceSpellBonus: {
      spellId: "idler_epoch_cashout",
      damageMultiplier: 10,
      description: "Idler only: Epoch Cashout damage multiplied by 10x.",
    },
  },
  moonpack: {
    id: "moonpack",
    name: "Moonpack Sovereignty [Tamer]",
    classId: "tamer",
    twoPiece: {
      attack: 7600,
      petStrength: 11000,
      agility: 5200,
    },
    fourPiece: {
      attack: 42000,
      petStrength: 62000,
      hp: 210000,
      critChance: 240,
    },
    fivePiece: {
      attack: 170000,
      petStrength: 260000,
      hp: 680000,
      critChance: 620,
    },
    fivePieceSpellBonus: {
      spellId: "tamer_wild_hunt",
      damageMultiplier: 9,
      description: "Tamer only: Wild Hunt damage multiplied by 9x.",
    },
  },
};

export function getClassLabel(classId: ClassId): string {
  if (classId === "berserker") return "Berserker";
  if (classId === "sorceress") return "Sorceress";
  if (classId === "farmer") return "Farmer";
  if (classId === "archer") return "Archer";
  if (classId === "idler") return "Idler";
  return "Tamer";
}

export function getSetPieceCount(state: GameState, setId: string): number {
  const equippedUids = [
    state.equipment.weapon,
    state.equipment.armor,
    state.equipment.accessory1,
    state.equipment.accessory2,
    state.equipment.pet,
  ].filter((uid): uid is string => Boolean(uid));

  let pieces = 0;
  for (const uid of equippedUids) {
    const item = state.inventory.find((entry) => entry.uid === uid);
    if (!item) continue;
    const def = itemDefinitions[item.itemId];
    if (!def || def.rarity !== "unique") continue;
    if (def.setId === setId) {
      pieces += 1;
    }
  }

  return pieces;
}

export function isSetClassActive(
  state: GameState,
  setDef: UniqueSetDefinition,
): boolean {
  return state.character.activeClassId === setDef.classId;
}

export function hasSetPieceThreshold(
  state: GameState,
  setDef: UniqueSetDefinition,
  threshold: 2 | 4 | 5,
): boolean {
  return (
    isSetClassActive(state, setDef) &&
    getSetPieceCount(state, setDef.id) >= threshold
  );
}

export function getActiveSpellSetDamageMultiplier(
  state: GameState,
  spellId: string,
): number {
  let multiplier = 1;

  for (const setDef of Object.values(uniqueSetDefinitions)) {
    if (!setDef.fivePieceSpellBonus) continue;
    if (setDef.fivePieceSpellBonus.spellId !== spellId) continue;
    if (!hasSetPieceThreshold(state, setDef, 5)) continue;
    multiplier *= setDef.fivePieceSpellBonus.damageMultiplier;
  }

  return multiplier;
}
