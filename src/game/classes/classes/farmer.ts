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
      id: "farmer_synergy",
      name: "Harvest Focus",
      description:
        "Unlock Active Skill Harvest Focus: your next Farmer spell deals 5x damage.",
      maxRank: 1,
      prerequisites: ["farmer_2"],
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
    {
      id: "farmer_13",
      name: "Briar Payload",
      description: "All Damage +2% per rank, Attack +2.4 per rank.",
      maxRank: 5,
      prerequisites: ["farmer_12"],
    },
    {
      id: "farmer_14",
      name: "Dew Reservoir",
      description: "Healing +5% per rank, HP +8 per rank.",
      maxRank: 5,
      prerequisites: ["farmer_12"],
    },
    {
      id: "farmer_15",
      name: "Cellar Wisdom",
      description:
        "Mana Restore Multiplier +4% per rank, Energy Regen +3.2 per rank.",
      maxRank: 5,
      prerequisites: ["farmer_13"],
    },
    {
      id: "farmer_16",
      name: "Stone Furrow",
      description:
        "Reduce Incoming Damage by 1.8% per rank, Defense +3 per rank.",
      maxRank: 5,
      prerequisites: ["farmer_14"],
    },
    {
      id: "farmer_17",
      name: "Harvest Temper",
      description: "All Damage +2.5% per rank, Healing +2% per rank.",
      maxRank: 5,
      prerequisites: ["farmer_15"],
    },
    {
      id: "farmer_18",
      name: "Mulch Heart",
      description:
        "Healing +4% per rank, Mana Restore Multiplier +3% per rank.",
      maxRank: 3,
      prerequisites: ["farmer_16"],
    },
    {
      id: "farmer_19",
      name: "Iron Orchard",
      description:
        "All Damage +3% per rank, Reduce Incoming Damage by 1% per rank.",
      maxRank: 5,
      prerequisites: ["farmer_17"],
    },
    {
      id: "farmer_20",
      name: "Seasoned Feast",
      description: "Healing +7% per rank, All Damage +1.5% per rank.",
      maxRank: 3,
      prerequisites: ["farmer_18", "farmer_19"],
    },
    {
      id: "farmer_21",
      name: "Golden Acre",
      description: "Healing +10%, All Damage +6%, Gold Income +8.",
      maxRank: 1,
      prerequisites: ["farmer_19"],
    },
    {
      id: "farmer_22",
      name: "Crown of Harvests",
      description:
        "Healing +12%, All Damage +14%, Mana Restore +8%. Final capstone.",
      maxRank: 1,
      prerequisites: ["farmer_20", "farmer_21"],
    },
  ],
  classSpells: [
    {
      id: "farmer_harvest_focus",
      name: "Harvest Focus",
      description:
        "Channel gathered vitality so your next Farmer spell lands as a devastating harvest strike.",
      manaCost: 22,
      cooldownMs: 30000,
      requiredLevel: 12,
    },
    {
      id: "farmer_regrowth",
      name: "Regrowth",
      description: "Flood yourself with a heavy burst of renewal.",
      manaCost: 30,
      cooldownMs: 18000,
      requiredLevel: 10,
    },
    {
      id: "farmer_harvest_guard",
      name: "Harvest Guard",
      description: "Raise a thick harvest ward and siphon life from the field.",
      manaCost: 40,
      cooldownMs: 28000,
      requiredLevel: 20,
    },
    {
      id: "farmer_briar_cannon",
      name: "Briar Cannon",
      description:
        "Launch a compressed thorn payload straight through the foe.",
      manaCost: 36,
      cooldownMs: 23000,
      requiredLevel: 24,
    },
    {
      id: "farmer_silo_breaker",
      name: "Silo Breaker",
      description: "Bring down a crushing grain-weighted strike.",
      manaCost: 44,
      cooldownMs: 27000,
      requiredLevel: 28,
    },
    {
      id: "farmer_thornwake",
      name: "Thornwake",
      description: "Rip the ground open into a punishing burst of briars.",
      manaCost: 50,
      cooldownMs: 32000,
      requiredLevel: 32,
    },
    {
      id: "farmer_orchard_stampede",
      name: "Orchard Stampede",
      description: "Flatten the enemy beneath a rolling wall of wild growth.",
      manaCost: 56,
      cooldownMs: 36000,
      requiredLevel: 36,
    },
    {
      id: "farmer_solstice_reap",
      name: "Solstice Reap",
      description: "Cut down the target with a blazing seasonal harvest.",
      manaCost: 62,
      cooldownMs: 42000,
      requiredLevel: 40,
    },
    {
      id: "farmer_ironroot_burst",
      name: "Ironroot Burst",
      description: "Drive iron-hard roots upward in a decisive eruption.",
      manaCost: 68,
      cooldownMs: 48000,
      requiredLevel: 44,
    },
    {
      id: "farmer_seasons_wrath",
      name: "Season's Wrath",
      description: "Condense an entire year of growth into one violent cast.",
      manaCost: 74,
      cooldownMs: 56000,
      requiredLevel: 48,
    },
    {
      id: "farmer_verdant_end",
      name: "Verdant End",
      description: "Bring the full weight of the harvest to end the encounter.",
      manaCost: 82,
      cooldownMs: 64000,
      requiredLevel: 52,
    },
  ],
};
