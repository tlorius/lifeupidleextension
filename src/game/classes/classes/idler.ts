import type { CharacterClassDefinition } from "../types";

export const idlerClass: CharacterClassDefinition = {
  id: "idler",
  name: "Idler",
  summary: "Offline scaling and escalating daily check-in streak rewards.",
  fantasy: "A strategist who profits most from patience and consistency.",
  portraitAsset: "idler",
  nodes: [
    {
      id: "idler_1",
      name: "Long Arc",
      description: "Offline Gold +4.5 per rank.",
      maxRank: 5,
    },
    {
      id: "idler_2",
      name: "Silent Ledger",
      description: "Offline Gold +4.8 per rank, Attack +2.4 per rank.",
      maxRank: 5,
      prerequisites: ["idler_1"],
    },
    {
      id: "idler_3",
      name: "Resting Edge",
      description:
        "Damage +2% per rank after returning online, Attack +2.4 per rank.",
      maxRank: 5,
      prerequisites: ["idler_1"],
    },
    {
      id: "idler_4",
      name: "Streak Keeper",
      description:
        "Daily Streak Rewards +1% per rank, Gold Income +3.2 per rank.",
      maxRank: 5,
      prerequisites: ["idler_2"],
    },
    {
      id: "idler_5",
      name: "Quiet Reserve",
      description:
        "Mana Restore Multiplier +6% per rank, Energy Regen +4.2 per rank.",
      maxRank: 3,
      prerequisites: ["idler_2"],
    },
    {
      id: "idler_6",
      name: "Delayed Impact",
      description: "Damage +2% per rank on return, Attack +2.6 per rank.",
      maxRank: 5,
      prerequisites: ["idler_3"],
    },
    {
      id: "idler_7",
      name: "Patience Dividend",
      description: "Offline Gold scales by absence duration +4.2 per rank.",
      maxRank: 5,
      prerequisites: ["idler_4"],
    },
    {
      id: "idler_8",
      name: "Clockwork Calm",
      description:
        "Mana Restore Multiplier +3.6% per rank, Energy Regen +3.6 per rank.",
      maxRank: 3,
      prerequisites: ["idler_5"],
    },
    {
      id: "idler_9",
      name: "Return Momentum",
      description: "Damage +2% per rank on login, Gold Income +2.4 per rank.",
      maxRank: 5,
      prerequisites: ["idler_6"],
    },
    {
      id: "idler_10",
      name: "Fortune Reserve",
      description: "Spell Cooldown -2% per rank, Gold Income +3.2 per rank.",
      maxRank: 3,
      prerequisites: ["idler_7", "idler_8"],
    },
    {
      id: "idler_11",
      name: "Stillness Ward",
      description:
        "Reduce Incoming Damage by 4%, Defense +7.5. Defensive stabilizer.",
      maxRank: 1,
      prerequisites: ["idler_9"],
    },
    {
      id: "idler_12",
      name: "Perpetual Engine",
      description:
        "Offline Gold +10 per rank (20% if ranked), Energy Regen +6. Capstone.",
      maxRank: 1,
      prerequisites: ["idler_10", "idler_11"],
    },
  ],
  classSpells: [
    {
      id: "idler_dividend",
      name: "Dividend Burst",
      description: "Convert recent idle value into temporary combat power.",
      manaCost: 20,
      cooldownMs: 25000,
      requiredLevel: 10,
    },
    {
      id: "idler_timebank",
      name: "Timebank",
      description: "Bank current action for amplified next ticks.",
      manaCost: 32,
      cooldownMs: 30000,
      requiredLevel: 20,
    },
  ],
};
