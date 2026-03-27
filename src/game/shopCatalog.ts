import type { ClassId } from "./classes/types";
import { uniqueSetDefinitions } from "./itemSets";
import { itemDefinitions } from "./itemsCatalog";

export type ShopCurrency = "gold" | "gems" | "ruby";

export interface ShopOffer {
  itemId: string;
  name: string;
  rarity: string;
  currency: ShopCurrency;
  costPerItem: number;
  classId?: ClassId;
  setId?: string;
}

const NEW_CLASS_SET_IDS = [
  "gorelord",
  "nightstar",
  "rootcrown",
  "skyhunter",
  "epochveil",
  "moonpack",
] as const;

export const SPECIAL_SEED_SHOP_ITEM_IDS = [
  "starlime_seed_rare",
  "coralfern_seed_rare",
  "moonflower_seed",
  "moonpalm_seed_epic",
  "dragonfruit_seed_epic",
  "aurora_orchid_seed_legendary",
  "lava_blossom_seed_legendary",
  "astral_lotus_seed_epic",
  "void_truffle_seed_legendary",
  "phoenix_bloom_seed_unique",
] as const;

function toRarityGemCost(rarity: string): number {
  if (rarity === "rare") return 4;
  if (rarity === "epic") return 12;
  if (rarity === "legendary") return 30;
  if (rarity === "unique") return 80;
  return 2;
}

function compareOfferNames(a: ShopOffer, b: ShopOffer): number {
  return a.name.localeCompare(b.name);
}

export function getClassSetOffers(classId?: ClassId): ShopOffer[] {
  const offers: ShopOffer[] = [];

  for (const itemDef of Object.values(itemDefinitions)) {
    if (!itemDef.setId) continue;
    if (
      !NEW_CLASS_SET_IDS.includes(
        itemDef.setId as (typeof NEW_CLASS_SET_IDS)[number],
      )
    ) {
      continue;
    }

    if (
      itemDef.type !== "weapon" &&
      itemDef.type !== "armor" &&
      itemDef.type !== "accessory" &&
      itemDef.type !== "pet"
    ) {
      continue;
    }

    const setDef = uniqueSetDefinitions[itemDef.setId];
    if (!setDef) continue;
    if (classId && setDef.classId !== classId) continue;

    offers.push({
      itemId: itemDef.id,
      name: itemDef.name,
      rarity: itemDef.rarity,
      currency: "ruby",
      costPerItem: 10,
      classId: setDef.classId,
      setId: setDef.id,
    });
  }

  return offers.sort(compareOfferNames);
}

export function getSpecialSeedOffers(): ShopOffer[] {
  const offers: ShopOffer[] = [];

  for (const itemId of SPECIAL_SEED_SHOP_ITEM_IDS) {
    const def = itemDefinitions[itemId];
    if (!def) continue;
    offers.push({
      itemId: def.id,
      name: def.name,
      rarity: def.rarity,
      currency: "gems",
      costPerItem: toRarityGemCost(def.rarity),
    });
  }

  return offers.sort(compareOfferNames);
}

export function getDebugShopOffers(): ShopOffer[] {
  const offers: ShopOffer[] = [];

  for (const def of Object.values(itemDefinitions)) {
    offers.push({
      itemId: def.id,
      name: def.name,
      rarity: def.rarity,
      currency: "gold",
      costPerItem: 0,
      setId: def.setId,
      classId: def.setId ? uniqueSetDefinitions[def.setId]?.classId : undefined,
    });
  }

  return offers.sort(compareOfferNames);
}
