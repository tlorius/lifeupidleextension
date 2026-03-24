import type { CharacterClassDefinition } from "../types";

export const tamerClass: CharacterClassDefinition = {
  id: "tamer",
  name: "Tamer",
  summary:
    "Massive pet amplification with passive and active companion support.",
  fantasy: "A bond-driven fighter whose companions become the main weapon.",
  portraitAsset: "tamer",
  nodes: [
    {
      id: "tamer_1",
      name: "Bond Strength",
      description: "Pet Damage +7% per rank, Pet Strength +5.5 per rank.",
      maxRank: 5,
    },
    {
      id: "tamer_2",
      name: "Companion Instinct",
      description: "Pet Proc Chance +3% per rank, Agility +2.8 per rank.",
      maxRank: 5,
      prerequisites: ["tamer_1"],
    },
    {
      id: "tamer_3",
      name: "Shared Resolve",
      description:
        "Reduce Incoming Damage by 2% per rank, Defense +2.5 per rank.",
      maxRank: 3,
      prerequisites: ["tamer_1"],
    },
    {
      id: "tamer_4",
      name: "Feral Training",
      description: "Crit Chance +1.4% per rank, Pet crit bonus.",
      maxRank: 5,
      prerequisites: ["tamer_2"],
    },
    {
      id: "tamer_5",
      name: "Pack Tactics",
      description: "All Damage +3% per rank, Attack +2.8 per rank.",
      maxRank: 5,
      prerequisites: ["tamer_2"],
    },
    {
      id: "tamer_6",
      name: "Echo Command",
      description:
        "Pet Proc Damage Multiplier +8% per rank, Pet Strength +4.2 per rank.",
      maxRank: 3,
      prerequisites: ["tamer_3"],
    },
    {
      id: "tamer_7",
      name: "Predator Pace",
      description: "Pet Damage +4.5% per rank, Agility +2.6 per rank.",
      maxRank: 5,
      prerequisites: ["tamer_4"],
    },
    {
      id: "tamer_8",
      name: "Wild Bulwark",
      description:
        "Reduce Incoming Damage by 2.5% per rank, Defense +2.6 per rank.",
      maxRank: 3,
      prerequisites: ["tamer_5"],
    },
    {
      id: "tamer_9",
      name: "Alpha Signal",
      description: "Pet Damage +6% per rank, Pet Strength +4 per rank.",
      maxRank: 5,
      prerequisites: ["tamer_6"],
    },
    {
      id: "tamer_10",
      name: "Companion Frenzy",
      description: "Pet Proc Chance +3% per rank, Attack +3.5 per rank.",
      maxRank: 3,
      prerequisites: ["tamer_7", "tamer_8"],
    },
    {
      id: "tamer_11",
      name: "Guardian Bond",
      description:
        "Survive lethal hit with 32% chance and heal to 18% HP. HP +10.5.",
      maxRank: 1,
      prerequisites: ["tamer_9"],
    },
    {
      id: "tamer_12",
      name: "Primal Concord",
      description: "Pet Damage +20%, Pet Strength +10, Attack +8. Capstone.",
      maxRank: 1,
      prerequisites: ["tamer_10", "tamer_11"],
    },
  ],
  classSpells: [
    {
      id: "tamer_pack_howl",
      name: "Pack Howl",
      description: "Boost pet damage and speed for a short duration.",
      manaCost: 30,
      cooldownMs: 16000,
      requiredLevel: 10,
    },
    {
      id: "tamer_beast_sync",
      name: "Beast Sync",
      description: "Synchronize player and pet strikes for burst events.",
      manaCost: 40,
      cooldownMs: 22000,
      requiredLevel: 20,
    },
  ],
};
