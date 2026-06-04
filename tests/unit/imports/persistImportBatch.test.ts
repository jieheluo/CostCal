import { describe, expect, it, vi } from "vitest";

import { persistImportBatch } from "../../../src/lib/domain/imports/persistImportBatch";
import type { ValidImportRow } from "../../../src/lib/domain/imports/validateImportRows";

describe("persistImportBatch", () => {
  it("creates an imported batch and upserts material price master data", async () => {
    const db = createMockDb();
    const validRows: ValidImportRow[] = [
      {
        rowNumber: 2,
        data: {
          materialCode: "LF-001",
          materialCategory: "Lead Frame",
          materialName: "Lead Frame A",
          defaultUnit: "K",
          specification: "QFN-32",
          supplier: "Supplier A",
          price: 12.5,
          priceUnit: "CNY/K",
          effectiveDate: "2026-06-01"
        },
        raw: {}
      }
    ];

    const result = await persistImportBatch({
      dbClient: db,
      templateType: "material_price",
      validRows,
      fileName: "prices.xlsx",
      importedById: "user-1"
    });

    expect(result.id).toBe("batch-1");
    expect(db.importBatch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        templateType: "material_price",
        templateVersion: "MATERIAL_PRICE_V1",
        fileName: "prices.xlsx",
        status: "imported",
        successRowCount: 1,
        failedRowCount: 0,
        importedById: "user-1"
      })
    });
    expect(db.material.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        materialCode_category: {
          materialCode: "LF-001",
          category: "Lead Frame"
        }
      },
      update: expect.objectContaining({ importBatchId: "batch-1" })
    }));
    expect(db.supplierPrice.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ importBatchId: "batch-1" })
    }));
  });

  it("upserts standard UPH routes with the import batch id", async () => {
    const db = createMockDb();
    const validRows: ValidImportRow[] = [
      {
        rowNumber: 2,
        data: {
          packageType: "QFN",
          processName: "Wire Bond",
          standardUph: 1500
        },
        raw: {}
      }
    ];

    await persistImportBatch({
      dbClient: db,
      templateType: "standard_uph",
      validRows,
      fileName: "uph.xlsx",
      importedById: "user-1"
    });

    expect(db.packageType.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { packageName: "QFN" }
    }));
    expect(db.uPHRoute.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        packageTypeId_processName: {
          packageTypeId: "package-1",
          processName: "Wire Bond"
        }
      },
      update: expect.objectContaining({ importBatchId: "batch-1" })
    }));
  });

  it("upserts standard usage rows and rejects ambiguous material codes", async () => {
    const db = createMockDb();
    const validRows: ValidImportRow[] = [
      {
        rowNumber: 2,
        data: {
          packageType: "QFN",
          costGroup: "main_material",
          itemName: "Lead Frame",
          materialCode: "LF-001",
          specification: "QFN-32",
          standardUsage: 1,
          usageUnit: "K",
          pricingMode: "CNY_PER_K"
        },
        raw: {}
      }
    ];

    await persistImportBatch({
      dbClient: db,
      templateType: "standard_usage",
      validRows,
      fileName: "usage.xlsx",
      importedById: "user-1"
    });

    expect(db.material.findMany).toHaveBeenCalledWith({
      where: { materialCode: "LF-001" },
      take: 2
    });
    expect(db.standardUsage.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        packageTypeId_costGroup_itemName_specificationId: {
          packageTypeId: "package-1",
          costGroup: "main_material",
          itemName: "Lead Frame",
          specificationId: "spec-1"
        }
      },
      update: expect.objectContaining({ importBatchId: "batch-1" })
    }));

    db.material.findMany.mockResolvedValueOnce([{ id: "material-1" }, { id: "material-2" }]);

    await expect(persistImportBatch({
      dbClient: db,
      templateType: "standard_usage",
      validRows,
      fileName: "usage.xlsx",
      importedById: "user-1"
    })).rejects.toThrow("Ambiguous materialCode: LF-001");
  });
});

function createMockDb() {
  const tx = {
    importBatch: {
      create: vi.fn().mockResolvedValue({ id: "batch-1" })
    },
    material: {
      upsert: vi.fn().mockResolvedValue({ id: "material-1" }),
      findMany: vi.fn().mockResolvedValue([{ id: "material-1" }])
    },
    specification: {
      upsert: vi.fn().mockResolvedValue({ id: "spec-1" })
    },
    supplier: {
      upsert: vi.fn().mockResolvedValue({ id: "supplier-1" })
    },
    supplierPrice: {
      upsert: vi.fn().mockResolvedValue({ id: "price-1" })
    },
    packageType: {
      upsert: vi.fn().mockResolvedValue({ id: "package-1" })
    },
    uPHRoute: {
      upsert: vi.fn().mockResolvedValue({ id: "uph-1" })
    },
    standardUsage: {
      upsert: vi.fn().mockResolvedValue({ id: "usage-1" })
    }
  };

  return {
    ...tx,
    $transaction: vi.fn((callback) => callback(tx))
  };
}
