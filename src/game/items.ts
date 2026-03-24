import { addItem } from "./engine";
import type { GameState, ItemDefinition } from "./types";

export const itemDefinitions: Record<string, ItemDefinition> = {
  // Weapons - Common
  sword_1: {
    id: "sword_1",
    name: "Rusty Sword",
    type: "weapon",
    rarity: "common",
    stats: { attack: 5 },
    sellPrice: 50,
  },
  // Weapons - Rare
  hammer_1: {
    id: "hammer_1",
    name: "Iron Hammer",
    type: "weapon",
    rarity: "rare",
    stats: { attack: 16, defense: 4 },
    sellPrice: 75,
  },
  storm_blade: {
    id: "storm_blade",
    name: "Storm Blade",
    type: "weapon",
    rarity: "rare",
    stats: { attack: 22, agility: 6, critChance: 4 },
    sellPrice: 140,
  },
  // Weapons - Epic
  greataxe_1: {
    id: "greataxe_1",
    name: "Great Axe",
    type: "weapon",
    rarity: "epic",
    stats: { attack: 85, defense: 18, critChance: 8 },
    sellPrice: 200,
  },
  sunlance: {
    id: "sunlance",
    name: "Sunlance",
    type: "weapon",
    rarity: "epic",
    stats: { attack: 96, intelligence: 52, critChance: 10 },
    sellPrice: 320,
  },
  // Weapons - Legendary
  excalibur: {
    id: "excalibur",
    name: "Excalibur",
    type: "weapon",
    rarity: "legendary",
    stats: { attack: 2200, critChance: 42, agility: 70 },
    sellPrice: 500,
  },
  titan_cleaver: {
    id: "titan_cleaver",
    name: "Titan Cleaver",
    type: "weapon",
    rarity: "legendary",
    stats: { attack: 2800, hp: 1200, defense: 340 },
    sellPrice: 900,
  },
  astral_halberd: {
    id: "astral_halberd",
    name: "Astral Halberd",
    type: "weapon",
    rarity: "legendary",
    stats: { attack: 2600, intelligence: 850, critChance: 55 },
    sellPrice: 940,
  },
  // Weapons - Unique
  soul_edge: {
    id: "soul_edge",
    name: "Voidborn Fang",
    type: "weapon",
    rarity: "unique",
    setId: "voidborn",
    stats: { attack: 125000, intelligence: 34000, critChance: 180 },
    sellPrice: 750,
  },
  starforged_maul: {
    id: "starforged_maul",
    name: "Arcaneforge Maul",
    type: "weapon",
    rarity: "unique",
    setId: "arcaneforge",
    stats: { attack: 118000, intelligence: 46000, energyRegeneration: 220 },
    sellPrice: 1800,
  },
  worldroot_scythe: {
    id: "worldroot_scythe",
    name: "Verdant Scythe",
    type: "weapon",
    rarity: "unique",
    setId: "verdant",
    stats: { attack: 98000, plantGrowth: 260, wateringDuration: 180 },
    sellPrice: 1750,
  },
  ravenous_fang: {
    id: "ravenous_fang",
    name: "Beastlord Fang",
    type: "weapon",
    rarity: "unique",
    setId: "beastlord",
    stats: { attack: 132000, agility: 420, critChance: 210 },
    sellPrice: 1900,
  },
  bloodletter_blade: {
    id: "bloodletter_blade",
    name: "Bloodletter Blade",
    type: "weapon",
    rarity: "unique",
    setId: "bloodletter",
    stats: { attack: 128000, agility: 380, intelligence: 18000 },
    sellPrice: 1920,
  },

  // Armor - Common
  armor_1: {
    id: "armor_1",
    name: "Cloth Armor",
    type: "armor",
    rarity: "common",
    stats: { defense: 3 },
    sellPrice: 40,
  },
  // Armor - Rare
  shield_1: {
    id: "shield_1",
    name: "Wooden Shield",
    type: "armor",
    rarity: "rare",
    stats: { defense: 18, hp: 90 },
    sellPrice: 60,
  },
  chainmail_aegis: {
    id: "chainmail_aegis",
    name: "Chainmail Aegis",
    type: "armor",
    rarity: "rare",
    stats: { defense: 24, hp: 140, attack: 6 },
    sellPrice: 130,
  },
  // Armor - Epic
  plate_armor: {
    id: "plate_armor",
    name: "Plate Armor",
    type: "armor",
    rarity: "epic",
    stats: { defense: 95, hp: 420, attack: 26 },
    sellPrice: 250,
  },
  runesteel_plate: {
    id: "runesteel_plate",
    name: "Runesteel Plate",
    type: "armor",
    rarity: "epic",
    stats: { defense: 120, hp: 560, intelligence: 48 },
    sellPrice: 350,
  },
  // Armor - Legendary
  excalibur_armor: {
    id: "excalibur_armor",
    name: "Holy Plate Mail",
    type: "armor",
    rarity: "legendary",
    stats: { defense: 2100, hp: 9800, intelligence: 420 },
    sellPrice: 450,
  },
  aegis_of_ages: {
    id: "aegis_of_ages",
    name: "Aegis of Ages",
    type: "armor",
    rarity: "legendary",
    stats: { defense: 2600, hp: 12000, attack: 400 },
    sellPrice: 920,
  },
  celestial_bulwark: {
    id: "celestial_bulwark",
    name: "Celestial Bulwark",
    type: "armor",
    rarity: "legendary",
    stats: { defense: 2400, hp: 10400, energyRegeneration: 140 },
    sellPrice: 940,
  },
  // Armor - Unique
  void_armor: {
    id: "void_armor",
    name: "Voidborn Plate",
    type: "armor",
    rarity: "unique",
    setId: "voidborn",
    stats: { defense: 76000, hp: 260000, intelligence: 36000 },
    sellPrice: 800,
  },
  chrono_bastion: {
    id: "chrono_bastion",
    name: "Arcaneforge Bastion",
    type: "armor",
    rarity: "unique",
    setId: "arcaneforge",
    stats: { defense: 68000, hp: 240000, energyRegeneration: 420 },
    sellPrice: 1760,
  },
  nightweave_carapace: {
    id: "nightweave_carapace",
    name: "Verdant Carapace",
    type: "armor",
    rarity: "unique",
    setId: "verdant",
    stats: { defense: 64000, hp: 220000, plantGrowth: 360 },
    sellPrice: 1740,
  },
  predator_mail: {
    id: "predator_mail",
    name: "Beastlord Mail",
    type: "armor",
    rarity: "unique",
    setId: "beastlord",
    stats: { defense: 82000, hp: 280000, agility: 420 },
    sellPrice: 1880,
  },
  bloodletter_garb: {
    id: "bloodletter_garb",
    name: "Bloodletter Garb",
    type: "armor",
    rarity: "unique",
    setId: "bloodletter",
    stats: { defense: 70000, hp: 250000, agility: 440, attack: 46000 },
    sellPrice: 1890,
  },

  // Accessories - Common
  ring_1: {
    id: "ring_1",
    name: "Old Ring",
    type: "accessory",
    rarity: "common",
    stats: { attack: 1 },
    sellPrice: 30,
  },
  // Accessories - Rare
  amulet_1: {
    id: "amulet_1",
    name: "Crystal Amulet",
    type: "accessory",
    rarity: "rare",
    stats: { intelligence: 14, attack: 6, critChance: 3 },
    sellPrice: 100,
  },
  battle_charm: {
    id: "battle_charm",
    name: "Battle Charm",
    type: "accessory",
    rarity: "rare",
    stats: { attack: 16, critChance: 8, agility: 10 },
    sellPrice: 150,
  },
  // Accessories - Epic
  dragon_ring: {
    id: "dragon_ring",
    name: "Dragon Ring",
    type: "accessory",
    rarity: "epic",
    stats: { attack: 70, defense: 42, critChance: 12 },
    sellPrice: 180,
  },
  mindspire_talisman: {
    id: "mindspire_talisman",
    name: "Mindspire Talisman",
    type: "accessory",
    rarity: "epic",
    stats: { attack: 62, intelligence: 110, energyRegeneration: 40 },
    sellPrice: 310,
  },
  // Accessories - Legendary
  infinity_gem: {
    id: "infinity_gem",
    name: "Infinity Gem",
    type: "accessory",
    rarity: "legendary",
    stats: { attack: 1900, defense: 980, intelligence: 1800, critChance: 48 },
    sellPrice: 400,
  },
  sovereign_signet: {
    id: "sovereign_signet",
    name: "Sovereign Signet",
    type: "accessory",
    rarity: "legendary",
    stats: { attack: 2100, goldIncome: 160, critChance: 52 },
    sellPrice: 920,
  },
  comet_locket: {
    id: "comet_locket",
    name: "Comet Locket",
    type: "accessory",
    rarity: "legendary",
    stats: { intelligence: 2200, energyRegeneration: 180, attack: 1400 },
    sellPrice: 930,
  },
  // Accessories - Unique
  chaos_emerald: {
    id: "chaos_emerald",
    name: "Voidborn Sigil",
    type: "accessory",
    rarity: "unique",
    setId: "voidborn",
    stats: { attack: 88000, intelligence: 70000, critChance: 210 },
    sellPrice: 600,
  },
  eclipse_prism: {
    id: "eclipse_prism",
    name: "Arcaneforge Prism",
    type: "accessory",
    rarity: "unique",
    setId: "arcaneforge",
    stats: { attack: 76000, intelligence: 92000, energyRegeneration: 420 },
    sellPrice: 1700,
  },
  worldheart_orb: {
    id: "worldheart_orb",
    name: "Verdant Orb",
    type: "accessory",
    rarity: "unique",
    setId: "verdant",
    stats: { attack: 65000, goldIncome: 480, plantGrowth: 420 },
    sellPrice: 1680,
  },
  warpack_totem: {
    id: "warpack_totem",
    name: "Beastlord Totem",
    type: "accessory",
    rarity: "unique",
    setId: "beastlord",
    stats: { attack: 94000, agility: 520, petStrength: 280 },
    sellPrice: 1860,
  },
  bloodmark_charm: {
    id: "bloodmark_charm",
    name: "Bloodmark Charm",
    type: "accessory",
    rarity: "unique",
    setId: "bloodletter",
    stats: { attack: 91000, agility: 360, critChance: 120 },
    sellPrice: 1870,
  },

  // Tools - Common
  pickaxe_1: {
    id: "pickaxe_1",
    name: "Stone Pickaxe",
    type: "tool",
    rarity: "common",
    stats: { attack: 2 },
    sellPrice: 30,
  },
  // Tools - Rare
  iron_pickaxe: {
    id: "iron_pickaxe",
    name: "Iron Pickaxe",
    type: "tool",
    rarity: "rare",
    stats: { attack: 5 },
    sellPrice: 80,
  },
  // Tools - Epic
  mithril_pickaxe: {
    id: "mithril_pickaxe",
    name: "Mithril Pickaxe",
    type: "tool",
    rarity: "epic",
    stats: { attack: 10 },
    sellPrice: 220,
  },
  shovel_1: {
    id: "shovel_1",
    name: "Garden Shovel",
    type: "tool",
    rarity: "common",
    stats: { attack: 1 },
    sellPrice: 30,
  },
  iron_shovel: {
    id: "iron_shovel",
    name: "Iron Shovel",
    type: "tool",
    rarity: "rare",
    stats: { attack: 3 },
    sellPrice: 90,
  },
  mithril_shovel: {
    id: "mithril_shovel",
    name: "Mithril Shovel",
    type: "tool",
    rarity: "epic",
    stats: { attack: 6 },
    sellPrice: 240,
  },

  // Watering Cans
  wateringcan_common: {
    id: "wateringcan_common",
    name: "Watering Can",
    type: "tool",
    rarity: "common",
    stats: { attack: 1 },
    sellPrice: 25,
  },
  wateringcan_rare: {
    id: "wateringcan_rare",
    name: "Copper Watering Can",
    type: "tool",
    rarity: "rare",
    stats: { attack: 2 },
    sellPrice: 70,
  },
  wateringcan_epic: {
    id: "wateringcan_epic",
    name: "Mithril Watering Can",
    type: "tool",
    rarity: "epic",
    stats: { attack: 4 },
    sellPrice: 180,
  },
  wateringcan_legendary: {
    id: "wateringcan_legendary",
    name: "Royal Watering Can",
    type: "tool",
    rarity: "legendary",
    stats: { attack: 7 },
    sellPrice: 360,
  },
  wateringcan_unique: {
    id: "wateringcan_unique",
    name: "Verdant Watering Can",
    type: "tool",
    rarity: "unique",
    setId: "verdant",
    stats: { attack: 10 },
    sellPrice: 700,
  },

  // Scythes
  scythe_common: {
    id: "scythe_common",
    name: "Rusty Scythe",
    type: "tool",
    rarity: "common",
    stats: { attack: 2 },
    sellPrice: 35,
  },
  scythe_rare: {
    id: "scythe_rare",
    name: "Curved Scythe",
    type: "tool",
    rarity: "rare",
    stats: { attack: 5 },
    sellPrice: 85,
  },
  scythe_epic: {
    id: "scythe_epic",
    name: "Harvest Scythe",
    type: "tool",
    rarity: "epic",
    stats: { attack: 9 },
    sellPrice: 200,
  },
  scythe_legendary: {
    id: "scythe_legendary",
    name: "Reaper's Scythe",
    type: "tool",
    rarity: "legendary",
    stats: { attack: 14 },
    sellPrice: 420,
  },
  scythe_unique: {
    id: "scythe_unique",
    name: "Verdant Reaper",
    type: "tool",
    rarity: "unique",
    setId: "verdant",
    stats: { attack: 20 },
    sellPrice: 900,
  },

  // Seed Bags
  seedbag_common: {
    id: "seedbag_common",
    name: "Seed Bag",
    type: "tool",
    rarity: "common",
    sellPrice: 30,
  },
  seedbag_rare: {
    id: "seedbag_rare",
    name: "Seed Satchel",
    type: "tool",
    rarity: "rare",
    sellPrice: 90,
  },
  seedbag_epic: {
    id: "seedbag_epic",
    name: "Planter Pack",
    type: "tool",
    rarity: "epic",
    sellPrice: 220,
  },
  seedbag_legendary: {
    id: "seedbag_legendary",
    name: "Verdant Vault",
    type: "tool",
    rarity: "legendary",
    sellPrice: 420,
  },
  seedbag_unique: {
    id: "seedbag_unique",
    name: "Verdant Seed Cache",
    type: "tool",
    rarity: "unique",
    setId: "verdant",
    sellPrice: 800,
  },

  // Sprinklers
  sprinkler_common: {
    id: "sprinkler_common",
    name: "Basic Sprinkler",
    type: "tool",
    rarity: "common",
    sellPrice: 20,
  },
  sprinkler_rare: {
    id: "sprinkler_rare",
    name: "Standard Sprinkler",
    type: "tool",
    rarity: "rare",
    sellPrice: 60,
  },
  sprinkler_epic: {
    id: "sprinkler_epic",
    name: "Advanced Sprinkler",
    type: "tool",
    rarity: "epic",
    sellPrice: 150,
  },
  sprinkler_legendary: {
    id: "sprinkler_legendary",
    name: "Master Sprinkler",
    type: "tool",
    rarity: "legendary",
    sellPrice: 320,
  },
  sprinkler_unique: {
    id: "sprinkler_unique",
    name: "Verdant Sprinkler",
    type: "tool",
    rarity: "unique",
    setId: "verdant",
    sellPrice: 600,
  },

  // Harvesters
  harvester_common: {
    id: "harvester_common",
    name: "Basic Harvester",
    type: "tool",
    rarity: "common",
    sellPrice: 30,
  },
  harvester_rare: {
    id: "harvester_rare",
    name: "Field Harvester",
    type: "tool",
    rarity: "rare",
    sellPrice: 85,
  },
  harvester_epic: {
    id: "harvester_epic",
    name: "Pulse Harvester",
    type: "tool",
    rarity: "epic",
    sellPrice: 220,
  },
  harvester_legendary: {
    id: "harvester_legendary",
    name: "Royal Harvester",
    type: "tool",
    rarity: "legendary",
    sellPrice: 430,
  },
  harvester_unique: {
    id: "harvester_unique",
    name: "Verdant Harvester",
    type: "tool",
    rarity: "unique",
    setId: "verdant",
    sellPrice: 900,
  },

  // Planters
  planter_common: {
    id: "planter_common",
    name: "Basic Planter",
    type: "tool",
    rarity: "common",
    sellPrice: 30,
  },
  planter_rare: {
    id: "planter_rare",
    name: "Field Planter",
    type: "tool",
    rarity: "rare",
    sellPrice: 85,
  },
  planter_epic: {
    id: "planter_epic",
    name: "Pulse Planter",
    type: "tool",
    rarity: "epic",
    sellPrice: 220,
  },
  planter_legendary: {
    id: "planter_legendary",
    name: "Royal Planter",
    type: "tool",
    rarity: "legendary",
    sellPrice: 430,
  },
  planter_unique: {
    id: "planter_unique",
    name: "Verdant Planter",
    type: "tool",
    rarity: "unique",
    setId: "verdant",
    sellPrice: 900,
  },

  // Potions - Common
  health_potion: {
    id: "health_potion",
    name: "Health Potion",
    type: "potion",
    rarity: "common",
    sellPrice: 20,
  },
  // Potions - Rare
  mana_potion: {
    id: "mana_potion",
    name: "Mana Potion",
    type: "potion",
    rarity: "rare",
    stats: { intelligence: 2 },
    sellPrice: 50,
  },
  // Potions - Epic
  elixir: {
    id: "elixir",
    name: "Elixir of Power",
    type: "potion",
    rarity: "epic",
    stats: { attack: 3, intelligence: 3 },
    sellPrice: 150,
  },
  // Potions - Legendary
  immortal_brew: {
    id: "immortal_brew",
    name: "Immortal Brew",
    type: "potion",
    rarity: "legendary",
    stats: { attack: 8, defense: 8, intelligence: 8 },
    sellPrice: 300,
  },
  // Potions - Rare (new)
  swift_tonic: {
    id: "swift_tonic",
    name: "Swift Tonic",
    type: "potion",
    rarity: "rare",
    sellPrice: 45,
  },
  fortitude_brew: {
    id: "fortitude_brew",
    name: "Brew of Fortitude",
    type: "potion",
    rarity: "rare",
    stats: { defense: 3 },
    sellPrice: 55,
  },
  // Potions - Epic (new)
  scholars_draught: {
    id: "scholars_draught",
    name: "Scholar's Draught",
    type: "potion",
    rarity: "epic",
    stats: { intelligence: 5 },
    sellPrice: 180,
  },
  berserkers_tonic: {
    id: "berserkers_tonic",
    name: "Berserker's Tonic",
    type: "potion",
    rarity: "epic",
    stats: { attack: 10, defense: -3 },
    sellPrice: 160,
  },
  // Potions - Unique (new)
  chaos_potion: {
    id: "chaos_potion",
    name: "Voidborn Elixir",
    type: "potion",
    rarity: "unique",
    setId: "voidborn",
    sellPrice: 500,
  },

  // Seeds aligned with garden crop configuration
  sunflower_seed_common: {
    id: "sunflower_seed_common",
    name: "Sunflower Seed",
    type: "seed",
    rarity: "common",
    sellPrice: 5,
  },
  carrot_seed_common: {
    id: "carrot_seed_common",
    name: "Carrot Seed",
    type: "seed",
    rarity: "common",
    sellPrice: 5,
  },
  apple_seed_common: {
    id: "apple_seed_common",
    name: "Apple Seed",
    type: "seed",
    rarity: "common",
    sellPrice: 5,
  },
  mint_seed_common: {
    id: "mint_seed_common",
    name: "Mint Seed",
    type: "seed",
    rarity: "common",
    sellPrice: 5,
  },
  wheat_seed_common: {
    id: "wheat_seed_common",
    name: "Wheat Seed",
    type: "seed",
    rarity: "common",
    sellPrice: 5,
  },
  grape_seed_common: {
    id: "grape_seed_common",
    name: "Grape Seed",
    type: "seed",
    rarity: "common",
    sellPrice: 5,
  },
  rose_seed_rare: {
    id: "rose_seed_rare",
    name: "Rose Seed",
    type: "seed",
    rarity: "rare",
    sellPrice: 15,
  },
  cabbage_seed_rare: {
    id: "cabbage_seed_rare",
    name: "Cabbage Seed",
    type: "seed",
    rarity: "rare",
    sellPrice: 15,
  },
  berry_seed_rare: {
    id: "berry_seed_rare",
    name: "Berry Seed",
    type: "seed",
    rarity: "rare",
    sellPrice: 15,
  },
  corn_seed_rare: {
    id: "corn_seed_rare",
    name: "Corn Seed",
    type: "seed",
    rarity: "rare",
    sellPrice: 15,
  },
  // Seeds - Epic
  moonflower_seed: {
    id: "moonflower_seed",
    name: "Moonflower Seed",
    type: "seed",
    rarity: "epic",
    stats: { intelligence: 1 },
    sellPrice: 40,
  },
  // Seeds - Legendary
  yggdrasil_seed: {
    id: "yggdrasil_seed",
    name: "Yggdrasil Seed",
    type: "seed",
    rarity: "legendary",
    stats: { attack: 5, defense: 5 },
    sellPrice: 200,
  },

  // Pets - Common
  wolf_pup: {
    id: "wolf_pup",
    name: "Wolf Pup",
    type: "pet",
    rarity: "common",
    stats: { attack: 2 },
    sellPrice: 60,
    petBonus: { bonusType: "attack", bonusAmount: 0.05 }, // 5% attack bonus per level
  },
  // Pets - Rare
  fire_fox: {
    id: "fire_fox",
    name: "Fire Fox",
    type: "pet",
    rarity: "rare",
    stats: { attack: 16, intelligence: 12 },
    sellPrice: 120,
    petBonus: { bonusType: "goldIncome", bonusAmount: 0.1 }, // 10% gold income bonus per level
  },
  thunder_lynx: {
    id: "thunder_lynx",
    name: "Thunder Lynx",
    type: "pet",
    rarity: "rare",
    stats: { attack: 24, agility: 14, critChance: 6 },
    sellPrice: 170,
    petBonus: { bonusType: "attack", bonusAmount: 0.14 },
  },
  // Pets - Epic
  ice_dragon: {
    id: "ice_dragon",
    name: "Ice Dragon",
    type: "pet",
    rarity: "epic",
    stats: { attack: 120, defense: 90, intelligence: 90 },
    sellPrice: 400,
    petBonus: { bonusType: "defense", bonusAmount: 0.12 }, // 12% defense bonus per level
  },
  storm_griffin: {
    id: "storm_griffin",
    name: "Storm Griffin",
    type: "pet",
    rarity: "epic",
    stats: { attack: 150, agility: 80, critChance: 24 },
    sellPrice: 520,
    petBonus: { bonusType: "agility", bonusAmount: 0.2 },
  },
  // Pets - Legendary
  phoenix: {
    id: "phoenix",
    name: "Phoenix",
    type: "pet",
    rarity: "legendary",
    stats: { attack: 2600, intelligence: 2100, energyRegeneration: 180 },
    sellPrice: 600,
    petBonus: { bonusType: "intelligence", bonusAmount: 0.15 }, // 15% intelligence bonus per level
  },
  astral_phoenix: {
    id: "astral_phoenix",
    name: "Astral Phoenix",
    type: "pet",
    rarity: "legendary",
    stats: { attack: 3200, intelligence: 2600, critChance: 60 },
    sellPrice: 1200,
    petBonus: { bonusType: "energyRegeneration", bonusAmount: 0.32 },
  },
  // Pets - Unique
  void_beast: {
    id: "void_beast",
    name: "Voidborn Beast",
    type: "pet",
    rarity: "unique",
    setId: "voidborn",
    stats: { attack: 110000, defense: 52000, intelligence: 56000 },
    sellPrice: 1000,
    petBonus: { bonusType: "attack", bonusAmount: 0.95 },
  },
  astral_wolf: {
    id: "astral_wolf",
    name: "Arcaneforge Wolf",
    type: "pet",
    rarity: "unique",
    setId: "arcaneforge",
    stats: { attack: 98000, intelligence: 84000, energyRegeneration: 480 },
    sellPrice: 2000,
    petBonus: { bonusType: "intelligence", bonusAmount: 1.05 },
  },
  grove_colossus: {
    id: "grove_colossus",
    name: "Verdant Colossus",
    type: "pet",
    rarity: "unique",
    setId: "verdant",
    stats: { attack: 86000, hp: 320000, plantGrowth: 480 },
    sellPrice: 1980,
    petBonus: { bonusType: "plantGrowth", bonusAmount: 1.2 },
  },
  storm_hydra: {
    id: "storm_hydra",
    name: "Beastlord Hydra",
    type: "pet",
    rarity: "unique",
    setId: "beastlord",
    stats: { attack: 126000, defense: 68000, agility: 520 },
    sellPrice: 2100,
    petBonus: { bonusType: "attack", bonusAmount: 1.3 },
  },
  blood_raptor: {
    id: "blood_raptor",
    name: "Blood Raptor",
    type: "pet",
    rarity: "unique",
    setId: "bloodletter",
    stats: { attack: 122000, agility: 640, intelligence: 28000 },
    sellPrice: 2120,
    petBonus: { bonusType: "agility", bonusAmount: 1.35 },
  },
};

