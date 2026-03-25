import type {
  FightConsumableModalViewModel,
  FightConsumablesPanelViewModel,
} from "../game/selectors/fight";

interface FightConsumablesPanelProps {
  panel: FightConsumablesPanelViewModel;
  onOpenModal: () => void;
  onOpenSlot: (slotIndex: 0 | 1) => void;
  onUseConsumable: (itemUid: string) => void;
}

interface FightConsumableModalProps {
  isOpen: boolean;
  modal: FightConsumableModalViewModel;
  onClose: () => void;
  onSelectSlot: (slotIndex: 0 | 1) => void;
  onClearSelectedSlot: () => void;
  onEquipConsumable: (itemId: string) => void;
}

export function FightConsumablesPanel({
  panel,
  onOpenModal,
  onOpenSlot,
  onUseConsumable,
}: FightConsumablesPanelProps) {
  return (
    <div
      style={{
        marginBottom: 14,
        borderRadius: 12,
        border: "1px solid #30465b",
        background: "linear-gradient(150deg, #162433 0%, #1f3248 100%)",
        padding: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13 }}>🧴 Potions</div>
        <button
          onClick={onOpenModal}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            borderRadius: 7,
            border: "1px solid rgba(109, 144, 173, 0.35)",
            background: "rgba(20, 35, 50, 0.65)",
            color: "#9fc6ff",
            cursor: "pointer",
          }}
        >
          Select
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {panel.slots.map((slot) => (
          <div
            key={`potion-slot-${slot.slotIndex}`}
            style={{
              borderRadius: 8,
              border: "1px solid rgba(109, 144, 173, 0.3)",
              background: "rgba(13, 23, 34, 0.55)",
              padding: 8,
              display: "grid",
              justifyItems: "center",
              gap: 4,
            }}
          >
            <button
              onClick={() => {
                if (slot.isEmpty) {
                  onOpenSlot(slot.slotIndex);
                  return;
                }
                if (!slot.isOnCooldown && slot.itemUid) {
                  onUseConsumable(slot.itemUid);
                }
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                onOpenSlot(slot.slotIndex);
              }}
              disabled={slot.isOnCooldown}
              title={slot.title}
              style={{
                width: 36,
                height: 36,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                lineHeight: 1,
                borderRadius: 8,
                border: `1px solid ${slot.rarityTint}`,
                background: slot.isOnCooldown
                  ? "rgba(90, 90, 90, 0.45)"
                  : "rgba(22, 35, 50, 0.92)",
                color: slot.isOnCooldown ? "#8e8e8e" : "#f2f8ff",
                cursor: slot.isOnCooldown ? "not-allowed" : "pointer",
                opacity: slot.isEmpty ? 0.6 : 1,
              }}
            >
              <span
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {slot.icon}
              </span>
            </button>

            <div style={{ fontSize: 10, opacity: 0.72 }}>
              {slot.quantityLabel}
            </div>
            {slot.cooldownLabel && (
              <div style={{ fontSize: 10, color: "#f2a59f" }}>
                {slot.cooldownLabel}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FightConsumableModal({
  isOpen,
  modal,
  onClose,
  onSelectSlot,
  onClearSelectedSlot,
  onEquipConsumable,
}: FightConsumableModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "rgba(6, 10, 16, 0.72)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(460px, 100%)",
          maxHeight: "80vh",
          overflowY: "auto",
          borderRadius: 12,
          border: "1px solid #3b5670",
          background: "linear-gradient(170deg, #111b27 0%, #1b2b3c 100%)",
          padding: 12,
          boxShadow: "0 16px 44px rgba(0, 0, 0, 0.45)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 700 }}>Select Slot Potions</div>
          <button
            onClick={onClose}
            style={{
              borderRadius: 6,
              border: "1px solid rgba(130, 170, 204, 0.4)",
              background: "rgba(20, 35, 50, 0.65)",
              color: "#d8ecff",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {modal.slotTabs.map((slot) => (
            <button
              key={`modal-slot-${slot.slotIndex}`}
              onClick={() => onSelectSlot(slot.slotIndex)}
              style={{
                borderRadius: 8,
                border: slot.isSelected
                  ? "1px solid #9ad0ff"
                  : "1px solid rgba(125, 153, 179, 0.4)",
                background: slot.isSelected
                  ? "rgba(72, 120, 168, 0.4)"
                  : "rgba(16, 28, 40, 0.7)",
                color: "#e2f2ff",
                padding: "6px 10px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {slot.label}
            </button>
          ))}
          <button
            onClick={onClearSelectedSlot}
            style={{
              marginLeft: "auto",
              borderRadius: 8,
              border: "1px solid rgba(207, 126, 126, 0.45)",
              background: "rgba(58, 18, 18, 0.55)",
              color: "#ffc7c7",
              padding: "6px 10px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Clear Slot
          </button>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {modal.isEmpty && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              No potions in inventory.
            </div>
          )}
          {modal.options.map((potion) => (
            <button
              key={potion.itemId}
              onClick={() => onEquipConsumable(potion.itemId)}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 10,
                alignItems: "center",
                borderRadius: 8,
                border: "1px solid rgba(124, 156, 183, 0.35)",
                background: "rgba(16, 28, 40, 0.7)",
                padding: "8px 10px",
                color: "#ecf7ff",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 18 }}>{potion.icon}</span>
              <span style={{ fontSize: 12, color: potion.rarityTint }}>
                {potion.name}
              </span>
              <span style={{ fontSize: 11, opacity: 0.75 }}>
                {potion.quantityLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
