import type { Upgrade } from "./types";
import type { GameState } from "./types";

/**
 * Upgrade definitions organized by tree with prerequisites and linked upgrades
 */
export const upgradeDefinitions: Record<string, Upgrade> = {
  // ===== COMBAT TREE =====
  // Root: Attack I - Foundation attack upgrade
  attack_i: {
    id: "attack_i",
    name: "Attack I",
    description: "Increase attack by 10% per level",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 50,
    scaling: 1.5,
    bonuses: [{ percentBonusType: "attack", percentBonusAmount: 0.1 }],
    prerequisites: [], // No prerequisites, root node
    linkedUpgrades: [
      { upgradeId: "sharp_blade", unlocksAtLevel: 1 },
      { upgradeId: "attack_mastery", unlocksAtLevel: 3 },
    ],
  },

  // Attack I -> Sharp Blade
  sharp_blade: {
    id: "sharp_blade",
    name: "Sharp Blade",
    description: "Further increase attack by 5% per level",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 100,
    scaling: 1.6,
    bonuses: [{ percentBonusType: "attack", percentBonusAmount: 0.05 }],
    prerequisites: ["attack_i"],
    linkedUpgrades: [{ upgradeId: "battle_frenzy", unlocksAtLevel: 5 }],
  },

  // Attack I (level 3) -> Attack Mastery
  attack_mastery: {
    id: "attack_mastery",
    name: "Attack Mastery",
    description: "Master combat, increase attack by 3% per level",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 120,
    scaling: 1.7,
    bonuses: [{ percentBonusType: "attack", percentBonusAmount: 0.03 }],
    prerequisites: ["attack_i"],
    linkedUpgrades: [{ upgradeId: "warlord_doctrine", unlocksAtLevel: 4 }],
  },

  // Root: Defense I - Foundation defense upgrade
  defense_i: {
    id: "defense_i",
    name: "Defense I",
    description: "Increase defense by 10% per level",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 50,
    scaling: 1.5,
    bonuses: [{ percentBonusType: "defense", percentBonusAmount: 0.1 }],
    prerequisites: [],
    linkedUpgrades: [{ upgradeId: "iron_skin", unlocksAtLevel: 1 }],
  },

  // Defense I -> Iron Skin
  iron_skin: {
    id: "iron_skin",
    name: "Iron Skin",
    description: "Further increase defense by 5% per level",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 100,
    scaling: 1.6,
    bonuses: [{ percentBonusType: "defense", percentBonusAmount: 0.05 }],
    prerequisites: ["defense_i"],
    linkedUpgrades: [{ upgradeId: "guardian_core", unlocksAtLevel: 4 }],
  },

  // Sharp Blade (level 5) -> Battle Frenzy
  battle_frenzy: {
    id: "battle_frenzy",
    name: "Battle Frenzy",
    description:
      "Accelerate combat tempo with stronger strikes and faster actions",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 360,
    scaling: 1.9,
    bonuses: [
      { percentBonusType: "attack", percentBonusAmount: 0.08 },
      { percentBonusType: "agility", percentBonusAmount: 0.05 },
    ],
    prerequisites: ["sharp_blade"],
    linkedUpgrades: [{ upgradeId: "ruthless_tempo", unlocksAtLevel: 5 }],
  },

  // Iron Skin (level 4) -> Guardian Core
  guardian_core: {
    id: "guardian_core",
    name: "Guardian Core",
    description: "Fortify your core to massively improve durability",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 420,
    scaling: 1.92,
    bonuses: [
      { percentBonusType: "defense", percentBonusAmount: 0.08 },
      { percentBonusType: "hp", percentBonusAmount: 0.12 },
    ],
    prerequisites: ["iron_skin"],
    linkedUpgrades: [{ upgradeId: "warlord_doctrine", unlocksAtLevel: 3 }],
  },

  // Attack Mastery + Guardian Core -> Warlord Doctrine
  warlord_doctrine: {
    id: "warlord_doctrine",
    name: "Warlord Doctrine",
    description:
      "Blend offense and defense to unlock elite combat scaling per level",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 950,
    scaling: 2,
    bonuses: [
      { percentBonusType: "attack", percentBonusAmount: 0.12 },
      { percentBonusType: "critChance", percentBonusAmount: 0.06 },
      { percentBonusType: "defense", percentBonusAmount: 0.05 },
    ],
    prerequisites: ["attack_mastery", "guardian_core"],
    linkedUpgrades: [{ upgradeId: "ruthless_tempo", unlocksAtLevel: 3 }],
  },

  // Battle Frenzy + Warlord Doctrine -> Ruthless Tempo
  ruthless_tempo: {
    id: "ruthless_tempo",
    name: "Ruthless Tempo",
    description:
      "Chain combat momentum for huge gains to speed, crits, and attack power",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 1800,
    scaling: 2.08,
    bonuses: [
      { percentBonusType: "agility", percentBonusAmount: 0.12 },
      { percentBonusType: "critChance", percentBonusAmount: 0.1 },
      { percentBonusType: "attack", percentBonusAmount: 0.08 },
    ],
    prerequisites: ["battle_frenzy", "warlord_doctrine"],
    linkedUpgrades: [{ upgradeId: "immortal_legion", unlocksAtLevel: 4 }],
  },

  // Ruthless Tempo (level 4) -> Immortal Legion
  immortal_legion: {
    id: "immortal_legion",
    name: "Immortal Legion",
    description:
      "Late-game combat capstone with massive survivability and pressure",
    type: "attackBoost",
    tree: "combat",
    level: 0,
    baseCost: 4200,
    scaling: 2.18,
    bonuses: [
      { percentBonusType: "hp", percentBonusAmount: 0.2 },
      { percentBonusType: "defense", percentBonusAmount: 0.12 },
      { percentBonusType: "attack", percentBonusAmount: 0.12 },
    ],
    prerequisites: ["ruthless_tempo"],
    linkedUpgrades: [],
  },

  // ===== RESOURCE TREE =====
  // Root: Gold Rush - Foundation gold income upgrade
  gold_rush: {
    id: "gold_rush",
    name: "Gold Rush",
    description: "Increase gold income by 10% per level",
    type: "autoGold",
    tree: "resource",
    level: 0,
    baseCost: 75,
    scaling: 1.6,
    bonuses: [{ percentBonusType: "goldIncome", percentBonusAmount: 0.1 }],
    prerequisites: [],
    linkedUpgrades: [
      { upgradeId: "gold_efficiency", unlocksAtLevel: 1 },
      { upgradeId: "wealth", unlocksAtLevel: 3 },
    ],
  },

  // Gold Rush -> Gold Efficiency
  gold_efficiency: {
    id: "gold_efficiency",
    name: "Gold Efficiency",
    description: "Refine gold generation, increase by 5% per level",
    type: "autoGold",
    tree: "resource",
    level: 0,
    baseCost: 120,
    scaling: 1.7,
    bonuses: [{ percentBonusType: "goldIncome", percentBonusAmount: 0.05 }],
    prerequisites: ["gold_rush"],
    linkedUpgrades: [{ upgradeId: "compound_interest", unlocksAtLevel: 4 }],
  },

  // Gold Efficiency (level 2) -> Wealth
  wealth: {
    id: "wealth",
    name: "Wealth",
    description: "Accumulate great wealth, increase gold by 3% per level",
    type: "autoGold",
    tree: "resource",
    level: 0,
    baseCost: 150,
    scaling: 1.8,
    bonuses: [{ percentBonusType: "goldIncome", percentBonusAmount: 0.03 }],
    prerequisites: ["gold_rush"],
    linkedUpgrades: [{ upgradeId: "treasure_cartography", unlocksAtLevel: 4 }],
  },

  // Root: Mana Conservation
  energy_conservation: {
    id: "energy_conservation",
    name: "Mana Conservation",
    description: "Increase mana regeneration by 10% per level",
    type: "energyRegen",
    tree: "resource",
    level: 0,
    baseCost: 60,
    scaling: 1.5,
    bonuses: [
      { percentBonusType: "energyRegeneration", percentBonusAmount: 0.1 },
    ],
    prerequisites: [],
    linkedUpgrades: [{ upgradeId: "leyline_tapping", unlocksAtLevel: 3 }],
  },

  // Root: Gem Hunter
  gem_hunter: {
    id: "gem_hunter",
    name: "Gem Hunter",
    description: "Find 5% more gems per level",
    type: "gemFinder",
    tree: "resource",
    level: 0,
    baseCost: 100,
    scaling: 1.8,
    bonuses: [
      { percentBonusType: "goldIncome", percentBonusAmount: 0.02 },
      { percentBonusType: "intelligence", percentBonusAmount: 0.01 },
    ],
    prerequisites: [],
    linkedUpgrades: [
      { upgradeId: "prism_sieves", unlocksAtLevel: 4 },
      { upgradeId: "void_contracts", unlocksAtLevel: 6 },
    ],
  },

  // Gold Efficiency (level 4) -> Compound Interest
  compound_interest: {
    id: "compound_interest",
    name: "Compound Interest",
    description:
      "Scale idle income aggressively with compounding market returns",
    type: "autoGold",
    tree: "resource",
    level: 0,
    baseCost: 420,
    scaling: 1.95,
    bonuses: [{ percentBonusType: "goldIncome", percentBonusAmount: 0.12 }],
    prerequisites: ["gold_efficiency"],
    linkedUpgrades: [{ upgradeId: "market_domination", unlocksAtLevel: 5 }],
  },

  // Wealth (level 4) -> Treasure Cartography
  treasure_cartography: {
    id: "treasure_cartography",
    name: "Treasure Cartography",
    description: "Map rich zones to dramatically improve sustained earnings",
    type: "autoGold",
    tree: "resource",
    level: 0,
    baseCost: 500,
    scaling: 1.98,
    bonuses: [
      { percentBonusType: "goldIncome", percentBonusAmount: 0.1 },
      { percentBonusType: "energyRegeneration", percentBonusAmount: 0.04 },
    ],
    prerequisites: ["wealth"],
    linkedUpgrades: [{ upgradeId: "market_domination", unlocksAtLevel: 4 }],
  },

  // Mana Conservation (level 3) -> Leyline Tapping
  leyline_tapping: {
    id: "leyline_tapping",
    name: "Leyline Tapping",
    description:
      "Harvest ambient mana currents for much faster spell and action uptime",
    type: "energyRegen",
    tree: "resource",
    level: 0,
    baseCost: 480,
    scaling: 1.92,
    bonuses: [
      { percentBonusType: "energyRegeneration", percentBonusAmount: 0.14 },
      { percentBonusType: "intelligence", percentBonusAmount: 0.03 },
    ],
    prerequisites: ["energy_conservation"],
    linkedUpgrades: [{ upgradeId: "transmutation_engine", unlocksAtLevel: 4 }],
  },

  // Gem Hunter (level 4) -> Prism Sieves
  prism_sieves: {
    id: "prism_sieves",
    name: "Prism Sieves",
    description:
      "Filter high-value arcane residue into resources and magical throughput",
    type: "gemFinder",
    tree: "resource",
    level: 0,
    baseCost: 640,
    scaling: 2,
    bonuses: [
      { percentBonusType: "goldIncome", percentBonusAmount: 0.08 },
      { percentBonusType: "energyRegeneration", percentBonusAmount: 0.08 },
    ],
    prerequisites: ["gem_hunter"],
    linkedUpgrades: [{ upgradeId: "transmutation_engine", unlocksAtLevel: 3 }],
  },

  // Compound Interest + Treasure Cartography -> Market Domination
  market_domination: {
    id: "market_domination",
    name: "Market Domination",
    description: "Own every exchange and drive huge multiplicative growth",
    type: "autoGold",
    tree: "resource",
    level: 0,
    baseCost: 2200,
    scaling: 2.1,
    bonuses: [
      { percentBonusType: "goldIncome", percentBonusAmount: 0.2 },
      { percentBonusType: "attack", percentBonusAmount: 0.04 },
    ],
    prerequisites: ["compound_interest", "treasure_cartography"],
    linkedUpgrades: [{ upgradeId: "singularity_bank", unlocksAtLevel: 6 }],
  },

  // Leyline Tapping + Prism Sieves -> Transmutation Engine
  transmutation_engine: {
    id: "transmutation_engine",
    name: "Transmutation Engine",
    description:
      "Fuse mana and wealth systems into a high-end resource accelerator",
    type: "energyRegen",
    tree: "resource",
    level: 0,
    baseCost: 2600,
    scaling: 2.12,
    bonuses: [
      { percentBonusType: "energyRegeneration", percentBonusAmount: 0.22 },
      { percentBonusType: "goldIncome", percentBonusAmount: 0.12 },
      { percentBonusType: "intelligence", percentBonusAmount: 0.06 },
    ],
    prerequisites: ["leyline_tapping", "prism_sieves"],
    linkedUpgrades: [{ upgradeId: "singularity_bank", unlocksAtLevel: 5 }],
  },

  // Market Domination + Transmutation Engine -> Singularity Bank
  singularity_bank: {
    id: "singularity_bank",
    name: "Singularity Bank",
    description:
      "Endgame economy capstone with absurd growth and stronger combat conversion",
    type: "autoGold",
    tree: "resource",
    level: 0,
    baseCost: 8000,
    scaling: 2.22,
    bonuses: [
      { percentBonusType: "goldIncome", percentBonusAmount: 0.35 },
      { percentBonusType: "energyRegeneration", percentBonusAmount: 0.15 },
      { percentBonusType: "attack", percentBonusAmount: 0.08 },
    ],
    prerequisites: ["market_domination", "transmutation_engine"],
    linkedUpgrades: [],
  },

  // ===== MAGIC TREE =====
  // Root: Mage Talent
  mage_talent: {
    id: "mage_talent",
    name: "Mage Talent",
    description: "Increase intelligence by 10% per level",
    type: "attackBoost",
    tree: "magic",
    level: 0,
    baseCost: 75,
    scaling: 1.7,
    bonuses: [{ percentBonusType: "intelligence", percentBonusAmount: 0.1 }],
    prerequisites: [],
    linkedUpgrades: [
      { upgradeId: "arcane_knowledge", unlocksAtLevel: 1 },
      { upgradeId: "spellcraft", unlocksAtLevel: 3 },
    ],
  },

  // Mage Talent -> Arcane Knowledge
  arcane_knowledge: {
    id: "arcane_knowledge",
    name: "Arcane Knowledge",
    description: "Further increase intelligence by 5% per level",
    type: "attackBoost",
    tree: "magic",
    level: 0,
    baseCost: 120,
    scaling: 1.8,
    bonuses: [{ percentBonusType: "intelligence", percentBonusAmount: 0.05 }],
    prerequisites: ["mage_talent"],
    linkedUpgrades: [{ upgradeId: "mana_attunement", unlocksAtLevel: 2 }],
  },

  // Mage Talent (level 3) -> Spellcraft
  spellcraft: {
    id: "spellcraft",
    name: "Spellcraft",
    description: "Master spellcasting, increase intelligence by 3% per level",
    type: "attackBoost",
    tree: "magic",
    level: 0,
    baseCost: 150,
    scaling: 1.9,
    bonuses: [{ percentBonusType: "intelligence", percentBonusAmount: 0.03 }],
    prerequisites: ["mage_talent"],
    linkedUpgrades: [{ upgradeId: "battle_rituals", unlocksAtLevel: 2 }],
  },

  // Arcane Knowledge (level 2) -> Mana Attunement
  mana_attunement: {
    id: "mana_attunement",
    name: "Mana Attunement",
    description:
      "Synchronize with ambient mana to boost regen and magical throughput",
    type: "energyRegen",
    tree: "magic",
    level: 0,
    baseCost: 420,
    scaling: 1.95,
    bonuses: [
      { percentBonusType: "energyRegeneration", percentBonusAmount: 0.12 },
      { percentBonusType: "intelligence", percentBonusAmount: 0.06 },
    ],
    prerequisites: ["arcane_knowledge"],
    linkedUpgrades: [{ upgradeId: "temporal_echoes", unlocksAtLevel: 4 }],
  },

  // Spellcraft (level 2) -> Battle Rituals
  battle_rituals: {
    id: "battle_rituals",
    name: "Battle Rituals",
    description:
      "Convert raw magical talent into practical combat power each level",
    type: "attackBoost",
    tree: "magic",
    level: 0,
    baseCost: 460,
    scaling: 1.96,
    bonuses: [
      { percentBonusType: "attack", percentBonusAmount: 0.08 },
      { percentBonusType: "intelligence", percentBonusAmount: 0.05 },
    ],
    prerequisites: ["spellcraft"],
    linkedUpgrades: [{ upgradeId: "temporal_echoes", unlocksAtLevel: 3 }],
  },

  // Mana Attunement + Battle Rituals -> Temporal Echoes
  temporal_echoes: {
    id: "temporal_echoes",
    name: "Temporal Echoes",
    description:
      "Echo successful rotations to increase crit consistency and speed",
    type: "attackBoost",
    tree: "magic",
    level: 0,
    baseCost: 1600,
    scaling: 2.08,
    bonuses: [
      { percentBonusType: "critChance", percentBonusAmount: 0.12 },
      { percentBonusType: "agility", percentBonusAmount: 0.08 },
      { percentBonusType: "intelligence", percentBonusAmount: 0.08 },
    ],
    prerequisites: ["mana_attunement", "battle_rituals"],
    linkedUpgrades: [{ upgradeId: "astral_overdrive", unlocksAtLevel: 5 }],
  },

  // Temporal Echoes (level 5) -> Astral Overdrive
  astral_overdrive: {
    id: "astral_overdrive",
    name: "Astral Overdrive",
    description: "High-tier magical capstone for explosive hybrid scaling",
    type: "attackBoost",
    tree: "magic",
    level: 0,
    baseCost: 5200,
    scaling: 2.18,
    bonuses: [
      { percentBonusType: "intelligence", percentBonusAmount: 0.2 },
      { percentBonusType: "attack", percentBonusAmount: 0.12 },
      { percentBonusType: "energyRegeneration", percentBonusAmount: 0.15 },
    ],
    prerequisites: ["temporal_echoes"],
    linkedUpgrades: [],
  },

  // ===== FARMING TREE =====
  // Root: Plant Mastery
  plant_mastery: {
    id: "plant_mastery",
    name: "Plant Mastery",
    description: "Increase plant growth speed by 10% per level",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 80,
    scaling: 1.6,
    bonuses: [{ percentBonusType: "plantGrowth", percentBonusAmount: 0.1 }],
    prerequisites: [],
    linkedUpgrades: [
      { upgradeId: "better_watering", unlocksAtLevel: 1 },
      { upgradeId: "composting", unlocksAtLevel: 1 },
    ],
  },

  // Plant Mastery -> Better Watering
  better_watering: {
    id: "better_watering",
    name: "Better Watering",
    description: "Watering effects last 10% longer per level",
    type: "wateringDuration",
    tree: "farming",
    level: 0,
    baseCost: 100,
    scaling: 1.6,
    bonuses: [
      { percentBonusType: "wateringDuration", percentBonusAmount: 0.1 },
    ],
    prerequisites: ["plant_mastery"],
    linkedUpgrades: [{ upgradeId: "soil_aeration", unlocksAtLevel: 1 }],
  },

  // Plant Mastery -> Composting (parallel tier 2 branch)
  composting: {
    id: "composting",
    name: "Composting",
    description: "Enrich soil naturally to boost plant growth by 10% per level",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 110,
    scaling: 1.65,
    bonuses: [{ percentBonusType: "plantGrowth", percentBonusAmount: 0.1 }],
    prerequisites: ["plant_mastery"],
    linkedUpgrades: [
      { upgradeId: "soil_aeration", unlocksAtLevel: 1 },
      { upgradeId: "mycelium_network", unlocksAtLevel: 3 },
    ],
  },

  // Tier 3: requires both tier 2 branches at level 1
  soil_aeration: {
    id: "soil_aeration",
    name: "Soil Aeration",
    description: "Loosen the earth to improve plant growth by 8% per level",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 140,
    scaling: 1.7,
    bonuses: [{ percentBonusType: "plantGrowth", percentBonusAmount: 0.08 }],
    prerequisites: ["better_watering", "composting"],
    linkedUpgrades: [{ upgradeId: "greenhouse_design", unlocksAtLevel: 2 }],
  },

  // Soil Aeration (level 2) -> Greenhouse Design
  greenhouse_design: {
    id: "greenhouse_design",
    name: "Greenhouse Design",
    description:
      "Refine climate control to extend watering duration by 12% per level",
    type: "wateringDuration",
    tree: "farming",
    level: 0,
    baseCost: 220,
    scaling: 1.8,
    bonuses: [
      { percentBonusType: "wateringDuration", percentBonusAmount: 0.12 },
    ],
    prerequisites: ["soil_aeration"],
    linkedUpgrades: [{ upgradeId: "harvest_festival", unlocksAtLevel: 3 }],
  },

  // Greenhouse Design (level 3) -> Harvest Festival
  harvest_festival: {
    id: "harvest_festival",
    name: "Harvest Festival",
    description: "Celebrate abundance to boost plant growth by 15% per level",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 360,
    scaling: 1.95,
    bonuses: [{ percentBonusType: "plantGrowth", percentBonusAmount: 0.15 }],
    prerequisites: ["greenhouse_design"],
    linkedUpgrades: [{ upgradeId: "seedmaker_lab", unlocksAtLevel: 10 }],
  },

  // Harvest Festival (level 10) -> Seedmaker Lab
  seedmaker_lab: {
    id: "seedmaker_lab",
    name: "Seedmaker Lab",
    description:
      "Unlocks the Seedmaker in the garden and reduces seed crafting time each level",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 1250,
    scaling: 2.1,
    bonuses: [],
    prerequisites: ["harvest_festival"],
    linkedUpgrades: [{ upgradeId: "biome_fusion", unlocksAtLevel: 3 }],
  },

  // Composting (level 3) -> Mycelium Network
  mycelium_network: {
    id: "mycelium_network",
    name: "Mycelium Network",
    description:
      "Build underground nutrient webs for stronger sustained farm growth",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 780,
    scaling: 1.95,
    bonuses: [
      { percentBonusType: "plantGrowth", percentBonusAmount: 0.12 },
      { percentBonusType: "wateringDuration", percentBonusAmount: 0.08 },
    ],
    prerequisites: ["composting"],
    linkedUpgrades: [{ upgradeId: "biome_fusion", unlocksAtLevel: 4 }],
  },

  // Seedmaker Lab + Mycelium Network -> Biome Fusion
  biome_fusion: {
    id: "biome_fusion",
    name: "Biome Fusion",
    description:
      "Merge farming lanes into a high-output ecosystem with strong bonuses",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 2600,
    scaling: 2.08,
    bonuses: [
      { percentBonusType: "plantGrowth", percentBonusAmount: 0.2 },
      { percentBonusType: "wateringDuration", percentBonusAmount: 0.2 },
      { percentBonusType: "goldIncome", percentBonusAmount: 0.06 },
    ],
    prerequisites: ["seedmaker_lab", "mycelium_network"],
    linkedUpgrades: [{ upgradeId: "world_tree_grafting", unlocksAtLevel: 5 }],
  },

  // Biome Fusion (level 5) + Greenhouse Design -> World Tree Grafting
  world_tree_grafting: {
    id: "world_tree_grafting",
    name: "World Tree Grafting",
    description:
      "Late farming capstone with exceptional growth and cross-system rewards",
    type: "plantGrowth",
    tree: "farming",
    level: 0,
    baseCost: 7600,
    scaling: 2.2,
    bonuses: [
      { percentBonusType: "plantGrowth", percentBonusAmount: 0.32 },
      { percentBonusType: "wateringDuration", percentBonusAmount: 0.25 },
      { percentBonusType: "attack", percentBonusAmount: 0.06 },
      { percentBonusType: "goldIncome", percentBonusAmount: 0.12 },
    ],
    prerequisites: ["biome_fusion", "greenhouse_design"],
    linkedUpgrades: [],
  },

  // ===== EXPEDITION TREE =====
  // Root: Scouting Network
  scouting_network: {
    id: "scouting_network",
    name: "Scouting Network",
    description: "Deploy scouts to reveal profitable routes and easier targets",
    type: "attackBoost",
    tree: "expedition",
    level: 0,
    baseCost: 130,
    scaling: 1.72,
    bonuses: [
      { percentBonusType: "goldIncome", percentBonusAmount: 0.05 },
      { percentBonusType: "attack", percentBonusAmount: 0.04 },
    ],
    prerequisites: [],
    linkedUpgrades: [
      { upgradeId: "caravan_raids", unlocksAtLevel: 2 },
      { upgradeId: "map_fog_crusher", unlocksAtLevel: 4 },
    ],
  },

  // Scouting Network (level 2) -> Caravan Raids
  caravan_raids: {
    id: "caravan_raids",
    name: "Caravan Raids",
    description: "Turn route control into larger payouts and stronger battles",
    type: "autoGold",
    tree: "expedition",
    level: 0,
    baseCost: 340,
    scaling: 1.9,
    bonuses: [
      { percentBonusType: "goldIncome", percentBonusAmount: 0.1 },
      { percentBonusType: "attack", percentBonusAmount: 0.05 },
    ],
    prerequisites: ["scouting_network"],
    linkedUpgrades: [{ upgradeId: "bounty_syndicate", unlocksAtLevel: 4 }],
  },

  // Scouting Network (level 4) -> Map Fog Crusher
  map_fog_crusher: {
    id: "map_fog_crusher",
    name: "Map Fog Crusher",
    description:
      "Increase expedition precision for better speed and crit conversion",
    type: "attackBoost",
    tree: "expedition",
    level: 0,
    baseCost: 420,
    scaling: 1.92,
    bonuses: [
      { percentBonusType: "agility", percentBonusAmount: 0.1 },
      { percentBonusType: "critChance", percentBonusAmount: 0.08 },
    ],
    prerequisites: ["scouting_network"],
    linkedUpgrades: [{ upgradeId: "bounty_syndicate", unlocksAtLevel: 3 }],
  },

  // Caravan Raids + Map Fog Crusher -> Bounty Syndicate
  bounty_syndicate: {
    id: "bounty_syndicate",
    name: "Bounty Syndicate",
    description:
      "Leverage expedition dominance for premium rewards and combat pressure",
    type: "autoGold",
    tree: "expedition",
    level: 0,
    baseCost: 1900,
    scaling: 2.08,
    bonuses: [
      { percentBonusType: "goldIncome", percentBonusAmount: 0.18 },
      { percentBonusType: "attack", percentBonusAmount: 0.08 },
      { percentBonusType: "critChance", percentBonusAmount: 0.08 },
    ],
    prerequisites: ["caravan_raids", "map_fog_crusher"],
    linkedUpgrades: [{ upgradeId: "void_contracts", unlocksAtLevel: 5 }],
  },

  // Bounty Syndicate + Gem Hunter -> Void Contracts
  void_contracts: {
    id: "void_contracts",
    name: "Void Contracts",
    description:
      "Cross-tree capstone that turns rare expedition contracts into major gains",
    type: "autoGold",
    tree: "expedition",
    level: 0,
    baseCost: 6000,
    scaling: 2.18,
    bonuses: [
      { percentBonusType: "goldIncome", percentBonusAmount: 0.28 },
      { percentBonusType: "energyRegeneration", percentBonusAmount: 0.12 },
      { percentBonusType: "attack", percentBonusAmount: 0.1 },
      { percentBonusType: "intelligence", percentBonusAmount: 0.08 },
    ],
    prerequisites: ["bounty_syndicate", "gem_hunter"],
    linkedUpgrades: [],
  },
};

