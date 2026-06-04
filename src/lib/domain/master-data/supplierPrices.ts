import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

type SupplierPriceRunner = {
  supplierPrice: {
    findMany: (args: Prisma.SupplierPriceFindManyArgs) => Promise<SupplierPriceWithRelations[]>;
  };
};

type SupplierPriceWithRelations = Prisma.SupplierPriceGetPayload<{
  include: {
    material: true;
    specification: true;
    supplier: true;
    importBatch: {
      select: {
        id: true;
        fileName: true;
        importedAt: true;
      };
    };
  };
}>;

export type SupplierOption = {
  supplierPriceId: string;
  supplierId: string;
  supplierName: string;
  specificationId: string;
  specificationName: string;
  price: string;
  priceUnit: string;
  effectiveDate: string;
  material: {
    id: string;
    category: string;
    materialCode: string;
    name: string;
    defaultUnit: string;
  };
  importBatch: {
    id: string;
    fileName: string;
    importedAt: string;
  };
};

export type ListSupplierOptionsInput = {
  dbClient?: SupplierPriceRunner;
  specificationId: string;
  asOfDate?: Date;
};

export type AssertSupplierMatchesSpecificationInput = ListSupplierOptionsInput & {
  supplierId: string;
};

export async function listSupplierOptionsForSpecification(
  input: ListSupplierOptionsInput
): Promise<SupplierOption[]> {
  const asOfDate = input.asOfDate ?? new Date();
  const rows = await getRunner(input.dbClient).supplierPrice.findMany({
    where: {
      specificationId: input.specificationId,
      effectiveDate: { lte: asOfDate },
      supplier: { status: "active" }
    },
    include: {
      material: true,
      specification: true,
      supplier: true,
      importBatch: {
        select: {
          id: true,
          fileName: true,
          importedAt: true
        }
      }
    },
    orderBy: [
      { material: { category: "asc" } },
      { material: { materialCode: "asc" } },
      { supplier: { name: "asc" } },
      { effectiveDate: "desc" }
    ]
  });

  return latestPerSupplierMaterial(rows).map(toSupplierOption);
}

export async function assertSupplierMatchesSpecification(
  input: AssertSupplierMatchesSpecificationInput
): Promise<SupplierOption> {
  const options = await listSupplierOptionsForSpecification(input);
  const match = options.find((option) => option.supplierId === input.supplierId);

  if (!match) {
    throw new Error("Supplier does not match the specification.");
  }

  return match;
}

function getRunner(dbClient?: SupplierPriceRunner): SupplierPriceRunner {
  return (dbClient ?? db) as SupplierPriceRunner;
}

function latestPerSupplierMaterial(rows: SupplierPriceWithRelations[]) {
  const latest = new Map<string, SupplierPriceWithRelations>();

  for (const row of rows) {
    const key = `${row.materialId}:${row.supplierId}`;
    const existing = latest.get(key);

    if (!existing || row.effectiveDate > existing.effectiveDate) {
      latest.set(key, row);
    }
  }

  return Array.from(latest.values()).sort((left, right) => {
    const materialCategory = left.material.category.localeCompare(right.material.category);
    if (materialCategory !== 0) {
      return materialCategory;
    }

    const materialCode = left.material.materialCode.localeCompare(right.material.materialCode);
    if (materialCode !== 0) {
      return materialCode;
    }

    return left.supplier.name.localeCompare(right.supplier.name);
  });
}

function toSupplierOption(row: SupplierPriceWithRelations): SupplierOption {
  return {
    supplierPriceId: row.id,
    supplierId: row.supplierId,
    supplierName: row.supplier.name,
    specificationId: row.specificationId,
    specificationName: row.specification.displayName,
    price: row.price.toString(),
    priceUnit: row.priceUnit,
    effectiveDate: row.effectiveDate.toISOString(),
    material: {
      id: row.material.id,
      category: row.material.category,
      materialCode: row.material.materialCode,
      name: row.material.name,
      defaultUnit: row.material.defaultUnit
    },
    importBatch: {
      id: row.importBatch.id,
      fileName: row.importBatch.fileName,
      importedAt: row.importBatch.importedAt.toISOString()
    }
  };
}
