import { describe, expect, it } from "vitest";
import {
  getClassSetOffers,
  getDebugShopOffers,
  getSpecialSeedOffers,
} from "./shopCatalog";

describe("shop catalog", () => {
  it("prices special seeds in gems", () => {
    const offers = getSpecialSeedOffers();

    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((offer) => offer.currency === "gems")).toBe(true);
  });

  it("keeps class set offers priced in ruby", () => {
    const offers = getClassSetOffers();

    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((offer) => offer.currency === "ruby")).toBe(true);
  });

  it("keeps debug offers priced in gold", () => {
    const offers = getDebugShopOffers();

    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((offer) => offer.currency === "gold")).toBe(true);
  });
});
