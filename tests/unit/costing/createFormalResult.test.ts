import { describe, expect, it, vi } from "vitest";

import { createFormalResult } from "../../../src/lib/domain/costing/createFormalResult";

describe("createFormalResult", () => {
  it("creates an immutable formal result with snapshots and next version", async () => {
    const db = createMockDb("v2");
    const result = await createFormalResult({
      dbClient: db,
      projectId: "project-1",
      calculatedById: "user-1",
      costItems: [
        {
          id: "item-1",
          costGroup: "main_material",
          itemName: "Lead frame",
          specificationId: "spec-1",
          specificationName: "QFN-32",
          supplierId: "supplier-1",
          supplierName: "Supplier A",
          supplierPriceId: "price-1",
          importBatchId: "batch-1",
          pricingMode: "CNY_PER_K",
          price: 120,
          priceUnit: "CNY/K",
          usage: 1,
          usageUnit: "K",
          priceSource: "imported"
        }
      ],
      formulaVersion: "cost-engine-v1"
    });

    expect(result).toEqual({ id: "result-1", version: "v3" });
    expect(db.costResult.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: "project-1",
        version: "v3",
        mainMaterialCostK: 120,
        auxiliaryMaterialCostK: 0,
        processFeeCostK: 0,
        overheadCostK: 0,
        totalCostK: 120,
        formulaVersion: "cost-engine-v1",
        calculatedById: "user-1"
      })
    });

    const data = db.costResult.create.mock.calls[0][0].data;
    expect(JSON.parse(data.inputSnapshot)).toEqual(expect.objectContaining({
      projectId: "project-1",
      costItems: [expect.objectContaining({ itemName: "Lead frame" })]
    }));
    expect(JSON.parse(data.priceSnapshot)).toEqual([
      expect.objectContaining({
        supplierPriceId: "price-1",
        supplierName: "Supplier A",
        price: 120
      })
    ]);
    expect(JSON.parse(data.importBatchSnapshot)).toEqual([
      { importBatchId: "batch-1" }
    ]);
  });

  it("rejects formal calculation when blocking issues exist", async () => {
    const db = createMockDb(null);

    await expect(createFormalResult({
      dbClient: db,
      projectId: "project-1",
      calculatedById: "user-1",
      costItems: [
        {
          id: "bad-item",
          costGroup: "overhead_allocation",
          itemName: "Missing batch output",
          pricingMode: "BATCH_TO_K",
          price: 100,
          priceUnit: "CNY/batch"
        }
      ],
      formulaVersion: "cost-engine-v1"
    })).rejects.toThrow("Formal calculation blocked: Missing batch output: batchOutputK is required for BATCH_TO_K.");
    expect(db.costResult.create).not.toHaveBeenCalled();
  });
});

function createMockDb(latestVersion: string | null) {
  return {
    costResult: {
      findFirst: vi.fn().mockResolvedValue(latestVersion ? { version: latestVersion } : null),
      create: vi.fn().mockResolvedValue({ id: "result-1", version: "v3" })
    }
  };
}
