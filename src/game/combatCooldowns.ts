import type { CombatRuntimeState } from "./combat";

const COMBAT_CONSUMABLE_COOLDOWNS_MS: Record<string, number> = {
  health_potion: 12000,
  mana_potion: 18000,
  elixir: 25000,
  immortal_brew: 45000,
  swift_tonic: 18000,
  fortitude_brew: 20000,
  scholars_draught: 22000,
  berserkers_tonic: 18000,
  chaos_potion: 30000,
};

export function getCombatConsumableCooldownMs(itemId: string): number {
  return COMBAT_CONSUMABLE_COOLDOWNS_MS[itemId] ?? 0;
}

function tickCooldownMap(
  cooldowns: Record<string, number> | undefined,
  deltaMs: number,
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(cooldowns ?? {})) {
    const remaining = Math.max(0, value - deltaMs);
    if (remaining > 0) {
      next[key] = remaining;
    }
  }
  return next;
}

export function reduceCombatCooldowns(
  runtime: CombatRuntimeState,
  deltaMs: number,
): CombatRuntimeState {
  if (deltaMs <= 0) return runtime;

  return {
    ...runtime,
    spellCooldowns: tickCooldownMap(runtime.spellCooldowns, deltaMs),
    consumableCooldowns: tickCooldownMap(runtime.consumableCooldowns, deltaMs),
  };
}