export function getItemDefSafe(itemId: string): ItemDefinition | null {
  return itemDefinitions[itemId] ?? null;
}

export function addDebugItems(state: GameState) {
  // Starter seeds
  let newState = addItem(state, "sunflower_seed_common", 10);
  newState = addItem(newState, "carrot_seed_common", 10);
  newState = addItem(newState, "apple_seed_common", 10);
  newState = addItem(newState, "mint_seed_common", 10);
  newState = addItem(newState, "wheat_seed_common", 10);
  newState = addItem(newState, "grape_seed_common", 10);
  // Weapons
  newState = addItem(newState, "sword_1");
  newState = addItem(newState, "armor_1");
  newState = addItem(newState, "ring_1");
  newState = addItem(newState, "hammer_1");
  newState = addItem(newState, "storm_blade");
  newState = addItem(newState, "shield_1");
  newState = addItem(newState, "chainmail_aegis");
  newState = addItem(newState, "amulet_1");
  newState = addItem(newState, "battle_charm");
  newState = addItem(newState, "pickaxe_1");
  newState = addItem(newState, "shovel_1");
  newState = addItem(newState, "wateringcan_common");
  newState = addItem(newState, "scythe_common");
  newState = addItem(newState, "seedbag_common");
  // Epic rarities
  newState = addItem(newState, "greataxe_1");
  newState = addItem(newState, "sunlance");
  newState = addItem(newState, "plate_armor");
  newState = addItem(newState, "runesteel_plate");
  newState = addItem(newState, "dragon_ring");
  newState = addItem(newState, "mindspire_talisman");
  newState = addItem(newState, "mithril_pickaxe");
  newState = addItem(newState, "iron_shovel");
  newState = addItem(newState, "mithril_shovel");
  newState = addItem(newState, "wateringcan_rare");
  newState = addItem(newState, "wateringcan_epic");
  newState = addItem(newState, "scythe_rare");
  newState = addItem(newState, "scythe_epic");
  newState = addItem(newState, "seedbag_rare");
  newState = addItem(newState, "seedbag_epic");
  newState = addItem(newState, "sprinkler_common");
  newState = addItem(newState, "sprinkler_rare");
  newState = addItem(newState, "sprinkler_epic");
  newState = addItem(newState, "sprinkler_legendary");
  newState = addItem(newState, "sprinkler_unique");
  newState = addItem(newState, "harvester_common");
  newState = addItem(newState, "harvester_rare");
  newState = addItem(newState, "harvester_epic");
  newState = addItem(newState, "harvester_legendary");
  newState = addItem(newState, "harvester_unique");
  newState = addItem(newState, "planter_common");
  newState = addItem(newState, "planter_rare");
  newState = addItem(newState, "planter_epic");
  newState = addItem(newState, "planter_legendary");
  newState = addItem(newState, "planter_unique");
  newState = addItem(newState, "wateringcan_legendary");
  newState = addItem(newState, "wateringcan_unique");
  newState = addItem(newState, "scythe_legendary");
  newState = addItem(newState, "scythe_unique");
  newState = addItem(newState, "seedbag_legendary");
  newState = addItem(newState, "seedbag_unique");
  // Legendary rarities
  newState = addItem(newState, "excalibur");
  newState = addItem(newState, "titan_cleaver");
  newState = addItem(newState, "astral_halberd");
  newState = addItem(newState, "excalibur_armor");
  newState = addItem(newState, "aegis_of_ages");
  newState = addItem(newState, "celestial_bulwark");
  newState = addItem(newState, "infinity_gem");
  newState = addItem(newState, "sovereign_signet");
  newState = addItem(newState, "comet_locket");
  // Unique set items
  for (const itemDef of Object.values(itemDefinitions)) {
    if (itemDef.rarity === "unique" && itemDef.setId) {
      newState = addItem(newState, itemDef.id);
    }
  }
  // Potions
  newState = addItem(newState, "health_potion");
  newState = addItem(newState, "mana_potion");
  newState = addItem(newState, "elixir");
  newState = addItem(newState, "immortal_brew");
  newState = addItem(newState, "swift_tonic");
  newState = addItem(newState, "fortitude_brew");
  newState = addItem(newState, "scholars_draught");
  newState = addItem(newState, "berserkers_tonic");
  newState = addItem(newState, "chaos_potion");
  // Seeds
  // Keep debug seeds aligned to implemented crop definitions only.
  // Pets
  newState = addItem(newState, "wolf_pup");
  newState = addItem(newState, "fire_fox");
  newState = addItem(newState, "thunder_lynx");
  newState = addItem(newState, "ice_dragon");
  newState = addItem(newState, "storm_griffin");
  newState = addItem(newState, "phoenix");
  newState = addItem(newState, "astral_phoenix");
  newState = addItem(newState, "void_beast");
  newState = addItem(newState, "astral_wolf");
  newState = addItem(newState, "grove_colossus");
  newState = addItem(newState, "storm_hydra");
  newState = addItem(newState, "blood_raptor");
  return newState;
}
