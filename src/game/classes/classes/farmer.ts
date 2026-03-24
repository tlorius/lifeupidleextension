import type { CharacterClassDefinition } from "../types";

export const farmerClass: CharacterClassDefinition = {
  id: "farmer",
  name: "Farmer",
  summary: "Sustain combatant with strong garden growth and harvest rewards.",
  fantasy: "A cultivator who turns resilience and harvest into power.",
  portraitAsset: "farmer",
  nodes: [
    {
      id: "farmer_1",
      name: "Field Medicine",
      description: "Increase Healing by 5% per rank, HP +8.5 per rank.",
      maxRank: 5,
    },
    {
      id: "farmer_2",
      name: "Irrigation Instinct",
      description: "Plant Growth +5.5 per rank, Energy Regen +2.8 per rank.",
      maxRank: 5,
      prerequisites: ["farmer_1"],
    },
    {
      id: "farmer_3",
      name: "Rooted Guard",
      description:
        "Reduce Incoming Damage by 1.8% per rank, Defense +2.8 per rank.",
      maxRank: 5,
      prerequisites: ["farmer_1"],
    },
    {
      id: "farmer_4",
      name: "Bountiful Hands",
      description:
        "Plant Growth +4.8 per rank, Rare crop chance +0.15% per rank.",
      maxRank: 5,
      prerequisites: ["farmer_2"],
    },
    {
      id: "farmer_5",
      name: "Dawn Tonic",
      description:
        "Increase Healing by 5% per rank, Energy Regen +2.8 per rank.",
      maxRank: 3,
      prerequisites: ["farmer_2"],
    },
    {
      id: "farmer_6",
      name: "Granary Mind",
      description:
        "Mana Restore Multiplier +2.5% per rank, Gold Income +2.5 per rank.",
      maxRank: 5,
      prerequisites: ["farmer_3"],
    },
    {
      id: "farmer_7",
      name: "Hardy Stem",
      description: "Reduce Incoming Damage by 1.5% per rank, HP +10 per rank.",
      maxRank: 5,
      prerequisites: ["farmer_4"],
    },
    {
      id: "farmer_8",
      name: "Harvest Surge",
      description: "Watering Duration +5.2 per rank, Damage +2% per rank.",
      maxRank: 3,
      prerequisites: ["farmer_5"],
    },
    {
      id: "farmer_9",
      name: "Seed Fortune",
      description:
        "Plant Growth +3.5 per rank, Special crop chance increases per rank.",
      maxRank: 5,
      prerequisites: ["farmer_6"],
    },
    {
      id: "farmer_10",
      name: "Sunrise Feast",
      description: "HP +9.2 per rank, Healing +6% per rank.",
      maxRank: 3,
      prerequisites: ["farmer_7", "farmer_8"],
    },
    {
      id: "farmer_11",
      name: "Vault of Seasons",
      description:
        "Healing +12%, Plant Growth +8, Watering Duration +6, Gold Income +5.",
      maxRank: 1,
      prerequisites: ["farmer_9"],
    },
    {
      id: "farmer_12",
      name: "Verdant Sovereign",
      description:
        "Healing +12%, Plant Growth +10, Attack +8, Rare crops +1.2%. Capstone.",
      maxRank: 1,
      prerequisites: ["farmer_10", "farmer_11"],
    },
  ],
  classSpells: [
    {
      id: "farmer_regrowth",
      name: "Regrowth",
      description: "Heal instantly and apply heal-over-time.",
      manaCost: 30,
      cooldownMs: 14000,
      requiredLevel: 10,
    },
    {
      id: "farmer_harvest_guard",
      name: "Harvest Guard",
      description: "Damage reduction and regen during combat.",
      manaCost: 40,
      cooldownMs: 22000,
      requiredLevel: 20,
    },
  ],
};
