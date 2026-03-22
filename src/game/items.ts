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
    stats: { attack: 8, defense: 2 },
    sellPrice: 75,
  },
  // Weapons - Epic
  greataxe_1: {
    id: "greataxe_1",
    name: "Great Axe",
    type: "weapon",
    rarity: "epic",
    stats: { attack: 15, defense: -1 },
    sellPrice: 200,
  },
  // Weapons - Legendary
  excalibur: {
    id: "excalibur",
    name: "Excalibur",
    type: "weapon",
    rarity: "legendary",
    stats: { attack: 25 },
    sellPrice: 500,
  },
  // Weapons - Unique
  soul_edge: {
    id: "soul_edge",
    name: "Soul Edge",
    type: "weapon",
    rarity: "unique",
    stats: { attack: 30, intelligence: 5 },
    sellPrice: 750,
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
    stats: { defense: 6 },
    sellPrice: 60,
  },
  // Armor - Epic
  plate_armor: {
    id: "plate_armor",
    name: "Plate Armor",
    type: "armor",
    rarity: "epic",
    stats: { defense: 12 },
    sellPrice: 250,
  },
  // Armor - Legendary
  excalibur_armor: {
    id: "excalibur_armor",
    name: "Holy Plate Mail",
    type: "armor",
    rarity: "legendary",
    stats: { defense: 20, intelligence: 3 },
    sellPrice: 450,
  },
  // Armor - Unique
  void_armor: {
    id: "void_armor",
    name: "Void Armor",
    type: "armor",
    rarity: "unique",
    stats: { defense: 25, intelligence: 8 },
    sellPrice: 800,
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
    stats: { intelligence: 4, attack: 1 },
    sellPrice: 100,
  },
  // Accessories - Epic
  dragon_ring: {
    id: "dragon_ring",
    name: "Dragon Ring",
    type: "accessory",
    rarity: "epic",
    stats: { attack: 5, defense: 3 },
    sellPrice: 180,
  },
  // Accessories - Legendary
  infinity_gem: {
    id: "infinity_gem",
    name: "Infinity Gem",
    type: "accessory",
    rarity: "legendary",
    stats: { attack: 10, defense: 5, intelligence: 10 },
    sellPrice: 400,
  },
  // Accessories - Unique
  chaos_emerald: {
    id: "chaos_emerald",
    name: "Chaos Emerald",
    type: "accessory",
    rarity: "unique",
    stats: { attack: 15, intelligence: 15 },
    sellPrice: 600,
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
    name: "Celestial Sprinkler",
    type: "tool",
    rarity: "unique",
    sellPrice: 600,
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
    name: "Potion of Chaos",
    type: "potion",
    rarity: "unique",
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
    stats: { attack: 5, intelligence: 2 },
    sellPrice: 120,
    petBonus: { bonusType: "goldIncome", bonusAmount: 0.1 }, // 10% gold income bonus per level
  },
  // Pets - Epic
  ice_dragon: {
    id: "ice_dragon",
    name: "Ice Dragon",
    type: "pet",
    rarity: "epic",
    stats: { attack: 10, defense: 5, intelligence: 5 },
    sellPrice: 400,
    petBonus: { bonusType: "defense", bonusAmount: 0.12 }, // 12% defense bonus per level
  },
  // Pets - Legendary
  phoenix: {
    id: "phoenix",
    name: "Phoenix",
    type: "pet",
    rarity: "legendary",
    stats: { attack: 15, intelligence: 10 },
    sellPrice: 600,
    petBonus: { bonusType: "intelligence", bonusAmount: 0.15 }, // 15% intelligence bonus per level
  },
  // Pets - Unique
  void_beast: {
    id: "void_beast",
    name: "Void Beast",
    type: "pet",
    rarity: "unique",
    stats: { attack: 20, defense: 10, intelligence: 15 },
    sellPrice: 1000,
    petBonus: { bonusType: "attack", bonusAmount: 0.2 }, // 20% attack bonus per level
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
  newState = addItem(newState, "shield_1");
  newState = addItem(newState, "amulet_1");
  newState = addItem(newState, "pickaxe_1");
  newState = addItem(newState, "shovel_1");
  // Epic rarities
  newState = addItem(newState, "greataxe_1");
  newState = addItem(newState, "plate_armor");
  newState = addItem(newState, "dragon_ring");
  newState = addItem(newState, "mithril_pickaxe");
  newState = addItem(newState, "iron_shovel");
  newState = addItem(newState, "mithril_shovel");
  newState = addItem(newState, "sprinkler_common");
  newState = addItem(newState, "sprinkler_rare");
  newState = addItem(newState, "sprinkler_epic");
  newState = addItem(newState, "sprinkler_legendary");
  newState = addItem(newState, "sprinkler_unique");
  // Legendary rarities
  newState = addItem(newState, "excalibur");
  newState = addItem(newState, "excalibur_armor");
  newState = addItem(newState, "infinity_gem");
  // Unique rarities
  newState = addItem(newState, "soul_edge");
  newState = addItem(newState, "void_armor");
  newState = addItem(newState, "chaos_emerald");
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
  newState = addItem(newState, "ice_dragon");
  newState = addItem(newState, "phoenix");
  newState = addItem(newState, "void_beast");
  return newState;
}
