import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";

interface SpellIconTileProps {
  spellId: string;
  size?: number;
  tileSize?: number;
  dimmed?: boolean;
}

const iconNameSet = new Set(iconNames as string[]);

const EXACT_SPELL_ICON_NAMES: Record<string, string> = {
  arcane_bolt: "zap",
  second_wind: "wind",
  mana_surge: "battery-charging",
  ember_lance: "flame",
  berserker_blood_focus: "droplets",
  berserker_warcry: "megaphone",
  berserker_execution: "crosshair",
  berserker_ruin_crash: "anvil",
  berserker_blood_comet: "rocket",
  berserker_chain_rend: "link",
  berserker_slaughter_drive: "skull",
  berserker_iron_meteor: "circle-dot",
  berserker_skull_banner: "flag",
  berserker_cataclysm_chop: "axe",
  berserker_doom_feast: "utensils-crossed",
  sorceress_arcane_focus: "sparkles",
  sorceress_nova: "sun",
  sorceress_hexfire: "flame-kindling",
  sorceress_comet_spear: "arrow-up-right",
  sorceress_void_pulse: "orbit",
  sorceress_crown_of_cinders: "crown",
  sorceress_prism_collapse: "gem",
  sorceress_astral_scythe: "moon-star",
  sorceress_rift_torrent: "waves",
  sorceress_supernova_sigil: "eclipse",
  sorceress_eclipse_verdict: "sun-moon",
  farmer_harvest_focus: "sprout",
  farmer_regrowth: "heart-pulse",
  farmer_harvest_guard: "shield-plus",
  farmer_briar_cannon: "flower-2",
  farmer_silo_breaker: "warehouse",
  farmer_thornwake: "trees",
  farmer_orchard_stampede: "apple",
  farmer_solstice_reap: "sun-medium",
  farmer_ironroot_burst: "tree-pine",
  farmer_seasons_wrath: "leaf",
  farmer_verdant_end: "wheat",
  archer_marks_focus: "target",
  archer_hailfire: "flame",
  archer_pinpoint: "crosshair",
  archer_ricochet_gale: "move-right",
  archer_deadeye_brand: "focus",
  archer_featherstorm: "feather",
  archer_splitshot_drive: "git-fork",
  archer_horizon_break: "sunrise",
  archer_siege_volley: "tower-control",
  archer_falconfall: "bird",
  archer_zenith_barrage: "radar",
  idler_epoch_focus: "hourglass",
  idler_dividend: "coins",
  idler_timebank: "clock-3",
  idler_stored_force: "battery",
  idler_quietus_loop: "repeat",
  idler_delayed_crash: "timer-reset",
  idler_reserve_flare: "wallet",
  idler_echo_ledger: "book-marked",
  idler_patience_breaker: "alarm-clock-off",
  idler_long_wake: "sunrise",
  idler_epoch_cashout: "piggy-bank",
  tamer_pack_focus: "paw-print",
  tamer_pack_howl: "badge-alert",
  tamer_beast_sync: "handshake",
  tamer_alpha_pounce: "rabbit",
  tamer_fang_relay: "bone",
  tamer_den_stampede: "footprints",
  tamer_spirit_lash: "ghost",
  tamer_packbreaker: "shield-ban",
  tamer_sovereign_call: "badge-plus",
  tamer_bestial_eclipse: "moon",
  tamer_wild_hunt: "dog",
};

const KEYWORD_ICON_NAMES: Array<[RegExp, string]> = [
  [/focus|sigil/i, "sparkles"],
  [/bolt|surge|nova/i, "zap"],
  [/wind|gale|storm/i, "wind"],
  [/ember|cinder|hexfire|flame|flare/i, "flame"],
  [/blood|regrowth|guard|second/i, "heart-pulse"],
  [/thorn|briar|verdant|harvest|orchard|root|season/i, "leaf"],
  [/pinpoint|deadeye|mark|execution|target/i, "target"],
  [/banner|warcry/i, "flag"],
  [/comet|meteor/i, "rocket"],
  [/time|epoch|idle|delayed|echo|reserve|dividend|ledger/i, "clock-3"],
  [/pack|beast|fang|alpha|hunt|tamer|wild/i, "paw-print"],
  [/void|rift|astral|eclipse/i, "orbit"],
];

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function isValidIconName(name: string): name is IconName {
  return iconNameSet.has(name);
}

export function getSpellAccentColor(spellId: string): string {
  if (spellId.startsWith("berserker_")) return "#ff7b6b";
  if (spellId.startsWith("sorceress_")) return "#86d8ff";
  if (spellId.startsWith("farmer_")) return "#9be27d";
  if (spellId.startsWith("archer_")) return "#ffd36e";
  if (spellId.startsWith("idler_")) return "#d7c88a";
  if (spellId.startsWith("tamer_")) return "#c2b2ff";
  return "#b59cff";
}

export function getSpellIconName(spellId: string): IconName {
  const exact = EXACT_SPELL_ICON_NAMES[spellId];
  if (exact && isValidIconName(exact)) {
    return exact;
  }

  for (const [pattern, iconName] of KEYWORD_ICON_NAMES) {
    if (pattern.test(spellId) && isValidIconName(iconName)) {
      return iconName;
    }
  }

  return iconNames[hashString(spellId) % iconNames.length] as IconName;
}

export function SpellIconTile({
  spellId,
  size = 18,
  tileSize = 42,
  dimmed = false,
}: SpellIconTileProps) {
  const accent = getSpellAccentColor(spellId);

  return (
    <div
      aria-hidden="true"
      style={{
        width: tileSize,
        height: tileSize,
        borderRadius: 10,
        border: `1px solid ${dimmed ? "rgba(255,255,255,0.14)" : `${accent}66`}`,
        background: dimmed
          ? "linear-gradient(145deg, rgba(42, 46, 54, 0.9), rgba(24, 28, 36, 0.92))"
          : `linear-gradient(145deg, ${accent}22 0%, rgba(18, 24, 34, 0.95) 100%)`,
        boxShadow: dimmed
          ? "none"
          : `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${accent}12`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: dimmed ? "#7b8591" : accent,
        flexShrink: 0,
      }}
    >
      <DynamicIcon
        name={getSpellIconName(spellId)}
        size={size}
        strokeWidth={2}
      />
    </div>
  );
}
