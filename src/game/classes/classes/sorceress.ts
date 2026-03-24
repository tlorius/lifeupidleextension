import type { CharacterClassDefinition } from "../types";

export const sorceressClass: CharacterClassDefinition = {
  id: "sorceress",
  name: "Sorceress",
  summary: "Large spell toolkit with burst and stacking damage-over-time.",
  fantasy: "A master of arcane pressure, shields, and devastating cycles.",
  portraitAsset: "sorceress",
  nodes: [
    {
      id: "sorceress_1",
      name: "Arcane Capacity",
      description:
        "Reduce Spell Mana Cost by 2.5% per rank, Energy Regen +5.5 per rank.",
      maxRank: 5,
    },
    {
      id: "sorceress_2",
      name: "Spell Weaving",
      description:
        "Reduce Spell Cooldown by 3% per rank, Intelligence +2.8 per rank.",
      maxRank: 5,
      prerequisites: ["sorceress_1"],
    },
    {
      id: "sorceress_3",
      name: "Ignition Thread",
      description: "Spell Damage +5% per rank, Intelligence +3.2 per rank.",
      maxRank: 5,
      prerequisites: ["sorceress_1"],
    },
    {
      id: "sorceress_4",
      name: "Aegis Orbit",
      description: "Increase Healing by 3% per rank, Defense +2.2 per rank.",
      maxRank: 3,
      prerequisites: ["sorceress_2"],
    },
    {
      id: "sorceress_5",
      name: "Overcharge",
      description: "Spell Damage +4.5% per rank, Attack +2.6 per rank.",
      maxRank: 5,
      prerequisites: ["sorceress_2"],
    },
    {
      id: "sorceress_6",
      name: "Kindling Echo",
      description: "Crit Chance +1.5% per rank.",
      maxRank: 3,
      prerequisites: ["sorceress_3"],
    },
    {
      id: "sorceress_7",
      name: "Temporal Focus",
      description:
        "Increase APS Multiplier by 2.5% per rank, Agility +2.4 per rank.",
      maxRank: 5,
      prerequisites: ["sorceress_4"],
    },
    {
      id: "sorceress_8",
      name: "Runic Recovery",
      description:
        "Mana Restore Multiplier +5% per rank, Energy Regen +4.8 per rank.",
      maxRank: 3,
      prerequisites: ["sorceress_5"],
    },
    {
      id: "sorceress_9",
      name: "Storm Sigil",
      description: "Spell Damage +4% per rank, Intelligence +2.4 per rank.",
      maxRank: 5,
      prerequisites: ["sorceress_6"],
    },
    {
      id: "sorceress_10",
      name: "Fate Detonation",
      description: "Spell Damage +6% per rank, Crit Chance +2% per rank.",
      maxRank: 3,
      prerequisites: ["sorceress_7", "sorceress_8"],
    },
    {
      id: "sorceress_11",
      name: "Mirror Veil",
      description:
        "Survive lethal hit with 28% chance and heal to 18% HP. Defense +8.",
      maxRank: 1,
      prerequisites: ["sorceress_9"],
    },
    {
      id: "sorceress_12",
      name: "Astral Dominion",
      description: "Spell Damage +22%, Intelligence +14, Attack +6. Capstone.",
      maxRank: 1,
      prerequisites: ["sorceress_10", "sorceress_11"],
    },
  ],
  classSpells: [
    {
      id: "sorceress_nova",
      name: "Star Nova",
      description: "Huge arcane burst around the target.",
      manaCost: 45,
      cooldownMs: 20000,
      requiredLevel: 10,
    },
    {
      id: "sorceress_hexfire",
      name: "Hexfire",
      description: "Fast-ticking stacking DOT curse.",
      manaCost: 30,
      cooldownMs: 9000,
      requiredLevel: 20,
    },
  ],
};
