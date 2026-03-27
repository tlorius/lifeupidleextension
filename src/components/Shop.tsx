import { useMemo, useState } from "react";
import { useGame } from "../game/GameContext";
import { useGameActions } from "../game/useGameActions";
import { getItemDefSafe } from "../game/items";
import type { ClassId } from "../game/classes/types";
import { getClassLabel } from "../game/itemSets";
import {
  getClassSetOffers,
  getDebugShopOffers,
  getSpecialSeedOffers,
  type ShopOffer,
} from "../game/shopCatalog";
import { formatCompactNumber } from "../game/numberFormat";
import { ItemDetail } from "./ItemDetail";
import type { ItemInstance, ItemType } from "../game/types";

interface ShopProps {
  isDebugShopEnabled: boolean;
}

type ShopSection = "classsets" | "seeds" | "debug";
type DebugCategoryFilter = "all" | ItemType;

const CLASS_IDS: ClassId[] = [
  "berserker",
  "sorceress",
  "farmer",
  "archer",
  "idler",
  "tamer",
];

const DEBUG_CATEGORY_FILTERS: DebugCategoryFilter[] = [
  "all",
  "weapon",
  "armor",
  "accessory",
  "tool",
  "potion",
  "seed",
  "pet",
];

const RARITY_COLORS: Record<string, string> = {
  common: "#999999",
  rare: "#4169E1",
  epic: "#9932CC",
  legendary: "#FFD700",
  unique: "#FF8C00",
};

