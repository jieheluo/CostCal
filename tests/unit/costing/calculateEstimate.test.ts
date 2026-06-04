import { describe, expect, it } from "vitest";

import { calculateEstimate } from "../../../src/lib/domain/costing/calculateEstimate";

describe("calculateEstimate", () => {
  it("separates material, process, overhead, and total costs in CNY per K", () => {
    const estimate = calculateEstimate([
      {
        id: "item-main",
        costGroup: "main_material",
        itemName: "Lead frame",
        pricingMode: "CNY_PER_K",
        price: 120,
        priceUnit: "CNY/K"
      },
      {
        id: "item-aux",
        costGroup: "auxiliary_material",
        itemName: "Carrier tape",
        pricingMode: "USAGE_TIMES_UNIT_PRICE",
        price: 0.5,
        priceUnit: "CNY/m",
        usage: 6,
        usageUnit: "m/K"
      },
      {
        id: "item-process",
        costGroup: "process_outsourced_fee",
        itemName: "Plating",
        pricingMode: "CNY_PER_PIECE_TO_K",
        price: 0.02,
        priceUnit: "CNY/piece"
      },
      {
        id: "item-overhead",
        costGroup: "overhead_allocation",
        itemName: "Monthly allocation",
        pricingMode: "BATCH_TO_K",
        price: 500,
        priceUnit: "CNY/batch",
        batchOutputK: 10
      }
    ]);

    expect(estimate).toEqual({
      mainMaterialCostK: 120,
      auxiliaryMaterialCostK: 3,
      processFeeCostK: 20,
      overheadCostK: 50,
      totalCostK: 193,
      blockingIssues: []
    });
  });

  it("reports blocking issues with item context", () => {
    const estimate = calculateEstimate([
      {
        id: "bad-batch",
        costGroup: "overhead_allocation",
        itemName: "Bad allocation",
        pricingMode: "BATCH_TO_K",
        price: 100,
        priceUnit: "CNY/batch"
      }
    ]);

    expect(estimate.totalCostK).toBe(0);
    expect(estimate.blockingIssues).toEqual([
      "Bad allocation: batchOutputK is required for BATCH_TO_K."
    ]);
  });
});
