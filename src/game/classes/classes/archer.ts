import type { CharacterClassDefinition } from "../types";

export const archerClass: CharacterClassDefinition = {
  id: "archer",
  name: "Archer",
  summary: "Hyper-fast attacks, on-hit synergies, and cap-breaking tempo.",
  fantasy: "A relentless volley specialist that drowns enemies in strikes.",
  portraitAsset: "archer",
  nodes: [
    {
      id: "archer_1",
      name: "Rapid Draw",
      description: "APS +0.22 per rank, Agility +3 per rank.",
      maxRank: 5,
    },
    {
      id: "archer_2",
      name: "Needle Rain",
      description: "All Damage +2% per rank, Attack +2.4 per rank.",
      maxRank: 5,
      prerequisites: ["archer_1"],
    },
    {
      id: "archer_3",
      name: "Click Reflex",
      description: "Click Damage +3.5% per rank, Attack +2.2 per rank.",
      maxRank: 5,
      prerequisites: ["archer_1"],
    },
    {
      id: "archer_4",
      name: "Windstep",
      description: "APS +0.34 per rank, Agility +3 per rank.",
      maxRank: 5,
      prerequisites: ["archer_2"],
    },
    {
      id: "archer_5",
      name: "Piercing Thread",
      description: "Crit Chance +1.6% per rank.",
      maxRank: 3,
      prerequisites: ["archer_2"],
    },
    {
      id: "archer_6",
      name: "Elastic String",
      description:
        "APS Multiplier +8% per rank, Agility +2.4 per rank, APS Cap +2 per rank.",
      maxRank: 5,
      prerequisites: ["archer_3"],
    },
    {
      id: "archer_7",
      name: "Volley Rhythm",
      description: "APS Multiplier +3% per rank, Agility +2.4 per rank.",
      maxRank: 5,
      prerequisites: ["archer_4"],
    },
    {
      id: "archer_8",
      name: "Shatter Nocks",
      description: "Crit Chance +1% per rank, Reduce enemy defense.",
      maxRank: 3,
      prerequisites: ["archer_5"],
    },
    {
      id: "archer_9",
      name: "Hunter Focus",
      description: "All Damage +1.5% per rank, Attack +2.8 per rank.",
      maxRank: 5,
      prerequisites: ["archer_6"],
    },
    {
      id: "archer_10",
      name: "Storm Quiver",
      description: "Pet Proc Chance +2% per rank, additional hit procs.",
      maxRank: 3,
      prerequisites: ["archer_7", "archer_8"],
    },
    {
      id: "archer_11",
      name: "Skyline Step",
      description:
        "APS Multiplier +6%, Agility +4.2, sustain at high attack speed.",
      maxRank: 1,
      prerequisites: ["archer_9"],
    },
    {
      id: "archer_12",
      name: "Arrow Tempest",
      description:
        "All Damage +16%, APS Cap +20, Attack +12, Crit Chance +4%. Capstone.",
      maxRank: 1,
      prerequisites: ["archer_10", "archer_11"],
    },
  ],
  classSpells: [
    {
      id: "archer_hailfire",
      name: "Hailfire",
      description: "Massively increase attacks per second for a short burst.",
      manaCost: 28,
      cooldownMs: 14000,
      requiredLevel: 10,
    },
    {
      id: "archer_pinpoint",
      name: "Pinpoint Volley",
      description: "High-frequency multishot with on-hit scaling.",
      manaCost: 38,
      cooldownMs: 17000,
      requiredLevel: 20,
    },
  ],
};
