// Internal unit suffix mappings (inlined into formatCompactNumber to avoid duplication)
const UNIT_SUFFIXES = {
  K: "K",
  M: "M",
  B: "B",
  T: "T",
  Qa: "Qa",
  Qi: "Qi",
  Sx: "Sx",
  Sp: "Sp",
  Oc: "Oc",
  No: "No",
  Dc: "Dc",
  Ud: "Ud",
  Dd: "Dd",
  Td: "Td",
  Qad: "Qad",
  Qid: "Qid",
  Sxd: "Sxd",
  Spd: "Spd",
  Ocd: "Ocd",
  Nod: "Nod",
  Vg: "Vg",
} as const;

export type NumberUnitSuffix =
  (typeof UNIT_SUFFIXES)[keyof typeof UNIT_SUFFIXES];

export type NumberUnitDefinition = {
  suffix: NumberUnitSuffix | string;
};

export interface CompactNumberOptions {
  decimals?: number;
  minCompactValue?: number;
  smallValueDecimals?: number;
  units?: NumberUnitDefinition[];
  fallbackToScientific?: boolean;
}

// Default unit list (inlined in function to avoid export)
const UNITS: NumberUnitDefinition[] = [
  { suffix: UNIT_SUFFIXES.K },
  { suffix: UNIT_SUFFIXES.M },
  { suffix: UNIT_SUFFIXES.B },
  { suffix: UNIT_SUFFIXES.T },
  { suffix: UNIT_SUFFIXES.Qa },
  { suffix: UNIT_SUFFIXES.Qi },
  { suffix: UNIT_SUFFIXES.Sx },
  { suffix: UNIT_SUFFIXES.Sp },
  { suffix: UNIT_SUFFIXES.Oc },
  { suffix: UNIT_SUFFIXES.No },
  { suffix: UNIT_SUFFIXES.Dc },
  { suffix: UNIT_SUFFIXES.Ud },
  { suffix: UNIT_SUFFIXES.Dd },
  { suffix: UNIT_SUFFIXES.Td },
  { suffix: UNIT_SUFFIXES.Qad },
  { suffix: UNIT_SUFFIXES.Qid },
  { suffix: UNIT_SUFFIXES.Sxd },
  { suffix: UNIT_SUFFIXES.Spd },
  { suffix: UNIT_SUFFIXES.Ocd },
  { suffix: UNIT_SUFFIXES.Nod },
  { suffix: UNIT_SUFFIXES.Vg },
];

function trimTrailingZeros(value: number, decimals: number): string {
  if (decimals <= 0) return Math.trunc(value).toString();
  return value
    .toFixed(decimals)
    .replace(/\.?0+$/, "")
    .replace(/\.0+$/, "");
}

function formatFixedDecimals(value: number, decimals: number): string {
  if (decimals <= 0) return Math.trunc(value).toString();
  return value.toFixed(decimals);
}

export function formatCompactNumber(
  input: number,
  options: CompactNumberOptions = {},
): string {
  const {
    decimals = 2,
    minCompactValue = 1000,
    smallValueDecimals = 2,
    units = UNITS,
    fallbackToScientific = true,
  } = options;

  if (Number.isNaN(input)) return "0";
  if (!Number.isFinite(input)) return input > 0 ? "Infinity" : "-Infinity";

  const absolute = Math.abs(input);
  if (absolute < minCompactValue) {
    if (Number.isInteger(input)) return input.toString();
    return trimTrailingZeros(input, smallValueDecimals);
  }

  const thousandPower = Math.max(0, Math.floor(Math.log10(absolute) / 3) - 1);
  let unitIndex = Math.min(thousandPower, units.length - 1);
  let scaled = input / Math.pow(1000, unitIndex + 1);

  const roundScale = Math.pow(10, decimals);
  let rounded = Math.round(scaled * roundScale) / roundScale;

  if (Math.abs(rounded) >= 1000 && unitIndex < units.length - 1) {
    unitIndex += 1;
    scaled = scaled / 1000;
    rounded = Math.round(scaled * roundScale) / roundScale;
  }

  if (
    Math.abs(rounded) >= 1000 &&
    unitIndex === units.length - 1 &&
    fallbackToScientific
  ) {
    return input.toExponential(Math.min(decimals, 6));
  }

  return `${formatFixedDecimals(rounded, decimals)}${units[unitIndex].suffix}`;
}

/**
 * Formats an integer with apostrophe thousands separators for combat damage display.
 * Examples: 1000 → "1'000", 1234567 → "1'234'567", 999 → "999"
 */
export function formatCombatNumber(value: number): string {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded)) {
    return rounded > 0 ? "Infinity" : "-Infinity";
  }

  // Use locale grouping to avoid scientific notation for very large values.
  return rounded
    .toLocaleString("en-US", {
      useGrouping: true,
      maximumFractionDigits: 0,
    })
    .replace(/,/g, "'");
}