export default function Shop({ isDebugShopEnabled }: ShopProps) {
  const { state } = useGame();
  const { buyShopItem } = useGameActions();
  const [section, setSection] = useState<ShopSection>("classsets");
  const [debugCategoryFilter, setDebugCategoryFilter] =
    useState<DebugCategoryFilter>("all");
  const [selectedPreviewItemId, setSelectedPreviewItemId] = useState<
    string | null
  >(null);
  const [selectedClassId, setSelectedClassId] = useState<ClassId | "all">(
    state.character.activeClassId ?? "all",
  );

  const activeSection: ShopSection =
    section === "debug" && !isDebugShopEnabled ? "classsets" : section;

  const classSetOffers = useMemo(() => {
    if (selectedClassId === "all") return getClassSetOffers();
    return getClassSetOffers(selectedClassId);
  }, [selectedClassId]);

  const seedOffers = useMemo(() => getSpecialSeedOffers(), []);
  const debugOffers = useMemo(() => getDebugShopOffers(), []);
  const filteredDebugOffers = useMemo(() => {
    if (debugCategoryFilter === "all") return debugOffers;
    return debugOffers.filter((offer) => {
      const def = getItemDefSafe(offer.itemId);
      return def?.type === debugCategoryFilter;
    });
  }, [debugOffers, debugCategoryFilter]);

  const selectedPreviewItem = useMemo<ItemInstance | null>(() => {
    if (!selectedPreviewItemId) return null;
    return {
      uid: `shop-preview-${selectedPreviewItemId}`,
      itemId: selectedPreviewItemId,
      quantity: 1,
      level: 1,
    };
  }, [selectedPreviewItemId]);

  const sectionOffers =
    activeSection === "classsets"
      ? classSetOffers
      : activeSection === "seeds"
        ? seedOffers
        : filteredDebugOffers;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>Shop</h1>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <button
          className={activeSection === "classsets" ? "btn-selected" : ""}
          onClick={() => setSection("classsets")}
        >
          Class Sets
        </button>
        <button
          className={activeSection === "seeds" ? "btn-selected" : ""}
          onClick={() => setSection("seeds")}
        >
          Seeds
        </button>
        {isDebugShopEnabled ? (
          <button
            className={activeSection === "debug" ? "btn-selected" : ""}
            onClick={() => setSection("debug")}
          >
            Debug
          </button>
        ) : null}
      </div>

      {activeSection === "classsets" ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8, color: "#9eb0c2", fontSize: 13 }}>
            Class filter (defaults to your current class):
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className={selectedClassId === "all" ? "btn-selected" : ""}
              onClick={() => setSelectedClassId("all")}
            >
              All
            </button>
            {CLASS_IDS.map((classId) => (
              <button
                key={classId}
                className={selectedClassId === classId ? "btn-selected" : ""}
                onClick={() => setSelectedClassId(classId)}
              >
                {getClassLabel(classId)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {activeSection === "debug" ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "#9eb0c2", fontSize: 13, marginBottom: 8 }}>
            Debug shop sells all recently added set/seed items for 0 gold.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DEBUG_CATEGORY_FILTERS.map((category) => (
              <button
                key={category}
                className={
                  debugCategoryFilter === category ? "btn-selected" : ""
                }
                onClick={() => setDebugCategoryFilter(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ marginBottom: 10, color: "#9eb0c2", fontSize: 12 }}>
        Click an item card to inspect full details.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 10,
        }}
      >
        {sectionOffers.map((offer) => (
          <ShopOfferCard
            key={`${activeSection}-${offer.itemId}`}
            offer={offer}
            gold={state.resources.gold}
            gems={state.resources.gems ?? 0}
            ruby={state.resources.ruby ?? 0}
            onOpenDetails={() => setSelectedPreviewItemId(offer.itemId)}
            onBuy={() =>
              buyShopItem(offer.itemId, offer.currency, offer.costPerItem, 1)
            }
          />
        ))}
      </div>

      {sectionOffers.length === 0 ? (
        <div style={{ marginTop: 14, color: "#9eb0c2" }}>
          No items for this filter.
        </div>
      ) : null}

      {selectedPreviewItem ? (
        <ItemDetail
          item={selectedPreviewItem}
          readOnly
          onClose={() => setSelectedPreviewItemId(null)}
        />
      ) : null}
    </div>
  );
}

function ShopOfferCard({
  offer,
  gold,
  gems,
  ruby,
  onOpenDetails,
  onBuy,
}: {
  offer: ShopOffer;
  gold: number;
  gems: number;
  ruby: number;
  onOpenDetails: () => void;
  onBuy: () => void;
}) {
  const hasEnough =
    offer.currency === "gold"
      ? gold >= offer.costPerItem
      : offer.currency === "gems"
        ? gems >= offer.costPerItem
        : ruby >= offer.costPerItem;
  const currentAmount =
    offer.currency === "gold" ? gold : offer.currency === "gems" ? gems : ruby;
  const missingAmount = Math.max(0, offer.costPerItem - currentAmount);

  const currencyIcon =
    offer.currency === "gold" ? "🪙" : offer.currency === "gems" ? "💎" : "♦️";
  const affordColor = hasEnough ? "#9fe3a8" : "#ff9f9f";
  const rarityColor = RARITY_COLORS[offer.rarity] ?? RARITY_COLORS.common;

  return (
    <div
      style={{
        border: "1px solid #2f4052",
        borderRadius: 10,
        padding: 10,
        background: "rgba(8, 15, 24, 0.55)",
        cursor: "pointer",
      }}
      onClick={onOpenDetails}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, color: rarityColor }}>
        {offer.name}
      </div>
      <div style={{ fontSize: 12, color: "#9eb0c2", marginBottom: 6 }}>
        Rarity: {offer.rarity}
      </div>
      {offer.classId ? (
        <div style={{ fontSize: 12, color: "#9eb0c2", marginBottom: 6 }}>
          Class: {getClassLabel(offer.classId)}
        </div>
      ) : null}
      <div style={{ fontSize: 13, color: affordColor, marginBottom: 8 }}>
        Cost: {currencyIcon} {formatCompactNumber(offer.costPerItem)}
      </div>
      {!hasEnough ? (
        <div style={{ fontSize: 12, color: "#ff9f9f", marginBottom: 8 }}>
          Need {currencyIcon} {formatCompactNumber(missingAmount)} more
        </div>
      ) : null}
      <button
        disabled={!hasEnough}
        onClick={(event) => {
          event.stopPropagation();
          onBuy();
        }}
      >
        Buy
      </button>
    </div>
  );
}
