import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  assertSupplierMatchesSpecification,
  listSupplierOptionsForSpecification
} from "../../../src/lib/domain/master-data/supplierPrices";

describe("supplier price filtering", () => {
  it("returns selectable suppliers for the matching specification", async () => {
    const db = createMockDb([
      supplierPriceRow({
        id: "price-1",
        specificationId: "spec-1",
        supplierId: "supplier-1",
        supplierName: "Supplier A",
        effectiveDate: "2026-05-01"
      })
    ]);

    const options = await listSupplierOptionsForSpecification({
      dbClient: db,
      specificationId: "spec-1",
      asOfDate: new Date("2026-06-01T00:00:00.000Z")
    });

    expect(db.supplierPrice.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        specificationId: "spec-1",
        effectiveDate: { lte: new Date("2026-06-01T00:00:00.000Z") },
        supplier: { status: "active" }
      }
    }));
    expect(options).toEqual([
      expect.objectContaining({
        supplierId: "supplier-1",
        supplierName: "Supplier A",
        price: "12.5",
        priceUnit: "CNY/K",
        material: expect.objectContaining({
          id: "material-1",
          materialCode: "LF-001",
          category: "lead_frame"
        })
      })
    ]);
  });

  it("excludes suppliers from other specifications", async () => {
    const db = createMockDb([
      supplierPriceRow({
        id: "price-1",
        specificationId: "spec-1",
        supplierId: "supplier-1"
      }),
      supplierPriceRow({
        id: "price-2",
        specificationId: "spec-2",
        supplierId: "supplier-2"
      })
    ]);

    const options = await listSupplierOptionsForSpecification({
      dbClient: db,
      specificationId: "spec-1",
      asOfDate: new Date("2026-06-01T00:00:00.000Z")
    });

    expect(options).toHaveLength(1);
    expect(options[0]?.supplierId).toBe("supplier-1");
  });

  it("excludes inactive suppliers and future effective prices", async () => {
    const db = createMockDb([
      supplierPriceRow({
        id: "price-1",
        specificationId: "spec-1",
        supplierId: "supplier-1",
        supplierStatus: "inactive",
        effectiveDate: "2026-05-01"
      }),
      supplierPriceRow({
        id: "price-2",
        specificationId: "spec-1",
        supplierId: "supplier-2",
        effectiveDate: "2026-07-01"
      }),
      supplierPriceRow({
        id: "price-3",
        specificationId: "spec-1",
        supplierId: "supplier-3",
        effectiveDate: "2026-05-15"
      })
    ]);

    const options = await listSupplierOptionsForSpecification({
      dbClient: db,
      specificationId: "spec-1",
      asOfDate: new Date("2026-06-01T00:00:00.000Z")
    });

    expect(options).toHaveLength(1);
    expect(options[0]?.supplierId).toBe("supplier-3");
  });

  it("keeps only the latest effective price per supplier and material", async () => {
    const db = createMockDb([
      supplierPriceRow({
        id: "price-old",
        specificationId: "spec-1",
        supplierId: "supplier-1",
        effectiveDate: "2026-04-01",
        price: "10"
      }),
      supplierPriceRow({
        id: "price-new",
        specificationId: "spec-1",
        supplierId: "supplier-1",
        effectiveDate: "2026-05-01",
        price: "12"
      })
    ]);

    const options = await listSupplierOptionsForSpecification({
      dbClient: db,
      specificationId: "spec-1",
      asOfDate: new Date("2026-06-01T00:00:00.000Z")
    });

    expect(options).toHaveLength(1);
    expect(options[0]).toEqual(expect.objectContaining({
      supplierPriceId: "price-new",
      price: "12"
    }));
  });

  it("validates that a supplier has an active effective price for a specification", async () => {
    const db = createMockDb([
      supplierPriceRow({
        id: "price-1",
        specificationId: "spec-1",
        supplierId: "supplier-1",
        effectiveDate: "2026-05-01"
      })
    ]);

    await expect(assertSupplierMatchesSpecification({
      dbClient: db,
      specificationId: "spec-1",
      supplierId: "supplier-1",
      asOfDate: new Date("2026-06-01T00:00:00.000Z")
    })).resolves.toEqual(expect.objectContaining({
      supplierId: "supplier-1",
      specificationId: "spec-1"
    }));

    await expect(assertSupplierMatchesSpecification({
      dbClient: db,
      specificationId: "spec-1",
      supplierId: "supplier-2",
      asOfDate: new Date("2026-06-01T00:00:00.000Z")
    })).rejects.toThrow("Supplier does not match the specification.");
  });
});

function createMockDb(rows: SupplierPriceRow[]) {
  return {
    supplierPrice: {
      findMany: vi.fn(async (args) => rows.filter((row) => {
        const where = args.where;
        return row.specificationId === where.specificationId
          && row.effectiveDate <= where.effectiveDate.lte
          && row.supplier.status === where.supplier.status;
      }))
    }
  };
}

type SupplierPriceRow = ReturnType<typeof supplierPriceRow>;

function supplierPriceRow(input: {
  id: string;
  specificationId: string;
  supplierId: string;
  supplierName?: string;
  supplierStatus?: string;
  effectiveDate?: string;
  price?: string;
}) {
  return {
    id: input.id,
    materialId: "material-1",
    specificationId: input.specificationId,
    supplierId: input.supplierId,
    price: new Prisma.Decimal(input.price ?? "12.5"),
    priceUnit: "CNY/K",
    effectiveDate: new Date(`${input.effectiveDate ?? "2026-05-01"}T00:00:00.000Z`),
    material: {
      id: "material-1",
      materialCode: "LF-001",
      category: "lead_frame",
      name: "Lead Frame 001",
      defaultUnit: "K"
    },
    specification: {
      id: input.specificationId,
      displayName: input.specificationId === "spec-1" ? "QFN-32" : "QFN-48"
    },
    supplier: {
      id: input.supplierId,
      name: input.supplierName ?? input.supplierId,
      status: input.supplierStatus ?? "active"
    },
    importBatch: {
      id: "batch-1",
      fileName: "prices.xlsx",
      importedAt: new Date("2026-05-01T00:00:00.000Z")
    }
  };
}