/**
 * Get an upgrade definition by ID
 */
export function getUpgradeDef(upgradeId: string): Upgrade | null {
  return upgradeDefinitions[upgradeId] ?? null;
}

/**
 * Check if an upgrade's prerequisites are met
 */
export function areUpgradePrerequisitesMet(
  state: GameState,
  upgradeId: string,
): boolean {
  const upgradeDef = getUpgradeDef(upgradeId);
  if (!upgradeDef || !upgradeDef.prerequisites) return true;

  return upgradeDef.prerequisites.every((prerequisiteId) => {
    const prerequisiteUpgrade = state.upgrades.find(
      (u) => u.id === prerequisiteId,
    );
    return prerequisiteUpgrade && prerequisiteUpgrade.level > 0;
  });
}

/**
 * Check if an upgrade is unlocked by linked upgrades
 */
export function isUpgradeUnlocked(
  state: GameState,
  upgradeId: string,
): boolean {
  const upgradeDef = getUpgradeDef(upgradeId);
  if (!upgradeDef) return false;

  // If no prerequisites, it's unlocked by default
  if (!upgradeDef.prerequisites || upgradeDef.prerequisites.length === 0) {
    return true;
  }

  // Check if all prerequisites are met and satisfy linked unlock thresholds.
  return (upgradeDef.prerequisites ?? []).every((prerequisiteId) => {
    const prerequisiteUpgrade = state.upgrades.find(
      (u) => u.id === prerequisiteId,
    );
    const prerequisiteLevel = prerequisiteUpgrade?.level ?? 0;
    if (prerequisiteLevel <= 0) return false;

    const prerequisiteDef = getUpgradeDef(prerequisiteId);
    const linkedRequirement = prerequisiteDef?.linkedUpgrades?.find(
      (linked) => linked.upgradeId === upgradeId,
    );

    if (!linkedRequirement) {
      return true;
    }

    const requiredLevel = linkedRequirement.unlocksAtLevel ?? 1;
    return prerequisiteLevel >= requiredLevel;
  });
}

