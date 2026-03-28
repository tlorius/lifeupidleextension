import { addItem } from "./engine";
import type { GameState, ItemDefinition } from "./types";
import { itemDefinitions } from "./itemsCatalog";

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
  // Pets (set pets are already added above with unique set items)
  for (const itemDef of Object.values(itemDefinitions)) {
    if (itemDef.type === "pet" && !itemDef.setId) {
      newState = addItem(newState, itemDef.id);
    }
  }
  return newState;
}
