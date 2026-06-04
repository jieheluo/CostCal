import { describe, expect, it } from "vitest";

import { calculatePricingModeCostK } from "../../../src/lib/domain/costing/pricingModes";

describe("pricing mode cost conversion", () => {
  it("keeps CNY per K prices unchanged", () => {
    expect(calculatePricingModeCostK({
      pricingMode: "CNY_PER_K",
      price: 12.5,
      priceUnit: "CNY/K"
    })).toEqual({ costK: 12.5, issues: [] });
  });

  it("converts CNY per gram with gram per K usage", () => {
    expect(calculatePricingModeCostK({
      pricingMode: "USAGE_TIMES_UNIT_PRICE",
      price: 0.2,
      priceUnit: "CNY/g",
      usage: 5,
      usageUnit: "g/K"
    })).toEqual({ costK: 1, issues: [] });
  });

  it("converts CNY per piece prices to K", () => {
    expect(calculatePricingModeCostK({
      pricingMode: "CNY_PER_PIECE_TO_K",
      price: 0.035,
      priceUnit: "CNY/piece"
    })).toEqual({ costK: 35, issues: [] });
  });

  it("converts batch amount to K output", () => {
    expect(calculatePricingModeCostK({
      pricingMode: "BATCH_TO_K",
      price: 1000,
      priceUnit: "CNY/batch",
      batchOutputK: 25
    })).toEqual({ costK: 40, issues: [] });
  });

  it("converts shot pricing by pieces per shot", () => {
    expect(calculatePricingModeCostK({
      pricingMode: "SHOT_CONVERSION",
      price: 80,
      priceUnit: "CNY/shot",
      piecesPerShot: 2000
    })).toEqual({ costK: 40, issues: [] });
  });

  it("requires a source note for manual prices", () => {
    expect(calculatePricingModeCostK({
      pricingMode: "MANUAL_WITH_SOURCE",
      price: 9,
      priceUnit: "CNY/K"
    })).toEqual({
      costK: 9,
      issues: ["Manual price requires a source note."]
    });
  });
});