/**
 * Get all upgrades that are unlocked by a specific upgrade reaching a certain level
 */
export function getUnlockedUpgrades(
  state: GameState,
  upgradeId: string,
): string[] {
  const unlockedIds: string[] = [];
  const parentUpgrade = state.upgrades.find((u) => u.id === upgradeId);

  if (!parentUpgrade) return unlockedIds;

  const parentDef = getUpgradeDef(upgradeId);
  if (!parentDef || !parentDef.linkedUpgrades) return unlockedIds;

  for (const linked of parentDef.linkedUpgrades) {
    const requiredLevel = linked.unlocksAtLevel ?? 1;
    if (parentUpgrade.level >= requiredLevel) {
      unlockedIds.push(linked.upgradeId);
    }
  }

  return unlockedIds;
}

/**
 * Get all upgrades organized by tree
 */
export function getUpgradesByTree(tree: string): Upgrade[] {
  return Object.values(upgradeDefinitions).filter((u) => u.tree === tree);
}

/**
 * Get all available upgrade trees
 */
export function getUpgradeTrees(): string[] {
  const trees = new Set(Object.values(upgradeDefinitions).map((u) => u.tree));
  return Array.from(trees);
}

/**
 * Check if player has purchased an upgrade and get its level
 */
export function getUpgradeLevel(state: GameState, upgradeId: string): number {
  const upgrade = state.upgrades.find((u) => u.id === upgradeId);
  return upgrade?.level ?? 0;
}

/**
 * Purchase an upgrade (if enough gold/resources)
 */
export function buyUpgrade(state: GameState, upgradeId: string): GameState {
  const def = getUpgradeDef(upgradeId);
  if (!def) return state;

  // Prevent bypassing prerequisite or linked unlock rules.
  if (!isUpgradeUnlocked(state, upgradeId)) return state;

  const currentLevel = getUpgradeLevel(state, upgradeId);
  const cost = Math.ceil(def.baseCost * Math.pow(def.scaling, currentLevel));

  // Check if enough gold
  if (state.resources.gold < cost) return state;

  // Find existing upgrade or create new one
  const existingIndex = state.upgrades.findIndex((u) => u.id === upgradeId);
  let newUpgrades = [...state.upgrades];

  if (existingIndex !== -1) {
    // Level up existing upgrade
    newUpgrades[existingIndex] = {
      ...newUpgrades[existingIndex],
      level: newUpgrades[existingIndex].level + 1,
    };
  } else {
    // Create new upgrade
    newUpgrades.push({
      ...def,
      level: 1,
    });
  }

  return {
    ...state,
    resources: {
      ...state.resources,
      gold: state.resources.gold - cost,
    },
    upgrades: newUpgrades,
  };
}
