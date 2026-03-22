export const NumberUnitSuffix = {
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
  (typeof NumberUnitSuffix)[keyof typeof NumberUnitSuffix];

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

// Configurable unit list. Order defines progression by powers of 1000.
export const DEFAULT_NUMBER_UNITS: NumberUnitDefinition[] = [
  { suffix: NumberUnitSuffix.K },
  { suffix: NumberUnitSuffix.M },
  { suffix: NumberUnitSuffix.B },
  { suffix: NumberUnitSuffix.T },
  { suffix: NumberUnitSuffix.Qa },
  { suffix: NumberUnitSuffix.Qi },
  { suffix: NumberUnitSuffix.Sx },
  { suffix: NumberUnitSuffix.Sp },
  { suffix: NumberUnitSuffix.Oc },
  { suffix: NumberUnitSuffix.No },
  { suffix: NumberUnitSuffix.Dc },
  { suffix: NumberUnitSuffix.Ud },
  { suffix: NumberUnitSuffix.Dd },
  { suffix: NumberUnitSuffix.Td },
  { suffix: NumberUnitSuffix.Qad },
  { suffix: NumberUnitSuffix.Qid },
  { suffix: NumberUnitSuffix.Sxd },
  { suffix: NumberUnitSuffix.Spd },
  { suffix: NumberUnitSuffix.Ocd },
  { suffix: NumberUnitSuffix.Nod },
  { suffix: NumberUnitSuffix.Vg },
];

function trimTrailingZeros(value: number, decimals: number): string {
  if (decimals <= 0) return Math.trunc(value).toString();
  return value
    .toFixed(decimals)
    .replace(/\.?0+$/, "")
    .replace(/\.0+$/, "");
}

export function formatCompactNumber(
  input: number,
  options: CompactNumberOptions = {},
): string {
  const {
    decimals = 2,
    minCompactValue = 1000,
    smallValueDecimals = 2,
    units = DEFAULT_NUMBER_UNITS,
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

  return `${trimTrailingZeros(rounded, decimals)}${units[unitIndex].suffix}`;
}
