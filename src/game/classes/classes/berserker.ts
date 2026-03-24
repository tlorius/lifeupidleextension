import type { CharacterClassDefinition } from "../types";

export const berserkerClass: CharacterClassDefinition = {
  id: "berserker",
  name: "Berserker",
  summary: "Slow, crushing hits with explosive burst windows.",
  fantasy: "A relentless executioner who wins by overwhelming impact.",
  portraitAsset: "berserker",
  nodes: [
    {
      id: "berserker_1",
      name: "Heavy Momentum",
      description: "Heavy Hit Damage +3.5% per rank.",
      maxRank: 5,
    },
    {
      id: "berserker_2",
      name: "Blood Tempo",
      description: "Click Damage +3% per rank, Agility +2.5 per rank.",
      maxRank: 3,
      prerequisites: ["berserker_1"],
    },
    {
      id: "berserker_3",
      name: "Skullsplit",
      description:
        "Reduce Incoming Damage by 2% per rank, Defense +2.2 per rank.",
      maxRank: 5,
      prerequisites: ["berserker_1"],
    },
    {
      id: "berserker_4",
      name: "Execution Rhythm",
      description: "Crit Chance +1.25% per rank.",
      maxRank: 3,
      prerequisites: ["berserker_2"],
    },
    {
      id: "berserker_5",
      name: "Carnage Fuel",
      description:
        "Mana gain on Hit +0.9 per rank, Energy Regen +3.8 per rank.",
      maxRank: 3,
      prerequisites: ["berserker_2"],
    },
    {
      id: "berserker_6",
      name: "Iron Appetite",
      description: "Lifesteal +0.9% per rank, HP +7.5 per rank.",
      maxRank: 5,
      prerequisites: ["berserker_3"],
    },
    {
      id: "berserker_7",
      name: "War Roar",
      description: "Spell Damage +6% per rank, Attack +3.2 per rank.",
      maxRank: 3,
      prerequisites: ["berserker_4"],
    },
    {
      id: "berserker_8",
      name: "Crimson Trail",
      description: "All Damage +2% per rank, Crit Chance +1.2% per rank.",
      maxRank: 5,
      prerequisites: ["berserker_5"],
    },
    {
      id: "berserker_9",
      name: "Titan Grip",
      description: "All Damage +4% per rank (stacking), Attack +5.8 per rank.",
      maxRank: 3,
      prerequisites: ["berserker_6"],
    },
    {
      id: "berserker_10",
      name: "Ruin Pulse",
      description: "All Damage +3% per rank, Attack +3.6 per rank.",
      maxRank: 5,
      prerequisites: ["berserker_7", "berserker_8"],
    },
    {
      id: "berserker_11",
      name: "Unbroken",
      description:
        "Survive lethal hit with 35% chance and heal to 18% HP. Defense +8.5, HP +12.",
      maxRank: 1,
      prerequisites: ["berserker_9"],
    },
    {
      id: "berserker_12",
      name: "Apex Butcher",
      description: "All Damage +20%, Attack +14, HP +20. Capstone.",
      maxRank: 1,
      prerequisites: ["berserker_10", "berserker_11"],
    },
  ],
  classSpells: [
    {
      id: "berserker_warcry",
      name: "Warcry",
      description: "Massively increase damage for a short window.",
      manaCost: 35,
      cooldownMs: 18000,
      requiredLevel: 10,
    },
    {
      id: "berserker_execution",
      name: "Executioner Stance",
      description: "Sacrifice speed for enormous hit damage.",
      manaCost: 50,
      cooldownMs: 26000,
      requiredLevel: 20,
    },
  ],
};
