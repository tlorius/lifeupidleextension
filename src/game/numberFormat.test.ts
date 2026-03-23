import { describe, expect, it } from "vitest";
import { formatCompactNumber } from "./numberFormat";

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
