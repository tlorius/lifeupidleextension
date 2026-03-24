import type { Stats } from "./types";

export interface UniqueSetDefinition {
  id: string;
  name: string;
  twoPiece: Partial<Stats>;
  fourPiece: Partial<Stats>;
}

export const uniqueSetDefinitions: Record<string, UniqueSetDefinition> = {
  voidborn: {
    id: "voidborn",
    name: "Voidborn Eclipse",
    twoPiece: {
      attack: 220,
      goldIncome: 180,
    },
    fourPiece: {
      attack: 900,
      intelligence: 420,
      goldIncome: 600,
      petStrength: 260,
    },
  },
  arcaneforge: {
    id: "arcaneforge",
    name: "Arcaneforge Dominion",
    twoPiece: {
      intelligence: 280,
      energyRegeneration: 260,
    },
    fourPiece: {
      attack: 760,
      intelligence: 980,
      energyRegeneration: 760,
      goldIncome: 260,
    },
  },
  verdant: {
    id: "verdant",
    name: "Verdant Sovereign",
    twoPiece: {
      plantGrowth: 340,
      wateringDuration: 280,
      goldIncome: 220,
    },
    fourPiece: {
      attack: 520,
      plantGrowth: 1200,
      wateringDuration: 900,
      petStrength: 220,
    },
  },
  beastlord: {
    id: "beastlord",
    name: "Beastlord Ascension",
    twoPiece: {
      attack: 320,
      agility: 180,
      petStrength: 420,
    },
    fourPiece: {
      attack: 1200,
      hp: 2600,
      petStrength: 1100,
      goldIncome: 340,
    },
  },
  bloodletter: {
    id: "bloodletter",
    name: "Bloodletter Volley",
    twoPiece: {
      critChance: 42,
      attack: 520,
      agility: 160,
    },
    fourPiece: {
      critChance: 88,
      attack: 2200,
      agility: 420,
      intelligence: 260,
    },
  },
  windrazor: {
    id: "windrazor",
    name: "Windrazor Tempest",
    twoPiece: {
      agility: 320,
      attack: 440,
    },
    fourPiece: {
      agility: 980,
      attack: 1800,
      critChance: 36,
    },
  },
};
