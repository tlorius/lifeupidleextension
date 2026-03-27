import { describe, expect, it } from "vitest";
import { formatCompactNumber, formatCombatNumber } from "./numberFormat";

describe("formatCompactNumber", () => {
  it("keeps two decimals for compact thousands", () => {
    expect(formatCompactNumber(12100)).toBe("12.10K");
  });

  it("keeps trailing zero decimals for exact thousand boundaries", () => {
    expect(formatCompactNumber(1000)).toBe("1.00K");
  });

  it("keeps decimals for larger compact units", () => {
    expect(formatCompactNumber(1234567)).toBe("1.23M");
  });

  it("keeps non-compact small integer formatting unchanged", () => {
    expect(formatCompactNumber(999)).toBe("999");
  });
});

describe("formatCombatNumber", () => {
  it("returns plain string for numbers below 1000", () => {
    expect(formatCombatNumber(999)).toBe("999");
  });

  it("formats thousands with one apostrophe", () => {
    expect(formatCombatNumber(1000)).toBe("1'000");
  });

  it("formats millions with two apostrophes", () => {
    expect(formatCombatNumber(1000000)).toBe("1'000'000");
  });

  it("formats billions without compacting away digits", () => {
    expect(formatCombatNumber(1000000000)).toBe("1'000'000'000");
  });

  it("formats very large values without scientific notation", () => {
    expect(formatCombatNumber(1e24)).toBe("1'000'000'000'000'000'000'000'000");
  });

  it("rounds to nearest integer before formatting", () => {
    expect(formatCombatNumber(1000.7)).toBe("1'001");
  });

  it("handles mid-range numbers correctly", () => {
    expect(formatCombatNumber(12345)).toBe("12'345");
  });
});
